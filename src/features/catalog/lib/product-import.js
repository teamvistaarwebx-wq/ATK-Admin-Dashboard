/**
 * The product CSV — one format for the sample file, the import and the
 * export, so a downloaded catalogue can be edited and uploaded straight back.
 *
 * Imported by the browser (to preview and check a file before anything is
 * sent) and by the server action (which checks every row again — the browser
 * is a convenience, not a boundary), so it may import nothing server-side.
 *
 * Inventory is part of the row. A product created from the file is created
 * with its stock, and an updated product has its count set to the file's
 * `quantity` — there is no second "inventory CSV" to keep in step.
 */
import { MAX_PRODUCT_IMAGES } from "@/constants/media";
import { MAX_STOCK, isValidSku, normaliseSku } from "./product-input";

/** One batch per server-action call. Small enough to stay under the 1MB body. */
export const IMPORT_BATCH_SIZE = 20;
/** Typical batches are 100–150; this leaves room without inviting a 10k file. */
export const MAX_IMPORT_ROWS = 1000;

/**
 * Every column, in template order. `required` is for a NEW product; an update
 * only changes the columns that have a value in them.
 */
export const IMPORT_COLUMNS = [
  { key: "sku", header: "SKU", note: "Your code, or blank to generate one. Matches existing products when updating." },
  { key: "title", header: "Title", required: true, note: "Product name." },
  { key: "category", header: "Category", required: true, note: "A category name exactly as in the admin, e.g. Saree." },
  { key: "parent_category", header: "Parent category", note: "Only when the name exists twice, e.g. Women or Men." },
  { key: "type", header: "Type", note: "Fabric or type, e.g. Banarasi Silk." },
  { key: "colour", header: "Colour", note: "Becomes the first specification row." },
  { key: "status", header: "Status", note: "active, draft or archived. Blank uses the import setting." },
  { key: "price", header: "Price", required: true, note: "Rupees, e.g. 14559 or 14559.50." },
  { key: "compare_at_price", header: "Compare-at price", note: "MRP, shown struck through. Must be above Price." },
  { key: "cost_price", header: "Cost price", note: "Admin only." },
  { key: "quantity", header: "Quantity", note: "Units on hand. Sets the stock." },
  { key: "low_stock_threshold", header: "Low stock alert", note: "Default 5." },
  { key: "continue_selling", header: "Continue selling when out of stock", note: "yes or no." },
  { key: "track_inventory", header: "Track inventory", note: "yes (default) or no." },
  { key: "description", header: "Description", required: true, note: "Plain text. Line breaks are kept." },
  { key: "short_description", header: "Short description", note: "One line for cards and previews." },
  { key: "tags", header: "Tags", note: "Separated by commas or |." },
  { key: "occasions", header: "Occasions", note: "Separated by commas or |." },
  { key: "image_1", header: "Image 1", required: true, note: "A URL, or the file name of a photo picked with the CSV. The featured photo." },
  { key: "image_2", header: "Image 2" },
  { key: "image_3", header: "Image 3" },
  { key: "image_4", header: "Image 4" },
  { key: "image_alt", header: "Image alt text", note: "Describes the featured photo for screen readers." },
  { key: "seo_title", header: "SEO title", note: "Google page title, up to 70 characters." },
  { key: "seo_description", header: "SEO description", note: "Google meta description, up to 320 characters." },
  { key: "hsn_code", header: "HSN code" },
  { key: "gst_rate", header: "GST rate", note: "5, 12, 18 or exempt. Default 5." },
  { key: "weight_grams", header: "Weight (grams)" },
];

export const IMAGE_KEYS = ["image_1", "image_2", "image_3", "image_4"];

/**
 * What a spreadsheet, a supplier or a Shopify export is likely to call each
 * column. Headers are normalised first ("SEO Title" → "seo_title").
 */
const ALIASES = {
  name: "title",
  product_name: "title",
  product_title: "title",
  variant_sku: "sku",
  subcategory: "category",
  product_category: "category",
  collection: "category",
  category_parent: "parent_category",
  product_type: "type",
  fabric: "type",
  color: "colour",
  variant_price: "price",
  selling_price: "price",
  mrp: "compare_at_price",
  variant_compare_at_price: "compare_at_price",
  compare_price: "compare_at_price",
  cost: "cost_price",
  cost_per_item: "cost_price",
  qty: "quantity",
  stock: "quantity",
  inventory: "quantity",
  inventory_quantity: "quantity",
  variant_inventory_qty: "quantity",
  on_hand: "quantity",
  opening_stock: "quantity",
  low_stock: "low_stock_threshold",
  low_stock_alert: "low_stock_threshold",
  backorder: "continue_selling",
  allow_backorder: "continue_selling",
  continue_selling_when_out_of_stock: "continue_selling",
  body: "description",
  body_html: "description",
  image: "image_1",
  image_src: "image_1",
  image_url: "image_1",
  featured_image: "image_1",
  image_alt_text: "image_alt",
  meta_title: "seo_title",
  page_title: "seo_title",
  meta_description: "seo_description",
  hsn: "hsn_code",
  gst: "gst_rate",
  tax_rate: "gst_rate",
  weight: "weight_grams",
  weight_g: "weight_grams",
  variant_grams: "weight_grams",
};

