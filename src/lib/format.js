const RUPEES = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const RUPEES_WITH_PAISE = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

/** Money is stored as integer paise everywhere. */
export function formatPrice(paise) {
  const value = Number(paise);
  if (!Number.isFinite(value)) return "—";

  const rupees = value / 100;
  // Only show paise when there are any — ₹14,559 reads better than ₹14,559.00
  return value % 100 === 0
    ? RUPEES.format(rupees)
    : RUPEES_WITH_PAISE.format(rupees);
}

const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(value) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DATE_TIME.format(date);
}

/**
 * "pending_payment" → "Pending payment". Status enums are stored as
 * snake_case keys; dropdowns and labels show them as words.
 */
export function capitalize(value) {
  const text = String(value ?? "").replace(/_/g, " ");
  return text ? text[0].toUpperCase() + text.slice(1) : "";
}

const DATE_ONLY = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

/** "3 Dec 2026" — a day, where the time would be noise. */
export function formatDate(value) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DATE_ONLY.format(date);
}

const TIME_ONLY = new Intl.DateTimeFormat("en-IN", { timeStyle: "short" });
const DAY_MONTH = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Activity-feed timestamps: "Today, 10:14 am" for the last two days, then a
 * day count, then a date.
 *
 * Counted in calendar days rather than elapsed hours — something from 11pm
 * last night is "Yesterday", not "9 hours ago".
 */
export function formatActivityTime(value) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfThatDay = new Date(date);
  startOfThatDay.setHours(0, 0, 0, 0);

  const daysAgo = Math.round(
    (startOfToday.getTime() - startOfThatDay.getTime()) / MS_PER_DAY
  );

  if (daysAgo <= 0) return `Today, ${TIME_ONLY.format(date)}`;
  if (daysAgo === 1) return `Yesterday, ${TIME_ONLY.format(date)}`;
  if (daysAgo < 7) return `${daysAgo} days ago`;

  return DAY_MONTH.format(date);
}

/** "₹5,90,500" without the paise, for compact figures. */
export function formatCompactPrice(paise) {
  const value = Number(paise);
  if (!Number.isFinite(value)) return "—";

  return RUPEES.format(Math.round(value / 100));
}
