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

/**
 * "₹3.1L", "₹12K", "₹1.2Cr" — chart axes and headline tiles, where the
 * Indian lakh/crore units read faster than a long figure.
 */
export function formatShortPrice(paise) {
  const value = Number(paise);
  if (!Number.isFinite(value)) return "—";

  const rupees = value / 100;
  const abs = Math.abs(rupees);
  if (abs >= 1e7) return `₹${trim(rupees / 1e7)}Cr`;
  if (abs >= 1e5) return `₹${trim(rupees / 1e5)}L`;
  if (abs >= 1e3) return `₹${trim(rupees / 1e3)}K`;
  return `₹${Math.round(rupees)}`;
}

/** "21.7K" — counts on a chart axis. */
export function formatShortNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";

  const abs = Math.abs(number);
  if (abs >= 1e7) return `${trim(number / 1e7)}Cr`;
  if (abs >= 1e5) return `${trim(number / 1e5)}L`;
  if (abs >= 1e3) return `${trim(number / 1e3)}K`;
  return String(Math.round(number));
}

function trim(value) {
  return value >= 100
    ? String(Math.round(value))
    : value.toFixed(1).replace(/\.0$/, "");
}

const COUNT = new Intl.NumberFormat("en-IN");

export function formatCount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? COUNT.format(number) : "—";
}

const IST_TIME = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const IST_WEEKDAY = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "long",
});
const IST_DAY_MONTH = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
});
const IST_DAY_MONTH_YEAR = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const IST_KEY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Shopify's order-list dates, in IST: "Today at 11:10 am", "Yesterday at
 * 9:00 pm", "Thursday at 3:43 pm" within the week, then "16 Oct at 8:09 pm".
 */
export function formatRelativeDateTime(value, now = new Date()) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const day = IST_KEY.format(date);
  const today = IST_KEY.format(now);
  const daysAgo = Math.round(
    (new Date(`${today}T00:00:00Z`) - new Date(`${day}T00:00:00Z`)) / MS_PER_DAY
  );
  const time = IST_TIME.format(date).replace(
    /\s?([AP]M)$/i,
    (_, m) => ` ${m.toLowerCase()}`
  );

  if (daysAgo === 0) return `Today at ${time}`;
  if (daysAgo === 1) return `Yesterday at ${time}`;
  if (daysAgo > 1 && daysAgo < 7)
    return `${IST_WEEKDAY.format(date)} at ${time}`;
  if (day.slice(0, 4) === today.slice(0, 4))
    return `${IST_DAY_MONTH.format(date)} at ${time}`;
  return `${IST_DAY_MONTH_YEAR.format(date)} at ${time}`;
}