const KNOWN = new Set(IMPORT_COLUMNS.map((c) => c.key));

/** `images` (one cell, | separated) is accepted as well as image_1…image_4. */
export function canonicalKey(header) {
  if (KNOWN.has(header) || header === "images") return header;
  return ALIASES[header] ?? null;
}

/** A parsed CSV record → only the known columns, under their canonical names. */
export function normaliseImportRecord(record) {
  const row = { line: record._line };

  for (const [header, value] of Object.entries(record)) {
    const key = canonicalKey(header);
    if (!key || value === "") continue;
    if (key === "images") {
      splitList(value).forEach((url, index) => {
        const slot = IMAGE_KEYS[index];
        if (slot && !row[slot]) row[slot] = url;
      });
    } else if (!(key in row)) {
      row[key] = value;
    }
  }

  return row;
}

export function splitList(value) {
  return String(value ?? "")
    .split(/[|,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** The image cells of a row, in order. */
export function rowImages(row) {
  return IMAGE_KEYS.map((key) => row[key]).filter(Boolean);
}

/** A URL or a site path — anything else is a file name still to upload. */
export function isImageUrl(value) {
  return /^https?:\/\//i.test(value) || value.startsWith("/");
}

const YES = new Set(["yes", "y", "true", "1", "on"]);
const NO = new Set(["no", "n", "false", "0", "off"]);

export function readBoolean(value) {
  const text = String(value ?? "").trim().toLowerCase();
  if (YES.has(text)) return true;
  if (NO.has(text)) return false;
  return null;
}

const GST = { "5": "GST_5", "12": "GST_12", "18": "GST_18", gst_5: "GST_5", gst_12: "GST_12", gst_18: "GST_18" };

function readGst(value) {
  const text = String(value ?? "").trim().toLowerCase().replace(/%$/, "").replace(/^gst\s*/, "");
  if (!text) return { taxClass: null, taxable: null };
  if (["exempt", "0", "none", "nil"].includes(text)) return { taxClass: "GST_5", taxable: false };
  const taxClass = GST[text] ?? GST[`gst_${text}`];
  return taxClass ? { taxClass, taxable: true } : { error: "GST rate must be 5, 12, 18 or exempt." };
}

/** "₹14,559.50" → "14559.50"; blank stays blank. */
function cleanMoney(value) {
  return String(value ?? "").replace(/[₹,\s]/g, "").replace(/^rs\.?/i, "");
}

/**
 * Finds the category a row names. `categories` is
 * `[{ id, name, parentName }]` — subcategories with the category they sit
 * under. "Women > Saree" in the cell works as well as a parent column.
 */
export function resolveCategory(row, categories) {
  let name = String(row.category ?? "").trim();
  let parent = String(row.parent_category ?? "").trim();

  if (!name) return { error: "Category is required." };

  const split = name.split(/\s*[>/]\s*/);
  if (split.length === 2) [parent, name] = split;

  const matches = categories.filter(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  const narrowed = parent
    ? matches.filter((c) => c.parentName.toLowerCase() === parent.toLowerCase())
    : matches;

  if (narrowed.length === 1) return { category: narrowed[0] };
  if (matches.length === 0) return { error: `No category called “${name}”.` };
  if (narrowed.length === 0) return { error: `“${name}” is not under “${parent}”.` };
  return {
    error: `“${name}” exists under ${matches.map((c) => c.parentName).join(" and ")} — fill in Parent category.`,
  };
}

/**
 * The checks that can run without the database: required columns, numbers
 * that are numbers, a category that exists, images that resolve. Returns a
 * list of messages, empty when the row is fine.
 *
 * `isNew` relaxes nothing on an update except the required columns — a row
 * updating a product only needs the SKU and what is changing.
 */
export function checkImportRow(row, { categories, isNew, resolveImage }) {
  const errors = [];

  if (isNew) {
    for (const column of IMPORT_COLUMNS) {
      if (column.required && !row[column.key]) errors.push(`${column.header} is required.`);
    }
  }

  if (row.sku && !isValidSku(normaliseSku(row.sku))) {
    errors.push("SKU: letters, numbers and / - _ . only, 2 to 48 characters.");
  }

  // A missing category on a new row is already reported as required.
  if (row.category) {
    const resolved = resolveCategory(row, categories);
    if (resolved.error) errors.push(resolved.error);
  }

  for (const key of ["price", "compare_at_price", "cost_price"]) {
    if (!row[key]) continue;
    const value = Number(cleanMoney(row[key]));
    if (!Number.isFinite(value) || value < 0) {
      errors.push(`${IMPORT_COLUMNS.find((c) => c.key === key).header} must be a number.`);
    }
  }
  if (row.price && row.compare_at_price && Number(cleanMoney(row.compare_at_price)) < Number(cleanMoney(row.price))) {
    errors.push("Compare-at price must be higher than Price.");
  }

  for (const key of ["quantity", "low_stock_threshold", "weight_grams"]) {
    if (!row[key]) continue;
    const value = Number(row[key]);
    if (!Number.isInteger(value) || value < 0) {
      errors.push(`${IMPORT_COLUMNS.find((c) => c.key === key).header} must be a whole number.`);
    }
  }
  if (row.quantity && Number(row.quantity) > MAX_STOCK) errors.push("Quantity looks like a typo.");

  for (const key of ["continue_selling", "track_inventory"]) {
    if (row[key] && readBoolean(row[key]) == null) {
      errors.push(`${IMPORT_COLUMNS.find((c) => c.key === key).header} must be yes or no.`);
    }
  }

  if (row.status && !["active", "draft", "archived"].includes(row.status.toLowerCase())) {
    errors.push("Status must be active, draft or archived.");
  }
  if (row.gst_rate && readGst(row.gst_rate).error) errors.push(readGst(row.gst_rate).error);

  const images = rowImages(row);
  if (images.length > MAX_PRODUCT_IMAGES) {
    errors.push(`At most ${MAX_PRODUCT_IMAGES} images per product.`);
  }
  for (const image of images) {
    if (!resolveImage(image)) {
      errors.push(`Image “${image}” is not a URL and was not among the photos picked.`);
    }
  }

  if (row.seo_title && row.seo_title.length > 70) errors.push("SEO title is over 70 characters.");
  if (row.seo_description && row.seo_description.length > 320) {
    errors.push("SEO description is over 320 characters.");
  }

  return errors;
}

/**
 * Lays a row over a product in the edit drawer's shape (getProductForForm),
 * so the import goes through exactly the same parser as the form. Columns the
 * row leaves blank keep `base`'s value — that is what makes an update change
 * only what the file changes.
 */
export function mergeRowIntoForm(row, base, { category, defaultStatus }) {
  const form = { ...base };

  if (row.title) form.title = row.title;
  if (category) form.subcategory = category.id;
  if (row.type) form.type = row.type;
  if (row.colour) form.colour = row.colour;
  if (row.status) form.status = row.status.toLowerCase();
  else if (!base.id) form.status = defaultStatus;

  if (row.price) form.price = cleanMoney(row.price);
  if (row.compare_at_price) form.compareAtPrice = cleanMoney(row.compare_at_price);
  if (row.cost_price) form.costPrice = cleanMoney(row.cost_price);

  const track = readBoolean(row.track_inventory);
  if (track != null) form.trackInventory = track;
  const backorder = readBoolean(row.continue_selling);
  if (backorder != null) form.allowBackorder = backorder;
  if (row.low_stock_threshold) form.lowStockThreshold = row.low_stock_threshold;

  if (row.description) form.description = row.description;
  if (row.short_description) form.shortDescription = row.short_description;
  if (row.tags) form.tags = splitList(row.tags);
  if (row.occasions) form.suggestedOccasions = splitList(row.occasions);

  const images = rowImages(row);
  if (images.length > 0) {
    form.images = images.map((url, index) => ({
      url,
      alt: index === 0 ? (row.image_alt ?? "") : "",
    }));
  } else if (row.image_alt && form.images?.length) {
    form.images = form.images.map((image, index) =>
      index === 0 ? { ...image, alt: row.image_alt } : image
    );
  }

  if (row.seo_title) form.seoTitle = row.seo_title;
  if (row.seo_description) form.seoDescription = row.seo_description;
  if (row.hsn_code) form.hsnCode = row.hsn_code;
  if (row.gst_rate) {
    const gst = readGst(row.gst_rate);
    form.taxable = gst.taxable;
    form.taxClass = gst.taxClass;
  }
  if (row.weight_grams) form.weight = row.weight_grams;

  return form;
}

/** A new product's starting point — the same defaults the empty form has. */
export const NEW_PRODUCT_FORM = {
  title: "",
  subcategory: "",
  type: "",
  colour: "",
  tags: [],
  suggestedOccasions: [],
  description: "",
  shortDescription: "",
  details: [],
  images: [],
  price: "",
  compareAtPrice: "",
  costPrice: "",
  taxable: true,
  taxClass: "GST_5",
  hsnCode: "",
  trackInventory: true,
  allowBackorder: false,
  lowStockThreshold: 5,
  weight: "",
  isGiftable: true,
  allowGiftMessage: true,
  giftWrapAvailable: false,
  giftBoxCompatible: false,
  internalNotes: "",
  seoTitle: "",
  seoDescription: "",
  status: "draft",
  fulfillment: "in_stock",
};

/**
 * The drawer's shape → the FormData the drawer would post. Checkboxes are
 * present only when ticked, which is how parseProductForm reads them.
 */
export function formToFormData(form) {
  const data = new FormData();
  const text = (name, value) => data.set(name, value == null ? "" : String(value));

  text("title", form.title);
  text("subcategory", form.subcategory);
  text("type", form.type);
  text("colour", form.colour);
  text("status", form.status);
  text("fulfillment", form.fulfillment || "in_stock");
  text("description", form.description);
  text("shortDescription", form.shortDescription);
  text("price", form.price);
  text("compareAtPrice", form.compareAtPrice);
  text("costPrice", form.costPrice);
  text("taxClass", form.taxClass);
  text("hsnCode", form.hsnCode);
  text("lowStockThreshold", form.lowStockThreshold);
  text("weight", form.weight);
  text("internalNotes", form.internalNotes);
  text("seoTitle", form.seoTitle);
  text("seoDescription", form.seoDescription);

  data.set("tags", JSON.stringify(form.tags ?? []));
  data.set("suggestedOccasions", JSON.stringify(form.suggestedOccasions ?? []));
  data.set("details", JSON.stringify(form.details ?? []));
  data.set("images", JSON.stringify(form.images ?? []));

  for (const name of [
    "taxable",
    "trackInventory",
    "allowBackorder",
    "isGiftable",
    "allowGiftMessage",
    "giftWrapAvailable",
    "giftBoxCompatible",
  ]) {
    if (form[name]) data.set(name, "on");
  }

  return data;
}

/** Two sample rows that pass the checks, for the downloadable template. */
export const SAMPLE_ROWS = [
  {
    sku: "AKI/SAR/1601",
    title: "Rust Orange Chanderi Silk Saree",
    category: "Saree",
    parent_category: "Women",
    type: "Chanderi Silk",
    colour: "Rust Orange",
    status: "active",
    price: "14559",
    compare_at_price: "17999",
    cost_price: "9800",
    quantity: "6",
    low_stock_threshold: "2",
    continue_selling: "no",
    track_inventory: "yes",
    description:
      "A handwoven Chanderi silk saree in rust orange with a gold zari border.\n\nWoven by hand in Madhya Pradesh.",
    short_description: "Rust orange Chanderi silk with gold zari border",
    tags: "chanderi, silk, festive",
    occasions: "Wedding | Diwali",
    image_1: "rust-orange-chanderi-front.jpg",
    image_2: "https://cdn.example.com/products/rust-orange-chanderi-pallu.jpg",
    image_3: "",
    image_4: "",
    image_alt: "Rust orange Chanderi silk saree, front drape",
    seo_title: "Rust Orange Chanderi Silk Saree | Atulya Karigari",
    seo_description:
      "Handwoven rust orange Chanderi silk saree with a gold zari border. Ships across India.",
    hsn_code: "5007",
    gst_rate: "5",
    weight_grams: "650",
  },
  {
    sku: "",
    title: "Navy Blue Silk Tie with Paisley Motif",
    category: "Tie",
    parent_category: "Men",
    type: "Silk",
    colour: "Navy Blue",
    status: "draft",
    price: "1499",
    compare_at_price: "",
    cost_price: "",
    quantity: "25",
    low_stock_threshold: "5",
    continue_selling: "no",
    track_inventory: "yes",
    description: "A pure silk tie in navy blue with a woven paisley motif.",
    short_description: "Navy silk tie, paisley weave",
    tags: "tie, silk",
    occasions: "Office | Wedding",
    image_1: "navy-paisley-tie.jpg",
    image_2: "",
    image_3: "",
    image_4: "",
    image_alt: "Navy blue silk tie with paisley motif",
    seo_title: "",
    seo_description: "",
    hsn_code: "6215",
    gst_rate: "12",
    weight_grams: "80",
  },
];
