"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { connectDb } from "@/db/connect";
import { Category } from "@/models/category.model";
import { Product } from "@/models/product.model";
import { Subcategory } from "@/models/subcategory.model";
import { MOVEMENT_REASON, PRODUCT_STATUS } from "@/constants/enums";
import { getProductForForm } from "@/features/catalog/queries/get-product-for-form";
import {
  normaliseSku,
  parseProductForm,
} from "@/features/catalog/lib/product-input";
import {
  IMPORT_BATCH_SIZE,
  IMPORT_COLUMNS,
  NEW_PRODUCT_FORM,
  checkImportRow,
  formToFormData,
  isImageUrl,
  mergeRowIntoForm,
  resolveCategory,
} from "@/features/catalog/lib/product-import";
import {
  DUPLICATE_KEY,
  createProduct,
  updateProduct,
} from "@/features/catalog/lib/product-writer";
import { adjustStock } from "@/features/inventory/lib/stock-ledger";
import { requireAdmin } from "@/lib/auth/dal";
import { revalidateStorefront } from "@/lib/revalidate-storefront";

const COLUMN_KEYS = IMPORT_COLUMNS.map((column) => column.key);
const LONG_COLUMNS = new Set(["description"]);

/**
 * Imports one batch of CSV rows. The browser parses and previews the file,
 * uploads any photos picked alongside it, then calls this once per batch of
 * twenty so a 150-product file shows progress and never hits the 1MB body
 * limit on a server action.
 *
 * Every row is checked again here — the preview is a convenience, the server
 * is the boundary — and then goes through `parseProductForm`, the product
 * drawer's own parser, so an imported product is indistinguishable from one
 * typed in.
 *
 * Inventory comes with it: a new product's `quantity` is its opening stock,
 * and an updated product's count is moved to the file's figure through the
 * ledger, logged as a correction.
 *
 * Rows are independent. One bad row is reported and the rest carry on.
 */
export async function importProducts({
  rows,
  updateExisting = false,
  defaultStatus,
} = {}) {
  const session = await requireAdmin();

  if (!Array.isArray(rows) || rows.length === 0)
    return { error: "Nothing to import." };
  if (rows.length > IMPORT_BATCH_SIZE) {
    return { error: `Send at most ${IMPORT_BATCH_SIZE} rows at a time.` };
  }

  await connectDb();

  const categories = await loadCategories();
  const context = {
    categories,
    updateExisting: Boolean(updateExisting),
    defaultStatus: [PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.DRAFT].includes(
      defaultStatus
    )
      ? defaultStatus
      : PRODUCT_STATUS.DRAFT,
    adminId: session.adminId,
  };

  const results = [];
  // In order, not in parallel: two rows can share a SKU block, and the SKU
  // generator reads the highest number before it writes the next.
  for (const raw of rows) {
    const row = sanitise(raw);
    try {
      results.push(await importRow(row, context));
    } catch (error) {
      console.error(`Import row ${row.line} failed:`, error);
      results.push(failure(row, ["Could not be saved. Try this row again."]));
    }
  }

  if (
    results.some(
      (result) => result.status === "created" || result.status === "updated"
    )
  ) {
    revalidatePath("/products");
    revalidatePath("/inventory");
    revalidatePath("/");
    after(() => revalidateStorefront("products"));
  }

  return { results };
}

