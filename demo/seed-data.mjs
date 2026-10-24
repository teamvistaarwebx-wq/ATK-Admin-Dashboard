/**
 * Dummy data for `npm run demo` — a believable store to click around in.
 *
 * Written straight to the collections (not through the models) so it runs
 * outside Next with no path aliases. Dates are relative to now, so the
 * dashboard always has a "today", a live view and a previous period to
 * compare against. Never point this at a real database: it empties the
 * collections it fills.
 */
import crypto from "node:crypto";
import { promisify } from "node:util";

export const DEMO_LOGIN = { email: "demo@atk.test", password: "DemoPass2026" };

const scrypt = promisify(crypto.scrypt);
/** Mirrors src/lib/auth/password.js, so the demo admin can sign in. */
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

const DAY = 24 * 60 * 60 * 1000;

// Deterministic, so every fresh demo looks the same.
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = (list) => list[Math.floor(rnd() * list.length)];

const CATALOG = {
  Women: ["Saree", "Dupatta", "Jewellery", "Footwear", "Other Collection"],
  Men: ["Tie", "Other Collection"],
};

/** [state, city, weight] — where orders and visitors come from. */
const PLACES = [
  ["Karnataka", "Bengaluru", 9],
  ["Maharashtra", "Mumbai", 8],
  ["Delhi", "New Delhi", 7],
  ["Telangana", "Hyderabad", 6],
  ["Tamil Nadu", "Chennai", 5],
  ["West Bengal", "Kolkata", 5],
  ["Odisha", "Bhubaneswar", 4],
  ["Uttar Pradesh", "Lucknow", 3],
  ["Gujarat", "Ahmedabad", 3],
  ["Kerala", "Kochi", 2],
  ["Rajasthan", "Jaipur", 2],
  ["Haryana", "Gurugram", 2],
];

const NAMES = [
  "Mita Sanyal",
  "Priya Das",
  "Sunita Amin",
  "Sarika Gupta",
  "Bhabani Nag",
  "Radhika Rajagopal",
  "Falguni Desai",
  "Miloni Chatterjee",
  "Lakshmi K",
  "Girija Anantharaman",
  "Renu Mukunda",
  "Eesha Gupta",
  "Aditi Sharma",
  "Kalyani Edla",
  "Alaknanda Chavan",
  "Ajay Nayar",
  "Rohan Mehta",
  "Ananya Rao",
];

const COMPANIES = [
  "Infosys",
  "Tata Steel",
  "Wipro",
  "Zomato",
  "Swiggy",
  "HDFC Bank",
];

/** [title, subcategory, category, type, colour, accent, price ₹, stock] */
const PRODUCTS = [
  [
    "Muted Gold Cotton Silk Saree with Floral Vine Jaal",
    "Saree",
    "Women",
    "Banarasi Silk",
    "#b8925a",
    "#1f2f5c",
    14559,
    1,
  ],
  [
    "Bright Yellow Cotton Silk Saree with Multicolour Pallu",
    "Saree",
    "Women",
    "Banarasi Silk",
    "#e8c21c",
    "#8b1a3a",
    12999,
    1,
  ],
  [
    "Crimson Red & Black Floral Motif Khandua Silk Saree",
    "Saree",
    "Women",
    "Khandua Silk",
    "#a3122a",
    "#151515",
    18499,
    4,
  ],
  [
    "Magenta & Purple Shankha Motif Khandua Silk Saree",
    "Saree",
    "Women",
    "Khandua Silk",
    "#b0177a",
    "#4b1a6b",
    17499,
    9,
  ],
  [
    "Rust Orange & Forest Green Khandua Silk Saree",
    "Saree",
    "Women",
    "Khandua Silk",
    "#c4561c",
    "#1d4d2b",
    16999,
    0,
  ],
  [
    "Mustard Yellow & Red Khandua Silk Saree",
    "Saree",
    "Women",
    "Khandua Silk",
    "#d19a1e",
    "#9d1424",
    15999,
    2,
  ],
  [
    "Royal Blue & Magenta Lotus Motif Khandua Silk Saree",
    "Saree",
    "Women",
    "Khandua Silk",
    "#1f3fa6",
    "#b0177a",
    18999,
    12,
  ],
  [
    "Maroon Cotton Saree with Geometric Border",
    "Saree",
    "Women",
    "Linen",
    "#6e0f1d",
    "#e6c17a",
    4999,
    4,
  ],
  [
    "Olive Gold Mandala Mulmul Cotton Saree",
    "Saree",
    "Women",
    "Cotton",
    "#7d7a2e",
    "#d4af37",
    3499,
    1,
  ],
  [
    "Ivory Chanderi Dupatta with Zari Buta",
    "Dupatta",
    "Women",
    "Chanderi Silk",
    "#efe6d2",
    "#c9a447",
    2499,
    15,
  ],
  [
    "Indigo Ajrakh Hand-block Dupatta",
    "Dupatta",
    "Women",
    "Cotton",
    "#26305e",
    "#9e2a2b",
    1899,
    7,
  ],
  [
    "Temple Gold Jhumka Earrings",
    "Jewellery",
    "Women",
    "Brass",
    "#c79a3b",
    "#7e0917",
    1299,
    22,
  ],
  [
    "Silver Oxidised Choker Necklace",
    "Jewellery",
    "Women",
    "Silver",
    "#9aa0a6",
    "#3c4043",
    2199,
    3,
  ],
  [
    "Kolhapuri Leather Flats",
    "Footwear",
    "Women",
    "Leather",
    "#8a5a2b",
    "#d4af37",
    1599,
    10,
  ],
  [
    "Navy Blue Silk Tie with Paisley Motif",
    "Tie",
    "Men",
    "Silk",
    "#1b2a4e",
    "#8a1c2b",
    1499,
    25,
  ],
  [
    "Maroon Banarasi Brocade Tie",
    "Tie",
    "Men",
    "Banarasi Silk",
    "#6e0f1d",
    "#d4af37",
    1799,
    6,
  ],
  [
    "Handloom Cotton Pocket Square Set",
    "Other Collection",
    "Men",
    "Cotton",
    "#2e5e4e",
    "#efe6d2",
    999,
    30,
  ],
  [
    "Ikat Weave Cushion Covers (Set of 2)",
    "Other Collection",
    "Women",
    "Cotton",
    "#9e2a2b",
    "#26305e",
    1599,
    0,
  ],
];

