import { ORDER_STATUS } from "@/constants/enums";

/**
 * One order status, shown as Shopify's three columns: payment, fulfilment and
 * delivery. The data model has a single status field, so this is a view of it
 * — never stored, never parsed back.
 *
 * Each badge is `{ label, tone, progress }` (see components/ui/badge.jsx), or
 * null where the column has nothing to say.
 */
const PAID = { label: "Paid", tone: "neutral", progress: "complete" };
const UNFULFILLED = {
  label: "Unfulfilled",
  tone: "attention",
  progress: "incomplete",
};
const FULFILLED = { label: "Fulfilled", tone: "neutral", progress: "complete" };

const VIEWS = {
  [ORDER_STATUS.PENDING_PAYMENT]: {
    payment: {
      label: "Payment pending",
      tone: "warning",
      progress: "incomplete",
    },
    fulfillment: UNFULFILLED,
    delivery: null,
  },
  [ORDER_STATUS.PAID]: {
    payment: PAID,
    fulfillment: UNFULFILLED,
    delivery: null,
  },
  [ORDER_STATUS.CONFIRMED]: {
    payment: PAID,
    fulfillment: {
      label: "In progress",
      tone: "attention",
      progress: "partial",
    },
    delivery: null,
  },
  [ORDER_STATUS.SHIPPED]: {
    payment: PAID,
    fulfillment: FULFILLED,
    delivery: { label: "In transit", tone: "info" },
  },
  [ORDER_STATUS.DELIVERED]: {
    payment: PAID,
    fulfillment: FULFILLED,
    delivery: { label: "Delivered", tone: "success" },
  },
  [ORDER_STATUS.PAYMENT_FAILED]: {
    payment: {
      label: "Payment failed",
      tone: "critical",
      progress: "incomplete",
    },
    fulfillment: null,
    delivery: null,
  },
  [ORDER_STATUS.EXPIRED]: {
    payment: { label: "Expired", tone: "neutral", progress: "incomplete" },
    fulfillment: null,
    delivery: null,
  },
  [ORDER_STATUS.CANCELLED]: {
    payment: { label: "Cancelled", tone: "neutral" },
    fulfillment: null,
    delivery: null,
  },
};

export function orderStatusView(status) {
  return (
    VIEWS[status] ?? {
      payment: { label: status, tone: "neutral" },
      fulfillment: null,
      delivery: null,
    }
  );
}

/**
 * The tabs above the orders table. Each maps to the statuses it shows;
 * `unfulfilled` is the to-do list — paid, not yet with the courier.
 */
export const ORDER_VIEWS = [
  { key: "", label: "All", statuses: null },
  {
    key: "unfulfilled",
    label: "Unfulfilled",
    statuses: [ORDER_STATUS.PAID, ORDER_STATUS.CONFIRMED],
  },
  { key: "unpaid", label: "Unpaid", statuses: [ORDER_STATUS.PENDING_PAYMENT] },
  { key: "shipped", label: "In transit", statuses: [ORDER_STATUS.SHIPPED] },
  { key: "delivered", label: "Delivered", statuses: [ORDER_STATUS.DELIVERED] },
  {
    key: "closed",
    label: "Cancelled & failed",
    statuses: [
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.PAYMENT_FAILED,
      ORDER_STATUS.EXPIRED,
    ],
  },
];

/** A view key, or a raw status from an old bookmark, to a status list. */
export function statusesFor(value) {
  const view = ORDER_VIEWS.find((item) => item.key === value);
  if (view) return view.statuses;
  return Object.values(ORDER_STATUS).includes(value) ? [value] : null;
}
