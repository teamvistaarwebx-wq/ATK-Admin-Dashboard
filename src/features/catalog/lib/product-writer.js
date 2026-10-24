import { Product } from "@/models/product.model";
import { PRODUCT_STATUS } from "@/constants/enums";
import { slugify } from "@/features/catalog/lib/product-input";

/**
 * Writing a product document — shared by the product drawer's server action
 * and the CSV importer, so a product created either way gets the same slug,
 * the same SKU scheme and the same validation hooks.
 *
 * Server-only. Callers authorise first; nothing here checks a session.
 */

/** Mongo's duplicate-key error. The index name tells us which field clashed. */
export const DUPLICATE_KEY = 11000;

/** Every generated SKU looks like AKI/SAR/1569. */
const SKU_BRAND = "AKI";
const SKU_PATTERN = /^AKI\/[A-Z]+\/\d+$/;
/** Where a brand-new subcategory's block starts: 1101, 2101, 3101… */
const BLOCK_SIZE = 1000;
const BLOCK_START = 101;

/** Two admins saving at once can pick the same number; step past it. */
const SKU_ATTEMPTS = 4;

const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/g;

/**
 * new + save(), not create(): the pre-validate hook clears variant fields,
 * renumbers details and enforces exactly one featured image, and it only runs
 * on a document instance.
 *
 * The slug is minted here rather than typed, and so is the SKU unless one was
 * given (a supplier's code, or a row in an import). Both are unique indexes,
 * so a clash on a typed SKU is reported rather than stepped around.
 */
export async function createProduct(
  document,
  adminId,
  subcategory,
  typedSku = ""
) {
  const slug = await generateSlug(document.title);

  for (let attempt = 0; attempt < SKU_ATTEMPTS; attempt += 1) {
    const product = new Product({
      ...document,
      slug,
      sku: typedSku || (await generateSku(subcategory, attempt)),
      // Live from the moment it is created, if that is how it was saved.
      publishedAt:
        document.status === PRODUCT_STATUS.ACTIVE ? new Date() : undefined,
      createdBy: adminId,
      updatedBy: adminId,
    });

    try {
      await product.save();
      return product;
    } catch (error) {
      const clashed = Object.keys(error?.keyPattern ?? {})[0];
      // Someone else claimed that number between our read and our write.
      // A typed SKU is not ours to change, so its clash goes back to the
      // person who typed it.
      if (error?.code === DUPLICATE_KEY && clashed === "sku" && !typedSku) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Could not allocate a unique SKU");
}

/**
 * Loaded and saved rather than findOneAndUpdate, so the same pre-validate hook
 * runs on an edit as on a create.
 *
 * The slug is deliberately never rewritten: it is the product's public web
 * address, and changing it on a rename would break every link and search
 * result already pointing at it.
 */
export async function updateProduct(id, document, adminId) {
  const product = await Product.findOne({ _id: id, isDeleted: false });
  if (!product) return null;

  const wasPublished = Boolean(product.publishedAt);

  // Fixed at creation. Flipping an in-stock product to made to order would
  // strand its stock rows; the other way, its enquiries.
  const editable = { ...document };
  delete editable.fulfillment;

  for (const [key, value] of Object.entries(editable)) {
    product.set(key, value);
  }
  product.set("updatedBy", adminId);

  // Stamped on the first activation only — publishedAt is when it first went
  // live, not when it was last touched. `updatedAt` covers the latter.
  if (!wasPublished && document.status === PRODUCT_STATUS.ACTIVE) {
    product.set("publishedAt", new Date());
  }

  await product.save();
  return product;
}

/**
 * A unique, readable web address derived from the name.
 *
 * Collisions get a numeric suffix rather than an error: two products really
 * can be called "Rust Orange Chanderi Silk Saree", and refusing the second one
 * over a URL would be a strange thing to explain to whoever is adding it.
 */
async function generateSlug(title) {
  const base = slugify(title);

  // One indexed read covers the base and every suffix of it, instead of a
  // query per candidate.
  const taken = await Product.find({
    slug: new RegExp(`^${base.replace(REGEX_SPECIALS, "\\$&")}(-\\d+)?$`),
  })
    .select("slug")
    .lean();

  const used = new Set(taken.map((row) => row.slug));
  if (!used.has(base)) return base;

  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
}

/**
 * AKI/SAR/1569 — brand, a code for the subcategory, then a number.
 *
 * The numbering deliberately follows the catalogue's existing convention: each
 * subcategory owns a block of a thousand (sarees 15xx, dupattas 21xx,
 * jewellery 31xx, ties 61xx) and a new product continues its own block. One
 * global counter would be simpler, but it would hand the next saree the number
 * after an unrelated muffler and the blocks would stop meaning anything.
 *
 * The letter code is the subcategory, not the hand-picked fabric-and-colour
 * initials of the seeded rows (BSDT, TSEG). Those encode a judgement no
 * generator can make; a stable three letters is the point of not asking.
 */
async function generateSku(subcategory, offset = 0) {
  const code =
    String(subcategory.name ?? "")
      .replace(/[^a-z]/gi, "")
      .slice(0, 3)
      .toUpperCase() || "GEN";

  const [ownBlock, anyBlock] = await Promise.all([
    highestSkuNumber({ subcategory: subcategory._id }),
    highestSkuNumber({}),
  ]);

  // Continue this subcategory's block, or open the next free one above every
  // block already in use when it is the first product of its kind.
  const next = ownBlock
    ? ownBlock + 1
    : Math.floor(anyBlock / BLOCK_SIZE) * BLOCK_SIZE + BLOCK_SIZE + BLOCK_START;

  return `${SKU_BRAND}/${code}/${next + offset}`;
}

/**
 * Deleted products count on purpose: the unique index still holds their SKUs,
 * so skipping them would hand out one that cannot be saved.
 *
 * Compared in the database rather than in JS — as a string "999" sorts above
 * "1000", so the numeric part has to be extracted before any max is taken.
 */
async function highestSkuNumber(match) {
  const [row] = await Product.aggregate([
    { $match: { ...match, sku: { $regex: SKU_PATTERN } } },
    {
      $project: {
        number: { $toInt: { $arrayElemAt: [{ $split: ["$sku", "/"] }, 2] } },
      },
    },
    { $group: { _id: null, max: { $max: "$number" } } },
  ]);

  return row?.max ?? 0;
}