async function importRow(
  row,
  { categories, updateExisting, defaultStatus, adminId }
) {
  const sku = normaliseSku(row.sku);

  // The unique index counts deleted products too, so look there as well.
  const holder = sku
    ? await Product.findOne({ sku }).select("_id isDeleted").lean()
    : null;

  if (holder?.isDeleted) {
    return failure(row, [
      "This SKU belongs to a deleted product. Use a different one.",
    ]);
  }
  if (holder && !updateExisting) {
    return {
      line: row.line,
      sku,
      title: row.title ?? "",
      status: "skipped",
      messages: [
        "A product with this SKU already exists. Tick “Update existing products” to change it.",
      ],
    };
  }

  const isNew = !holder;
  const errors = checkImportRow(row, {
    categories,
    isNew,
    // Anything still a bare file name failed to upload in the browser.
    resolveImage: isImageUrl,
  });
  if (errors.length > 0) return failure(row, errors);

  const category = row.category
    ? resolveCategory(row, categories).category
    : null;
  const base = isNew
    ? NEW_PRODUCT_FORM
    : await getProductForForm(String(holder._id));
  if (!base) return failure(row, ["That product no longer exists."]);

  const form = mergeRowIntoForm(row, base, { category, defaultStatus });
  const formData = formToFormData(form);
  if (isNew && sku) formData.set("sku", sku);
  if (row.quantity) {
    formData.set("stockQuantity", row.quantity);
    if (!isNew) formData.set("stockOriginal", String(base.onHand ?? 0));
  }

  const parsed = parseProductForm(formData);
  if (parsed.errors) return failure(row, Object.values(parsed.errors));

  const subcategory = categories.find(
    (c) => c.id === parsed.values.subcategory
  );
  if (!subcategory) return failure(row, ["Choose a category."]);

  const document = { ...parsed.values, category: subcategory.categoryId };

  try {
    if (isNew) {
      const created = await createProduct(
        document,
        adminId,
        { _id: subcategory.id, name: subcategory.name },
        parsed.sku
      );

      if (parsed.openingStock > 0) {
        await adjustStock({
          productId: created._id,
          sku: created.sku,
          delta: parsed.openingStock,
          reason: MOVEMENT_REASON.RESTOCK,
          note: "Opening stock (CSV import)",
          actor: adminId,
        });
      }

      return {
        line: row.line,
        sku: created.sku,
        title: created.title,
        id: String(created._id),
        status: "created",
        messages: [],
      };
    }

    const saved = await updateProduct(String(holder._id), document, adminId);
    if (!saved) return failure(row, ["That product no longer exists."]);

    const messages = [];
    if (parsed.stockDelta !== 0 && saved.trackInventory && saved.sku) {
      const result = await adjustStock({
        productId: saved._id,
        sku: saved.sku,
        delta: parsed.stockDelta,
        reason: MOVEMENT_REASON.ADJUSTMENT,
        note: "Set by CSV import",
        actor: adminId,
      });
      if (result.error)
        messages.push(`Saved, but stock was not changed: ${result.error}`);
    }

    return {
      line: row.line,
      sku: saved.sku,
      title: saved.title,
      id: String(saved._id),
      status: "updated",
      messages,
    };
  } catch (error) {
    if (error?.code === DUPLICATE_KEY) {
      const field = Object.keys(error.keyPattern ?? {})[0] ?? "";
      return failure(row, [
        field.includes("sku")
          ? "Another product already uses this SKU."
          : "Clashed with another product being saved. Try again.",
      ]);
    }
    if (error?.name === "ValidationError") {
      const first = Object.values(error.errors ?? {})[0];
      return failure(row, [first?.message ?? "Some fields need another look."]);
    }
    throw error;
  }
}

/** Subcategories with the category each sits under, for name lookups. */
async function loadCategories() {
  const [categories, subcategories] = await Promise.all([
    Category.find({ isActive: true }).select("name").lean(),
    Subcategory.find({ isActive: true }).select("name category").lean(),
  ]);

  const names = new Map(categories.map((c) => [String(c._id), c.name]));

  return subcategories
    .filter((sub) => names.has(String(sub.category)))
    .map((sub) => ({
      id: String(sub._id),
      name: sub.name,
      categoryId: sub.category,
      parentName: names.get(String(sub.category)),
    }));
}

/**
 * Rows arrive from the browser, so only known columns survive, as trimmed
 * strings of a sane length.
 */
function sanitise(raw) {
  const row = { line: Number.parseInt(raw?.line, 10) || 0 };
  for (const key of COLUMN_KEYS) {
    const value = raw?.[key];
    if (value == null || value === "") continue;
    row[key] = String(value)
      .trim()
      .slice(0, LONG_COLUMNS.has(key) ? 10000 : 1000);
  }
  return row;
}

function failure(row, messages) {
  return {
    line: row.line,
    sku: row.sku ?? "",
    title: row.title ?? "",
    status: "failed",
    messages,
  };
}
