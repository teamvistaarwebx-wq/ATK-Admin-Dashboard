import mongoose from "mongoose";

/**
 * One storefront visit — Shopify's "session".
 *
 * A visitor (one browser, `visitorId` from a first-party cookie the storefront
 * sets) starts a new session after thirty minutes without a page view. Rows
 * are written by POST /api/analytics/track and read by the dashboard for
 * sessions, unique visitors, region-wise traffic and the live view.
 *
 * Region comes from the storefront's edge geo headers (Vercel's
 * x-vercel-ip-country-region / -city), forwarded in the track call. It is a
 * best guess about where the visitor is, never personal data — no IP is kept.
 *
 * `cart` is the visitor's cart as of their last ping, so "active carts" can be
 * counted without the storefront persisting carts anywhere else.
 */
const siteSessionSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, trim: true, maxlength: 64 },
    startedAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true },
    pageViews: { type: Number, default: 0, min: 0 },

    landingPath: { type: String, default: "", maxlength: 300 },
    lastPath: { type: String, default: "", maxlength: 300 },
    referrer: { type: String, default: "", maxlength: 300 },
    /** direct | search | social | email | referral | paid */
    source: { type: String, default: "direct", maxlength: 20 },
    device: { type: String, default: "", maxlength: 20 },

    region: {
      country: { type: String, default: "", maxlength: 2 },
      state: { type: String, default: "", maxlength: 80 },
      city: { type: String, default: "", maxlength: 80 },
    },

    cart: {
      items: { type: Number, default: 0, min: 0 },
      /** Paise, like every other amount in the app. */
      value: { type: Number, default: 0, min: 0 },
      updatedAt: { type: Date, default: null },
    },
  },
  { versionKey: false }
);

// The track call's "is there a live session for this visitor" lookup.
siteSessionSchema.index({ visitorId: 1, lastSeenAt: -1 });
// Range reads: sessions per day, per region.
siteSessionSchema.index({ startedAt: -1 });
// The live view: who has been seen in the last few minutes.
siteSessionSchema.index({ lastSeenAt: -1 });
/**
 * Thirteen months, then gone — enough for a year-on-year comparison, and raw
 * visit logs are not something worth keeping for ever. Like every index here,
 * create it by hand in Atlas (see models/README.md).
 */
siteSessionSchema.index(
  { lastSeenAt: 1 },
  { name: "ttl_lastSeenAt", expireAfterSeconds: 400 * 24 * 60 * 60 }
);

export const SiteSession =
  mongoose.models.SiteSession ||
  mongoose.model("SiteSession", siteSessionSchema);
