import { cache } from "react";
import { connectDb } from "@/db/connect";
import { Inquiry } from "@/models/inquiry.model";
import { Order } from "@/models/order.model";
import { SiteSession } from "@/models/site-session.model";
import { PAID_ORDER_STATUS_VALUES } from "@/constants/enums";
import { normaliseState } from "../lib/track-visit";

const UNKNOWN = "Unknown";

/**
 * Traffic, sales and enquiries per Indian state for one range.
 *
 * Three collections spell a state three ways — the storefront's dropdown on
 * orders, free text on enquiries, a geo code on sessions — so every key goes
 * through `normaliseState` before the rows are merged.
 */
export const getRegionBreakdown = cache(async function getRegionBreakdown(range) {
  await connectDb();

  const window = { $gte: range.start, $lt: range.end };

  const [orders, sessions, inquiries] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $in: PAID_ORDER_STATUS_VALUES }, createdAt: window } },
      {
        $group: {
          _id: "$address.state",
          orders: { $sum: 1 },
          revenue: { $sum: "$amounts.total" },
        },
      },
    ]),
    SiteSession.aggregate([
      { $match: { startedAt: window } },
      { $group: { _id: "$region.state", sessions: { $sum: 1 } } },
    ]),
    Inquiry.aggregate([
      { $match: { createdAt: window } },
      {
        $group: {
          _id: "$address.state",
          inquiries: { $sum: 1 },
          pipeline: { $sum: "$budget" },
        },
      },
    ]),
  ]);

  const rows = new Map();
  const row = (state) => {
    const name = normaliseState(state) || UNKNOWN;
    if (!rows.has(name)) {
      rows.set(name, { state: name, sessions: 0, orders: 0, revenue: 0, inquiries: 0, pipeline: 0 });
    }
    return rows.get(name);
  };

  for (const r of orders) {
    const target = row(r._id);
    target.orders += r.orders;
    target.revenue += r.revenue;
  }
  for (const r of sessions) row(r._id).sessions += r.sessions;
  for (const r of inquiries) {
    const target = row(r._id);
    target.inquiries += r.inquiries;
    target.pipeline += r.pipeline ?? 0;
  }

  // Unknown sinks to the bottom whatever its size — it is not a place.
  const list = [...rows.values()].toSorted((a, b) => {
    if (a.state === UNKNOWN) return 1;
    if (b.state === UNKNOWN) return -1;
    return b.revenue - a.revenue || b.sessions - a.sessions || b.inquiries - a.inquiries;
  });

  const totals = list.reduce(
    (sum, r) => ({
      sessions: sum.sessions + r.sessions,
      orders: sum.orders + r.orders,
      revenue: sum.revenue + r.revenue,
      inquiries: sum.inquiries + r.inquiries,
    }),
    { sessions: 0, orders: 0, revenue: 0, inquiries: 0 }
  );

  return { rows: list, totals };
});
