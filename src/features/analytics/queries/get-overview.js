import { cache } from "react";
import { connectDb } from "@/db/connect";
import { Inquiry } from "@/models/inquiry.model";
import { Order } from "@/models/order.model";
import { SiteSession } from "@/models/site-session.model";
import { PAID_ORDER_STATUS_VALUES } from "@/constants/enums";
import {
  bucketKeyOf,
  buildBuckets,
  dateTruncFor,
} from "@/lib/date-range";

/**
 * Everything the dashboard's headline chart needs, for a range and the range
 * it is compared with: revenue, orders, average order value, sessions, unique
 * visitors and enquiries, each as a total and as a zero-filled series.
 *
 * Money is paise throughout — the caller formats. Only paid statuses count as
 * sales: a `pending_payment` order is a browser tab, not revenue.
 */
export const getOverview = cache(async function getOverview(range) {
  await connectDb();

  const [current, previous] = await Promise.all([
    readPeriod(range, range.granularity),
    // The comparison is bucketed at the current range's granularity so the
    // two lines share an x-axis point for point.
    range.comparison
      ? readPeriod(range.comparison, range.granularity)
      : Promise.resolve(null),
  ]);

  const metric = (name) => ({
    total: current.totals[name],
    previous: previous ? previous.totals[name] : null,
    series: current.series.map((point) => point[name]),
    previousSeries: previous ? previous.series.map((point) => point[name]) : null,
  });

  return {
    labels: current.buckets.map((bucket) => bucket.label),
    previousLabels: previous ? previous.buckets.map((bucket) => bucket.label) : null,
    metrics: {
      revenue: metric("revenue"),
      orders: metric("orders"),
      aov: metric("aov"),
      sessions: metric("sessions"),
      visitors: metric("visitors"),
      inquiries: metric("inquiries"),
      conversion: metric("conversion"),
    },
  };
});

async function readPeriod(period, granularity) {
  const buckets = buildBuckets(period, granularity);
  const window = { $gte: period.start, $lt: period.end };

  const [sales, sessions, visitorCount, inquiries] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $in: PAID_ORDER_STATUS_VALUES }, createdAt: window } },
      {
        $group: {
          _id: dateTruncFor("$createdAt", granularity),
          orders: { $sum: 1 },
          revenue: { $sum: "$amounts.total" },
        },
      },
    ]),

    SiteSession.aggregate([
      { $match: { startedAt: window } },
      {
        $group: {
          _id: dateTruncFor("$startedAt", granularity),
          sessions: { $sum: 1 },
          visitors: { $addToSet: "$visitorId" },
        },
      },
      { $project: { sessions: 1, visitors: { $size: "$visitors" } } },
    ]),

    // Unique across the whole range — summing the per-bucket uniques would
    // count a returning visitor once per day.
    SiteSession.aggregate([
      { $match: { startedAt: window } },
      { $group: { _id: "$visitorId" } },
      { $count: "visitors" },
    ]),

    Inquiry.aggregate([
      { $match: { createdAt: window } },
      { $group: { _id: dateTruncFor("$createdAt", granularity), inquiries: { $sum: 1 } } },
    ]),
  ]);

  const byKey = new Map();
  const at = (instant) => {
    const key = bucketKeyOf(instant, granularity);
    if (!byKey.has(key)) byKey.set(key, {});
    return byKey.get(key);
  };

  for (const row of sales) Object.assign(at(row._id), { orders: row.orders, revenue: row.revenue });
  for (const row of sessions) Object.assign(at(row._id), { sessions: row.sessions, visitors: row.visitors });
  for (const row of inquiries) Object.assign(at(row._id), { inquiries: row.inquiries });

  const series = buckets.map(({ key }) => {
    const found = byKey.get(key) ?? {};
    const orders = found.orders ?? 0;
    const revenue = found.revenue ?? 0;
    const sessionCount = found.sessions ?? 0;
    return {
      orders,
      revenue,
      aov: orders > 0 ? Math.round(revenue / orders) : 0,
      sessions: sessionCount,
      visitors: found.visitors ?? 0,
      inquiries: found.inquiries ?? 0,
      conversion: sessionCount > 0 ? (orders / sessionCount) * 100 : 0,
    };
  });

  const sum = (name) => series.reduce((total, point) => total + point[name], 0);
  const orders = sum("orders");
  const revenue = sum("revenue");
  const sessionTotal = sum("sessions");

  return {
    buckets,
    series,
    totals: {
      orders,
      revenue,
      // Whole paise: an average shown to the rupee gains nothing from more.
      aov: orders > 0 ? Math.round(revenue / orders) : 0,
      sessions: sessionTotal,
      visitors: visitorCount[0]?.visitors ?? 0,
      inquiries: sum("inquiries"),
      conversion: sessionTotal > 0 ? (orders / sessionTotal) * 100 : 0,
    },
  };
}
