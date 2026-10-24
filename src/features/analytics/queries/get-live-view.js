import { connectDb } from "@/db/connect";
import { Reservation } from "@/models/reservation.model";
import { SiteSession } from "@/models/site-session.model";
import { RESERVATION_STATUS } from "@/constants/enums";
import { SESSION_IDLE_MS } from "../lib/track-visit";

/** "Right now" is the last five minutes — the storefront pings every minute. */
export const LIVE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Shopify's Live View, minus the globe: who is on the store now, how many of
 * them have something in the cart, and how many are at the payment step.
 *
 * Not cache()-wrapped: the live card polls this through /api/analytics/live,
 * and each poll must read afresh.
 *
 * - Visitors now: distinct visitors seen in the last five minutes.
 * - Active carts: sessions still open (seen in the last thirty minutes) whose
 *   last ping carried a non-empty cart.
 * - Checking out: open stock holds — a hold is taken when the shopper reaches
 *   payment and lasts fifteen minutes.
 */
export async function getLiveView(now = new Date()) {
  await connectDb();

  const liveSince = new Date(now.getTime() - LIVE_WINDOW_MS);
  const openSince = new Date(now.getTime() - SESSION_IDLE_MS);

  const [visitors, carts, checkouts, places, pages] = await Promise.all([
    SiteSession.aggregate([
      { $match: { lastSeenAt: { $gte: liveSince } } },
      { $group: { _id: "$visitorId" } },
      { $count: "count" },
    ]),
    SiteSession.aggregate([
      { $match: { lastSeenAt: { $gte: openSince }, "cart.items": { $gt: 0 } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          items: { $sum: "$cart.items" },
          value: { $sum: "$cart.value" },
        },
      },
    ]),
    Reservation.aggregate([
      {
        $match: { status: RESERVATION_STATUS.ACTIVE, expiresAt: { $gt: now } },
      },
      // One checkout can hold several SKUs; count checkouts, not rows.
      { $group: { _id: { $ifNull: ["$orderId", "$sessionId"] } } },
      { $count: "count" },
    ]),
    SiteSession.aggregate([
      { $match: { lastSeenAt: { $gte: liveSince } } },
      {
        $group: {
          _id: { state: "$region.state", city: "$region.city" },
          visitors: { $addToSet: "$visitorId" },
        },
      },
      { $project: { visitors: { $size: "$visitors" } } },
      { $sort: { visitors: -1 } },
      { $limit: 5 },
    ]),
    SiteSession.aggregate([
      { $match: { lastSeenAt: { $gte: liveSince }, lastPath: { $ne: "" } } },
      { $group: { _id: "$lastPath", visitors: { $sum: 1 } } },
      { $sort: { visitors: -1 } },
      { $limit: 5 },
    ]),
  ]);

  return {
    at: now.toISOString(),
    visitors: visitors[0]?.count ?? 0,
    activeCarts: carts[0]?.count ?? 0,
    cartItems: carts[0]?.items ?? 0,
    cartValue: carts[0]?.value ?? 0,
    checkingOut: checkouts[0]?.count ?? 0,
    places: places.map((row) => ({
      label:
        [row._id.city, row._id.state].filter(Boolean).join(", ") || "Unknown",
      visitors: row.visitors,
    })),
    pages: pages.map((row) => ({
      path: row._id.split("?")[0],
      visitors: row.visitors,
    })),
  };
}