/** A small woven-looking swatch, so thumbnails show without any image host. */
function swatch(base, accent) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><rect width='160' height='160' fill='${base}'/><path d='M0 120 L160 80 L160 160 L0 160Z' fill='${accent}'/><rect y='104' width='160' height='8' fill='#d4af37'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function weightedPlace() {
  const total = PLACES.reduce((sum, place) => sum + place[2], 0);
  let roll = rnd() * total;
  for (const place of PLACES) {
    roll -= place[2];
    if (roll <= 0) return place;
  }
  return PLACES[0];
}

export async function seedDemo(db) {
  const now = Date.now();
  const at = (ms) => new Date(ms);

  for (const name of [
    "categories",
    "subcategories",
    "warehouses",
    "products",
    "inventories",
    "stockmovements",
    "orders",
    "inquiries",
    "sitesessions",
    "reservations",
    "adminusers",
    "giftoptions",
  ]) {
    await db.collection(name).deleteMany({});
  }

  // Catalogue tree and the one warehouse.
  const subs = [];
  let order = 1;
  for (const [categoryName, subNames] of Object.entries(CATALOG)) {
    const { insertedId: categoryId } = await db
      .collection("categories")
      .insertOne({
        name: categoryName,
        slug: slugify(categoryName),
        order: order++,
        isActive: true,
        createdAt: at(now),
        updatedAt: at(now),
      });
    for (const [index, name] of subNames.entries()) {
      const { insertedId } = await db.collection("subcategories").insertOne({
        name,
        slug: slugify(name),
        category: categoryId,
        order: index + 1,
        isActive: true,
        createdAt: at(now),
        updatedAt: at(now),
      });
      subs.push({ _id: insertedId, name, categoryId, categoryName });
    }
  }
  const { insertedId: warehouse } = await db
    .collection("warehouses")
    .insertOne({
      name: "Main Warehouse",
      code: "MAIN",
      isDefault: true,
      isActive: true,
      address: { country: "IN" },
      createdAt: at(now),
      updatedAt: at(now),
    });

  // The demo admin.
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (
    await scrypt(DEMO_LOGIN.password, salt, 64, SCRYPT_OPTIONS)
  ).toString("hex");
  await db.collection("adminusers").insertOne({
    email: DEMO_LOGIN.email,
    fullName: "Demo Admin",
    passwordHash: hash,
    passwordSalt: salt,
    role: "super_admin",
    status: "active",
    inviteTokenHash: "",
    inviteExpiresAt: null,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: at(now),
    updatedAt: at(now),
  });

  // Products with their opening stock.
  const products = [];
  let skuNumber = 1601;
  for (const [
    index,
    [title, subName, categoryName, type, base, accent, rupees, stock],
  ] of PRODUCTS.entries()) {
    const sub = subs.find(
      (s) => s.name === subName && s.categoryName === categoryName
    );
    const price = rupees * 100;
    const doc = {
      title,
      slug: slugify(title),
      sku: `AKI/${subName
        .replace(/[^a-z]/gi, "")
        .slice(0, 3)
        .toUpperCase()}/${skuNumber++}`,
      vendor: "Atulyakarigari",
      category: sub.categoryId,
      subcategory: sub._id,
      type,
      tags: [type.toLowerCase()],
      suggestedOccasions: [pick(["Wedding", "Diwali", "Festive", "Office"])],
      description: `${title}. Handwoven by artisans and finished by hand.`,
      shortDescription: "",
      details: [
        {
          key: "colour",
          label: "Colour",
          value: title.split(" ")[0],
          position: 0,
        },
      ],
      images: [
        {
          url: swatch(base, accent),
          alt: title,
          position: 0,
          isFeatured: true,
        },
      ],
      videos: [],
      price,
      compareAtPrice: Math.round(price * 1.2),
      costPrice: Math.round(price * 0.6),
      currency: "INR",
      taxable: true,
      taxClass: "GST_5",
      hsnCode: "5007",
      hasVariants: false,
      options: [],
      variants: [],
      trackInventory: true,
      allowBackorder: false,
      lowStockThreshold: 2,
      weight: 600,
      weightUnit: "g",
      requiresShipping: true,
      seo: { metaTitle: `${title} | Atulya Karigari`, metaDescription: "" },
      isGiftable: true,
      allowGiftMessage: true,
      giftWrapAvailable: false,
      giftBoxCompatible: true,
      views: 0,
      ratingAverage: 0,
      ratingCount: 0,
      salesCount: 0,
      status: index % 7 === 3 ? "draft" : "active",
      publishedAt: at(now - 60 * DAY),
      fulfillment: "in_stock",
      isDeleted: false,
      createdAt: at(now - (60 - index) * DAY),
      updatedAt: at(now),
    };
    const { insertedId } = await db.collection("products").insertOne(doc);
    products.push({ ...doc, _id: insertedId });
    await db.collection("inventories").insertOne({
      productId: insertedId,
      sku: doc.sku,
      warehouse,
      onHand: stock,
      reserved: 0,
      createdAt: at(now),
      updatedAt: at(now),
    });
    await db.collection("stockmovements").insertOne({
      sku: doc.sku,
      warehouse,
      productId: insertedId,
      delta: stock,
      reason: "restock",
      note: "Opening stock",
      createdAt: at(now - 50 * DAY),
    });
  }

  // 130 days of orders, growing towards today.
  const orders = [];
  let orderNumber = 1200;
  for (let daysAgo = 130; daysAgo >= 0; daysAgo--) {
    const perDay = Math.floor(
      0.4 +
        ((130 - daysAgo) / 130) * 1.4 +
        (daysAgo < 30 ? 0.6 : 0) +
        rnd() * 1.6
    );
    for (let i = 0; i < perDay; i++) {
      const [state, city] = weightedPlace();
      const placed = at(
        now - daysAgo * DAY - rnd() * (daysAgo === 0 ? 6 : 20) * 3600e3
      );
      const items = Array.from({ length: 1 + Math.floor(rnd() * 2.2) }, () => {
        const product = pick(products);
        return {
          productId: String(product._id),
          slug: product.slug,
          sku: product.sku,
          title: product.title,
          price: product.price,
          quantity: rnd() < 0.15 ? 2 : 1,
          image: { url: product.images[0].url, alt: "" },
        };
      });
      const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const roll = rnd();
      const status =
        daysAgo === 0
          ? roll < 0.25
            ? "pending_payment"
            : "paid"
          : daysAgo < 3
            ? roll < 0.1
              ? "pending_payment"
              : roll < 0.7
                ? "paid"
                : "confirmed"
            : daysAgo < 8
              ? roll < 0.5
                ? "shipped"
                : roll < 0.6
                  ? "confirmed"
                  : "delivered"
              : roll < 0.86
                ? "delivered"
                : roll < 0.93
                  ? "cancelled"
                  : roll < 0.97
                    ? "expired"
                    : "payment_failed";
      const name = pick(NAMES);
      orders.push({
        orderNumber: `ATK${orderNumber++}`,
        customerId: null,
        contact: {
          fullName: name,
          email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          phone: `+9198${String(Math.floor(rnd() * 1e8)).padStart(8, "0")}`,
        },
        address: {
          line1: "12, Example Road",
          city: city.toUpperCase(),
          pincode: "560001",
          state,
        },
        items,
        packaging: { name: "Kraft gift box", price: 9900 },
        card: { name: "Classic card", price: 0 },
        cardMessage: rnd() < 0.3 ? "Happy Diwali from all of us!" : "",
        cardLogo: null,
        amounts: {
          subtotal,
          packaging: 9900,
          card: 0,
          shipping: 0,
          total: subtotal + 9900,
        },
        currency: "INR",
        status,
        payment: {
          provider: "razorpay",
          razorpayOrderId: null,
          razorpayPaymentId:
            status === "pending_payment"
              ? null
              : `pay_${Math.floor(rnd() * 1e12).toString(36)}`,
          paidAt: status === "pending_payment" ? null : placed,
          failureReason: "",
        },
        corporate:
          rnd() < 0.12
            ? {
                companyName: pick(COMPANIES),
                neededBy: null,
                notes: "",
                occasion: "Diwali",
                limits: {},
              }
            : null,
        verifiedPhone: "",
        needsReview: rnd() < 0.03,
        reviewNote: "",
        internalNotes: "",
        createdAt: placed,
        updatedAt: placed,
      });
    }
  }
  await db.collection("orders").insertMany(orders);

  // Corporate and made-to-order enquiries.
  const inquiries = [];
  for (let i = 0; i < 40; i++) {
    const daysAgo = Math.floor(rnd() * 120);
    const [state, city] = weightedPlace();
    inquiries.push({
      inquiryNumber: `INQ-2026-${1000 + i}`,
      source: rnd() < 0.2 ? "made_to_order" : "corporate_form",
      status:
        daysAgo < 7
          ? "new"
          : pick(["contacted", "quoted", "won", "lost", "new"]),
      contactName: pick(NAMES),
      companyName: pick(COMPANIES),
      email: "hr@example.com",
      phone: "+919800000000",
      headcount: 20 + Math.floor(rnd() * 200),
      budget: Math.round(50000 + rnd() * 500000) * 100,
      items: [],
      address: { line1: "", city, pincode: "", state },
      amounts: { subtotal: 0, packaging: 0, card: 0, total: 0 },
      createdAt: at(now - daysAgo * DAY - rnd() * DAY),
      updatedAt: at(now),
    });
  }
  await db.collection("inquiries").insertMany(inquiries);

  // Storefront visits, plus a handful of people on the store right now.
  const sessions = [];
  const sources = ["direct", "search", "social", "social", "referral", "paid"];
  const pages = ["/", "/collections/sarees", "/gift-box", "/cart"];
  for (let daysAgo = 130; daysAgo >= 0; daysAgo--) {
    const perDay = Math.floor(
      30 + (130 - daysAgo) * 0.9 + rnd() * 30 + (daysAgo < 30 ? 40 : 0)
    );
    for (let i = 0; i < perDay; i++) {
      const [state, city] = rnd() < 0.08 ? ["", ""] : weightedPlace();
      const started =
        now - daysAgo * DAY - rnd() * (daysAgo === 0 ? 8 : 24) * 3600e3;
      sessions.push({
        visitorId: `v${Math.floor(rnd() * (daysAgo < 30 ? 2500 : 6000))
          .toString(36)
          .padStart(9, "0")}`,
        startedAt: at(started),
        lastSeenAt: at(Math.min(now - 6 * 60e3, started + rnd() * 600e3)),
        pageViews: 1 + Math.floor(rnd() * 6),
        landingPath: "/",
        lastPath: pick(pages),
        referrer: "",
        source: pick(sources),
        device: pick(["mobile", "mobile", "desktop"]),
        region: { country: "IN", state, city },
        cart: { items: 0, value: 0, updatedAt: null },
      });
    }
  }
  for (let i = 0; i < 9; i++) {
    const [state, city] = weightedPlace();
    const product = pick(products);
    sessions.push({
      visitorId: `live${i}visitor`,
      startedAt: at(now - rnd() * 1200e3),
      lastSeenAt: at(now - rnd() * 120e3),
      pageViews: 3,
      landingPath: "/",
      lastPath: pick([...pages, `/products/${product.slug}`]),
      referrer: "",
      source: "social",
      device: "mobile",
      region: { country: "IN", state, city },
      cart:
        i < 4
          ? {
              items: 1 + (i % 2),
              value: product.price * (1 + (i % 2)),
              updatedAt: at(now),
            }
          : { items: 0, value: 0, updatedAt: null },
    });
  }
  await db.collection("sitesessions").insertMany(sessions);

  // One shopper at the payment step.
  await db.collection("reservations").insertOne({
    sku: products[3].sku,
    warehouse,
    productId: products[3]._id,
    quantity: 1,
    sessionId: "live1visitor",
    status: "active",
    expiresAt: at(now + 10 * 60e3),
    createdAt: at(now),
    updatedAt: at(now),
  });

  return {
    products: products.length,
    orders: orders.length,
    sessions: sessions.length,
    inquiries: inquiries.length,
  };
}
