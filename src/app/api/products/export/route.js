import { connectDb } from "@/db/connect";
import { Category } from "@/models/category.model";
import { Inventory } from "@/models/inventory.model";
import { Product } from "@/models/product.model";
import { Subcategory } from "@/models/subcategory.model";
import { IN_STOCK_FILTER } from "@/constants/enums";
import { IMPORT_COLUMNS } from "@/features/catalog/lib/product-import";
import { pickColour, toRupeeInput } from "@/features/catalog/lib/product-input";
import { getSession } from "@/lib/auth/session";
import { toCsv } from "@/lib/csv";
import { todayKey } from "@/lib/date-range";
import { serverError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const GST_LABEL = { GST_5: "5", GST_12: "12", GST_18: "18", EXEMPT: "exempt" };

/**
 * GET /api/products/export — the in-stock catalogue as the import CSV.
 *
 * Exactly the import's columns, so the file can be edited in a spreadsheet
 * and uploaded straight back: matching SKUs update, quantities become the new
 * stock. Made-to-order pieces are left out; they have no stock to manage.
 *
 * Session-checked: getSession answers a signed-out caller with a 401 rather
 * than redirecting a download to the login page.
 */
export async function GET() {
  const session = await getSession();
  if (!session)
    return Response.json({ error: "Not signed in" }, { status: 401 });

  try {
    await connectDb();

    const [products, stock, subcategories, categories] = await Promise.all([
      Product.find({
        isDeleted: false,
        hasVariants: { $ne: true },
        ...IN_STOCK_FILTER,
      })
        .sort({ createdAt: -1 })
        .lean(),
      Inventory.aggregate([
        { $group: { _id: "$productId", onHand: { $sum: "$onHand" } } },
      ]),
      Subcategory.find({}).select("name category").lean(),
      Category.find({}).select("name").lean(),
    ]);

    const onHand = new Map(stock.map((row) => [String(row._id), row.onHand]));
    const categoryName = new Map(
      categories.map((c) => [String(c._id), c.name])
    );
    const subcategory = new Map(
      subcategories.map((s) => [
        String(s._id),
        { name: s.name, parent: categoryName.get(String(s.category)) ?? "" },
      ])
    );

    const rows = products.map((product) => {
      const sub = subcategory.get(String(product.subcategory)) ?? {
        name: "",
        parent: "",
      };
      const images = (product.images ?? []).toSorted(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      );
      const yesNo = (value) => (value ? "yes" : "no");

      return {
        sku: product.sku ?? "",
        title: product.title,
        category: sub.name,
        parent_category: sub.parent,
        type: product.type ?? "",
        colour: pickColour(product.details),
        status: product.status,
        price: toRupeeInput(product.price),
        compare_at_price: toRupeeInput(product.compareAtPrice),
        cost_price: toRupeeInput(product.costPrice),
        quantity:
          product.trackInventory === false
            ? ""
            : String(onHand.get(String(product._id)) ?? 0),
        low_stock_threshold: String(product.lowStockThreshold ?? 5),
        continue_selling: yesNo(product.allowBackorder),
        track_inventory: yesNo(product.trackInventory !== false),
        description: product.description ?? "",
        short_description: product.shortDescription ?? "",
        tags: (product.tags ?? []).join(", "),
        occasions: (product.suggestedOccasions ?? []).join(" | "),
        image_1: images[0]?.url ?? "",
        image_2: images[1]?.url ?? "",
        image_3: images[2]?.url ?? "",
        image_4: images[3]?.url ?? "",
        image_alt: images[0]?.alt ?? "",
        seo_title: product.seo?.metaTitle ?? "",
        seo_description: product.seo?.metaDescription ?? "",
        hsn_code: product.hsnCode ?? "",
        gst_rate:
          product.taxable === false
            ? "exempt"
            : (GST_LABEL[product.taxClass] ?? "5"),
        weight_grams: product.weight == null ? "" : String(product.weight),
      };
    });

    const csv = toCsv(
      rows,
      IMPORT_COLUMNS.map((column) => ({
        header: column.header,
        value: (row) => row[column.key],
      }))
    );

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="products_${todayKey()}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/products/export failed:", error);
    return serverError("Could not export products");
  }
}
