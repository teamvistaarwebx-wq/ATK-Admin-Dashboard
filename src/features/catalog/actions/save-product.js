"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { connectDb } from "@/db/connect";
import { Subcategory } from "@/models/subcategory.model";
import { parseProductForm } from "@/features/catalog/lib/product-input";
import {
  DUPLICATE_KEY,
  createProduct,
  updateProduct,
} from "@/features/catalog/lib/product-writer";
import { adjustStock } from "@/features/inventory/lib/stock-ledger";
import { MOVEMENT_REASON } from "@/constants/enums";
import { requireAdmin } from "@/lib/auth/dal";
import { revalidateStorefront } from "@/lib/revalidate-storefront";

/** The two lists a saved product can be returned to. */
const RETURN_PATHS = ["/products", "/made-to-order"];

/**
 * Creates or updates a product.
 *
 * One action for both: the parsing, validation and slug rules are identical,
 * and splitting them would mean maintaining that twice for the sake of one
 * `if`. A present `id` means update.
 *
 * Authorised in here rather than only behind the drawer — a server action is a
 * public endpoint (same reasoning as deleteProduct and updateInquiry). Editing
 * is not destructive, so every signed-in admin including `staff` may do it;
 * only deletion is role-gated.
 *
 * Returns `{ errors }` keyed by field name so the form can print each message
 * under the input that caused it.
 */
export async function saveProduct(_prevState, formData) {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const isUpdate = Boolean(id);

  if (isUpdate && !mongoose.Types.ObjectId.isValid(id)) {
    return { errors: { _form: "That product no longer exists." } };
  }

  const parsed = parseProductForm(formData);
  if (parsed.errors) return { errors: parsed.errors };

  const { values, openingStock, stockDelta, sku } = parsed;

  await connectDb();

  // The form posts a subcategory; the category is whatever owns it. Asking for
  // both would let the two disagree, and this doubles as validation that the
  // id is a real, active subcategory rather than anything that was posted.
  const subcategory = await Subcategory.findOne({
    _id: values.subcategory,
    isActive: true,
  })
    .select("category name")
    .lean();

  if (!subcategory) return { errors: { subcategory: "Choose a category." } };

  const document = { ...values, category: subcategory.category };

  try {
    if (isUpdate) {
      const saved = await updateProduct(id, document, session.adminId);
      if (!saved)
        return { errors: { _form: "That product no longer exists." } };

      /**
       * Stock is edited on the product, like Shopify, rather than on a
       * separate screen. It still goes through the ledger: the form posts the
       * count it opened with, the difference is logged as a correction, and
       * the sum of movements keeps matching what is on the shelf.
       */
      if (stockDelta !== 0 && saved.trackInventory && saved.sku) {
        const result = await adjustStock({
          productId: saved._id,
          sku: saved.sku,
          delta: stockDelta,
          reason: MOVEMENT_REASON.ADJUSTMENT,
          note: "Changed on the product page",
          actor: session.adminId,
        });
        if (result.error) {
          return {
            errors: {
              stockQuantity: `Product saved, but the stock was not changed: ${result.error}`,
            },
          };
        }
      }
    } else {
      const created = await createProduct(
        document,
        session.adminId,
        subcategory,
        sku
      );

      /**
       * Opening stock goes through the ledger like every other quantity, so a
       * new product's first units are logged as a restock rather than
       * appearing from nowhere. Without this a product is born Sold Out.
       *
       * An edit adjusts by the difference instead (above), so fixing a typo
       * in the description never re-adds the opening count.
       */
      if (openingStock > 0) {
        await adjustStock({
          productId: created._id,
          sku: created.sku,
          delta: openingStock,
          reason: MOVEMENT_REASON.RESTOCK,
          note: "Opening stock",
          actor: session.adminId,
        });
      }
    }
  } catch (error) {
    const fieldErrors = toFieldErrors(error, sku);
    if (fieldErrors) return { errors: fieldErrors };
    throw error;
  }

  revalidatePath("/products");
  revalidatePath("/made-to-order");
  revalidatePath("/inventory");
  // The dashboard counts catalogue size and stock per subcategory.
  revalidatePath("/");

  // The storefront caches its product reads for five minutes. Ping it so a
  // new or edited product shows now — after the response, so the drawer
  // closes without waiting on another app that may not even be running.
  after(() => revalidateStorefront("products"));

  // Sending the browser back to the list is what closes the drawer — the
  // ?new / ?edit param goes away and the component unmounts.
  redirect(safeReturnTo(formData.get("returnTo")));
}

/**
 * Turns the failures an admin can actually cause into a message under the
 * right field. Anything else is a real bug and should reach the error boundary
 * rather than be flattened into a form message.
 */
function toFieldErrors(error, typedSku = "") {
  if (error?.code === DUPLICATE_KEY) {
    const field = Object.keys(error.keyPattern ?? {})[0] ?? "";
    // A typed SKU that is already taken — say so under the SKU field.
    if (typedSku && field.includes("sku")) {
      return { sku: "Another product already uses this SKU." };
    }
    // Both are generated now, so a clash here means a race we lost rather than
    // anything typed — say something retryable instead of naming a field the
    // form no longer shows.
    if (field === "slug" || field.includes("sku")) {
      return {
        _form: "Something else was saved at the same moment. Try again.",
      };
    }
    return { _form: "Another product already uses one of those values." };
  }

  // The pre-validate hook throws plain Errors; Mongoose wraps field rules in a
  // ValidationError. Both carry a message worth showing.
  if (error?.name === "ValidationError") {
    const first = Object.values(error.errors ?? {})[0];
    return { _form: first?.message ?? "Some fields need another look." };
  }

  return null;
}

/**
 * `returnTo` comes from the browser, and redirect() will happily send someone
 * to another origin. Only a path back into one of the two product lists is
 * allowed — "//evil.example" included, which is a protocol-relative URL, not a
 * path.
 */
function safeReturnTo(value) {
  const target = String(value ?? "");

  if (target.startsWith("//")) return "/products";

  const allowed = RETURN_PATHS.some(
    (path) =>
      target === path ||
      target.startsWith(`${path}?`) ||
      target.startsWith(`${path}/`)
  );

  return allowed ? target : "/products";
}
