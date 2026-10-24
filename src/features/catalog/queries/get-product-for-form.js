import mongoose from "mongoose";
import { connectDb } from "@/db/connect";
import { Inventory } from "@/models/inventory.model";
import { Product } from "@/models/product.model";
import { FULFILLMENT } from "@/constants/enums";
import {
  pickColour,
  toRupeeInput,
  withoutColour,
} from "@/features/catalog/lib/product-input";

/**
 * One product, shaped for the edit drawer.
 *
 * Not getProduct(): that is the storefront contract, hard-scoped to published
 * products and stripped of everything admin-only — you could not edit a draft
 * with it, and costPrice and internalNotes would be missing.
 *
 * Prices come back as rupee strings and arrays as plain arrays, so the client
 * component can drop them straight into `defaultValue` without converting
 * anything. Only these fields cross the boundary; the aggregate counters,
 * timestamps and audit ids stay on the server.
 */
const FORM_FIELDS =
  "title slug sku subcategory type tags suggestedOccasions description " +
  "shortDescription details images price compareAtPrice costPrice taxable " +
  "taxClass hsnCode trackInventory allowBackorder lowStockThreshold weight " +
  "isGiftable allowGiftMessage giftWrapAvailable giftBoxCompatible " +
  "internalNotes status fulfillment seo";

export async function getProductForForm(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  await connectDb();

  // Deleted products are gone as far as the admin is concerned — a stale
  // ?edit= link must not resurrect one.
  const doc = await Product.findOne({ _id: id, isDeleted: false })
    .select(FORM_FIELDS)
    .lean();

  if (!doc) return null;

  /**
   * Editable on the form, as in Shopify: the product page is where stock is
   * set, with no separate trip to Inventory. The save turns a changed count
   * into a logged adjustment (see saveProduct). Summed across warehouses,
   * matching how availability is counted everywhere else; `reserved` is shown
   * beside it so nobody counts held stock as gone.
   */
  const [stock] = await Inventory.aggregate([
    { $match: { productId: doc._id } },
    {
      $group: {
        _id: null,
        onHand: { $sum: "$onHand" },
        reserved: { $sum: "$reserved" },
      },
    },
  ]);

  return {
    onHand: stock?.onHand ?? 0,
    reserved: stock?.reserved ?? 0,
    id: String(doc._id),
    title: doc.title ?? "",
    // Read-only in the drawer once saved. The slug is the product's public
    // web address and the SKU keys its inventory rows; changing either would
    // orphan what points at it.
    slug: doc.slug ?? "",
    sku: doc.sku ?? "",

    subcategory: doc.subcategory ? String(doc.subcategory) : "",
    type: doc.type ?? "",
    tags: doc.tags ?? [],
    suggestedOccasions: doc.suggestedOccasions ?? [],

    description: doc.description ?? "",
    shortDescription: doc.shortDescription ?? "",
    colour: pickColour(doc.details),
    details: withoutColour(doc.details).map((row) => ({
      label: row.label,
      value: row.value,
    })),

    images: (doc.images ?? [])
      .toSorted((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((image) => ({ url: image.url, alt: image.alt ?? "" })),

    price: toRupeeInput(doc.price),
    compareAtPrice: toRupeeInput(doc.compareAtPrice),
    costPrice: toRupeeInput(doc.costPrice),
    taxable: doc.taxable !== false,
    taxClass: doc.taxClass ?? "",
    hsnCode: doc.hsnCode ?? "",

    trackInventory: doc.trackInventory !== false,
    allowBackorder: Boolean(doc.allowBackorder),
    lowStockThreshold: doc.lowStockThreshold ?? 5,

    // Grams throughout — the unit picker is gone, and nothing reads this yet
    // anyway. It is captured now so a courier integration is not a re-entry
    // job across the whole catalogue.
    weight: doc.weight ?? "",

    isGiftable: doc.isGiftable !== false,
    allowGiftMessage: doc.allowGiftMessage !== false,
    giftWrapAvailable: Boolean(doc.giftWrapAvailable),
    giftBoxCompatible: Boolean(doc.giftBoxCompatible),

    internalNotes: doc.internalNotes ?? "",
    seoTitle: doc.seo?.metaTitle ?? "",
    seoDescription: doc.seo?.metaDescription ?? "",
    status: doc.status ?? "",
    // Older products have no field at all — they are in stock.
    fulfillment: doc.fulfillment ?? FULFILLMENT.IN_STOCK,
  };
}
