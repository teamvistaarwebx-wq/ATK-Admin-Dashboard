import mongoose from "mongoose";
import { connectDb } from "@/db/connect";
import { Order } from "@/models/order.model";
import { ORDER_STATUS, PAID_ORDER_STATUS_VALUES } from "@/constants/enums";
import { statusesFor } from "../lib/order-status";

const PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
/** The export reads in one go; past this a CSV is not the right tool. */
export const MAX_EXPORT_ROWS = 10000;

const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/g;

/**
 * The Mongo filter for the list, the stats strip and the export — one
 * function, so the three can never disagree about what "these orders" means.
 *
 * `view` is a tab key ("unfulfilled", "unpaid"…) or a raw status from an old
 * bookmark. `range` is a resolved date range (lib/date-range.js); its `start`
 * and `end` are IST midnights, so "Today" means today in India rather than
 * today on the server's UTC clock.
 */
export function buildOrderFilter({ view, status, q, range } = {}) {
  const filter = {};

  const statuses = statusesFor(view ?? status);
  if (statuses)
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };

  if (range?.start && range?.end) {
    filter.createdAt = { $gte: range.start, $lt: range.end };
  }

  const query = String(q ?? "").trim();
  if (query) {
    // Staff search by order number, customer, phone, email or company.
    const pattern = new RegExp(query.replace(REGEX_SPECIALS, "\\$&"), "i");
    filter.$or = [
      { orderNumber: pattern },
      { "contact.fullName": pattern },
      { "contact.phone": pattern },
      { "contact.email": pattern },
      { "corporate.companyName": pattern },
    ];
  }

  return filter;
}

/** Dashboard list. Newest first — the only order staff ever want. */
export async function getOrders({ view, status, q, range, page, limit } = {}) {
  await connectDb();

  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = Math.min(
    Math.max(1, Number.parseInt(limit, 10) || PAGE_SIZE),
    MAX_PAGE_SIZE
  );

  const filter = buildOrderFilter({ view, status, q, range });

  const [docs, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .lean({ virtuals: true }),
    Order.countDocuments(filter),
  ]);

  return {
    items: docs.map(toSummary),
    page: currentPage,
    limit: pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * The strip above the orders table: what happened in the chosen range,
 * whichever tab is open — so switching Today → Last 7 days visibly changes
 * every figure, and the tabs change only the table.
 */
export async function getOrderRangeStats({ q, range } = {}) {
  await connectDb();

  const filter = buildOrderFilter({ q, range });

  const [row] = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        items: { $sum: { $sum: "$items.quantity" } },
        paid: {
          $sum: {
            $cond: [{ $in: ["$status", PAID_ORDER_STATUS_VALUES] }, 1, 0],
          },
        },
        revenue: {
          $sum: {
            $cond: [
              { $in: ["$status", PAID_ORDER_STATUS_VALUES] },
              "$amounts.total",
              0,
            ],
          },
        },
        toFulfil: {
          $sum: {
            $cond: [
              { $in: ["$status", [ORDER_STATUS.PAID, ORDER_STATUS.CONFIRMED]] },
              1,
              0,
            ],
          },
        },
        fulfilled: {
          $sum: {
            $cond: [
              {
                $in: [
                  "$status",
                  [ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED],
                ],
              },
              1,
              0,
            ],
          },
        },
        delivered: {
          $sum: { $cond: [{ $eq: ["$status", ORDER_STATUS.DELIVERED] }, 1, 0] },
        },
      },
    },
  ]);

  return {
    orders: row?.orders ?? 0,
    items: row?.items ?? 0,
    paid: row?.paid ?? 0,
    revenue: row?.revenue ?? 0,
    toFulfil: row?.toFulfil ?? 0,
    fulfilled: row?.fulfilled ?? 0,
    delivered: row?.delivered ?? 0,
  };
}

/** Every matching order, full detail, for the CSV export. */
export async function getOrdersForExport({ view, q, range } = {}) {
  await connectDb();

  const docs = await Order.find(buildOrderFilter({ view, q, range }))
    .sort({ createdAt: -1 })
    .limit(MAX_EXPORT_ROWS)
    .lean({ virtuals: true });

  return docs.map(toDetail);
}

export async function getOrder(idOrNumber) {
  if (!idOrNumber) return null;

  await connectDb();

  const filter = mongoose.Types.ObjectId.isValid(idOrNumber)
    ? { _id: idOrNumber }
    : { orderNumber: String(idOrNumber).toUpperCase() };

  const doc = await Order.findOne(filter).lean({ virtuals: true });
  return doc ? toDetail(doc) : null;
}

function toSummary(doc) {
  return {
    id: String(doc._id),
    orderNumber: doc.orderNumber,
    status: doc.status,
    contact: doc.contact,
    city: doc.address?.city ?? "",
    state: doc.address?.state ?? "",
    companyName: doc.corporate?.companyName ?? "",
    needsReview: Boolean(doc.needsReview),
    itemCount: (doc.items ?? []).reduce((sum, i) => sum + i.quantity, 0),
    total: doc.amounts?.total ?? 0,
    currency: doc.currency || "INR",
    createdAt: doc.createdAt,
  };
}

function toDetail(doc) {
  return {
    ...toSummary(doc),
    address: doc.address,
    items: doc.items ?? [],
    packaging: doc.packaging ?? null,
    card: doc.card ?? null,
    cardMessage: doc.cardMessage ?? "",
    cardLogo: doc.cardLogo ?? null,
    amounts: doc.amounts,
    payment: {
      provider: doc.payment?.provider ?? "razorpay",
      razorpayOrderId: doc.payment?.razorpayOrderId ?? null,
      razorpayPaymentId: doc.payment?.razorpayPaymentId ?? null,
      paidAt: doc.payment?.paidAt ?? null,
      failureReason: doc.payment?.failureReason ?? "",
    },
    verifiedPhone: doc.verifiedPhone ?? "",
    /**
     * Set when the payment landed after the stock hold had expired, so the
     * item may already have gone to somebody else. The detail page shows it as
     * an alert — this is a paying customer waiting on a phone call.
     */
    needsReview: Boolean(doc.needsReview),
    reviewNote: doc.reviewNote ?? "",
    updatedAt: doc.updatedAt,
  };
}
