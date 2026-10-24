/**
 * Date ranges for the dashboard and the orders list, in Indian days.
 *
 * Shared by the server (to filter and bucket Mongo reads) and the browser (the
 * picker), so nothing here may import a server module. Every range is a pair
 * of IST calendar days, `from` and `to`, both inclusive, carried in the URL as
 * `?range=last_30_days` or `?from=2026-10-01&to=2026-10-24`.
 *
 * Left to the server's clock an order placed at 9pm IST lands on the next UTC
 * date — and on Vercel the server clock is UTC — so the arithmetic below runs
 * on UTC-anchored midnights (adding a day is always exactly 24 hours) and only
 * the final instants are converted back using India's fixed +05:30 offset.
 */
export const TIMEZONE = "Asia/Kolkata";
const IST_OFFSET = "+05:30";

/** en-CA is the shortest route to a YYYY-MM-DD string in a given zone. */
export const IST_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const IST_HOUR = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  hour: "2-digit",
  hourCycle: "h23",
});

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** The longest custom range the picker will accept — two years of buckets. */
export const MAX_RANGE_DAYS = 731;

export const RANGE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last_7_days", label: "Last 7 days" },
  { key: "last_30_days", label: "Last 30 days" },
  { key: "last_90_days", label: "Last 90 days" },
  { key: "this_month", label: "Month to date" },
  { key: "last_month", label: "Last month" },
  { key: "this_quarter", label: "Quarter to date" },
  { key: "last_quarter", label: "Last quarter" },
  { key: "this_year", label: "Year to date" },
  { key: "last_365_days", label: "Last 365 days" },
];

/** Orders can also be listed without any date bound. */
export const ALL_TIME = { key: "all", label: "All time" };

export const COMPARE_OPTIONS = [
  { key: "previous_period", label: "Previous period" },
  { key: "previous_year", label: "Previous year" },
  { key: "none", label: "No comparison" },
];

const PRESET_KEYS = new Set(RANGE_PRESETS.map((preset) => preset.key));

/* ---------------------------------------------------------------- day keys */

export function todayKey(now = new Date()) {
  return IST_DATE.format(now);
}

function keyToUtc(key) {
  return new Date(`${key}T00:00:00Z`);
}

function utcToKey(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(key, days) {
  const date = keyToUtc(key);
  date.setUTCDate(date.getUTCDate() + days);
  return utcToKey(date);
}

/** Calendar shift that clamps the day: 31 Mar minus a month is 28/29 Feb. */
function addMonths(key, months) {
  const [year, month, day] = key.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return utcToKey(target);
}

function startOfMonth(key) {
  return `${key.slice(0, 7)}-01`;
}

function endOfMonth(key) {
  return addDays(addMonths(startOfMonth(key), 1), -1);
}

function startOfQuarter(key) {
  const [year, month] = key.split("-").map(Number);
  const first = Math.floor((month - 1) / 3) * 3 + 1;
  return `${year}-${String(first).padStart(2, "0")}-01`;
}

export function daysBetween(fromKey, toKey) {
  return Math.round((keyToUtc(toKey) - keyToUtc(fromKey)) / MS_PER_DAY) + 1;
}

export function isDayKey(value) {
  if (!DAY_KEY.test(String(value ?? ""))) return false;
  const date = keyToUtc(value);
  return !Number.isNaN(date.getTime()) && utcToKey(date) === value;
}

/** The instant an IST day begins. */
export function istStart(key) {
  return new Date(`${key}T00:00:00${IST_OFFSET}`);
}

/* ----------------------------------------------------------------- presets */

export function presetDays(key, today) {
  switch (key) {
    case "today":
      return { from: today, to: today, unit: null };
    case "yesterday": {
      const day = addDays(today, -1);
      return { from: day, to: day, unit: null };
    }
    case "last_7_days":
      return { from: addDays(today, -6), to: today, unit: null };
    case "last_30_days":
      return { from: addDays(today, -29), to: today, unit: null };
    case "last_90_days":
      return { from: addDays(today, -89), to: today, unit: null };
    case "last_365_days":
      return { from: addDays(today, -364), to: today, unit: null };
    case "this_month":
      return { from: startOfMonth(today), to: today, unit: 1 };
    case "last_month": {
      const from = addMonths(startOfMonth(today), -1);
      return { from, to: endOfMonth(from), unit: 1, complete: true };
    }
    case "this_quarter":
      return { from: startOfQuarter(today), to: today, unit: 3 };
    case "last_quarter": {
      const from = addMonths(startOfQuarter(today), -3);
      return { from, to: addDays(addMonths(from, 3), -1), unit: 3, complete: true };
    }
    case "this_year":
      return { from: `${today.slice(0, 4)}-01-01`, to: today, unit: 12 };
    default:
      return null;
  }
}

/**
 * URL params → a fully resolved range.
 *
 * Anything unreadable falls back to `fallback` rather than erroring: these
 * come straight from the address bar, and a bad bookmark should land on a
 * working page.
 */
export function resolveDateRange(
  { range, from, to, compare } = {},
  { fallback = "last_30_days", allowAllTime = false, now = new Date() } = {}
) {
  const today = todayKey(now);

  if (allowAllTime && range === ALL_TIME.key) return allTimeRange();

  let key = PRESET_KEYS.has(range) ? range : null;
  let days = key ? presetDays(key, today) : null;

  if (!days && isDayKey(from) && isDayKey(to)) {
    const [a, b] = from <= to ? [from, to] : [to, from];
    // Clamp rather than refuse an over-long range; the picker never offers
    // one, so this is a hand-edited URL.
    const start =
      daysBetween(a, b) > MAX_RANGE_DAYS ? addDays(b, -(MAX_RANGE_DAYS - 1)) : a;
    key = "custom";
    days = { from: start, to: b, unit: null };
  }

  if (!days) {
    if (allowAllTime && fallback === ALL_TIME.key) return allTimeRange();
    key = fallback;
    days = presetDays(fallback, today);
  }

  const compareKey = COMPARE_OPTIONS.some((option) => option.key === compare)
    ? compare
    : "previous_period";

  const base = describe(days.from, days.to);

  return {
    key,
    label:
      key === "custom"
        ? formatRangeLabel(days.from, days.to)
        : RANGE_PRESETS.find((preset) => preset.key === key).label,
    ...base,
    granularity: granularityFor(base.days),
    compare: compareKey,
    comparison: comparisonFor(days, compareKey),
  };
}

/** No lower or upper bound — only the orders list offers this. */
function allTimeRange() {
  return {
    key: ALL_TIME.key,
    label: ALL_TIME.label,
    from: null,
    to: null,
    start: null,
    end: null,
    days: null,
    granularity: "month",
    compare: "none",
    comparison: null,
  };
}

function describe(fromKey, toKey) {
  return {
    from: fromKey,
    to: toKey,
    start: istStart(fromKey),
    // Exclusive: the first instant of the day after `to`.
    end: istStart(addDays(toKey, 1)),
    days: daysBetween(fromKey, toKey),
  };
}

/**
 * The period a range is compared with.
 *
 * Calendar presets compare like with like — month to date against the same
 * days of last month, last quarter against the one before — which is what
 * Shopify does and what people expect. Rolling and custom ranges shift back
 * by their own length.
 */
function comparisonFor({ from, to, unit, complete }, compareKey) {
  if (compareKey === "none") return null;

  let range;
  if (compareKey === "previous_year") {
    range = { from: addMonths(from, -12), to: addMonths(to, -12) };
  } else if (unit) {
    const shifted = addMonths(from, -unit);
    // A whole month is compared with the whole month before it — 30 Sep
    // shifted back a month is 30 Aug, which would drop the 31st.
    range = {
      from: shifted,
      to: complete ? addDays(addMonths(shifted, unit), -1) : addMonths(to, -unit),
    };
  } else {
    const length = daysBetween(from, to);
    range = { from: addDays(from, -length), to: addDays(to, -length) };
  }

  return { ...describe(range.from, range.to), label: formatRangeLabel(range.from, range.to) };
}

/** One point per hour for a single day, per day up to a quarter, then weeks. */
export function granularityFor(days) {
  if (days <= 1) return "hour";
  if (days <= 92) return "day";
  if (days <= 400) return "week";
  return "month";
}

/* ---------------------------------------------------------------- buckets */

const SHORT_DAY = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const SHORT_DAY_YEAR = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const MONTH_YEAR = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function hourLabel(hour) {
  const suffix = hour < 12 ? "am" : "pm";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve} ${suffix}`;
}

/** Monday on or before the day — Mongo's `startOfWeek: "monday"`. */
function startOfWeek(key) {
  const date = keyToUtc(key);
  const shift = (date.getUTCDay() + 6) % 7;
  return addDays(key, -shift);
}

/**
 * The ordered, zero-fillable list of buckets a range is drawn with. Mongo only
 * returns buckets that saw activity; a quiet Wednesday still needs its point.
 */
export function buildBuckets({ from, to }, granularity) {
  const buckets = [];

  if (granularity === "hour") {
    for (let hour = 0; hour < 24; hour += 1) {
      buckets.push({
        key: `${from}T${String(hour).padStart(2, "0")}`,
        label: hourLabel(hour),
      });
    }
    return buckets;
  }

  if (granularity === "day") {
    for (let key = from; key <= to; key = addDays(key, 1)) {
      buckets.push({ key, label: SHORT_DAY.format(keyToUtc(key)) });
    }
    return buckets;
  }

  if (granularity === "week") {
    for (let key = startOfWeek(from); key <= to; key = addDays(key, 7)) {
      buckets.push({ key, label: SHORT_DAY.format(keyToUtc(key)) });
    }
    return buckets;
  }

  for (let key = startOfMonth(from); key <= to; key = addMonths(key, 1)) {
    buckets.push({ key: key.slice(0, 7), label: MONTH_YEAR.format(keyToUtc(key)) });
  }
  return buckets;
}

/** The `$dateTrunc` stage options matching `buildBuckets`. */
export function dateTruncFor(field, granularity) {
  return {
    $dateTrunc: {
      date: field,
      unit: granularity,
      timezone: TIMEZONE,
      ...(granularity === "week" ? { startOfWeek: "monday" } : {}),
    },
  };
}

/** The bucket key a truncated instant from Mongo belongs to. */
export function bucketKeyOf(instant, granularity) {
  const day = IST_DATE.format(instant);
  if (granularity === "hour") return `${day}T${IST_HOUR.format(instant)}`;
  if (granularity === "month") return day.slice(0, 7);
  return day;
}

/* ------------------------------------------------------------------ labels */

export function formatRangeLabel(fromKey, toKey) {
  if (!fromKey) return ALL_TIME.label;
  if (fromKey === toKey) return SHORT_DAY_YEAR.format(keyToUtc(fromKey));

  const sameYear = fromKey.slice(0, 4) === toKey.slice(0, 4);
  const start = (sameYear ? SHORT_DAY : SHORT_DAY_YEAR).format(keyToUtc(fromKey));
  return `${start} – ${SHORT_DAY_YEAR.format(keyToUtc(toKey))}`;
}

/** The URL params a resolved range is written back as. */
export function rangeToParams(range) {
  if (!range || range.key === ALL_TIME.key) return { range: ALL_TIME.key };
  const params =
    range.key === "custom" ? { from: range.from, to: range.to } : { range: range.key };
  if (range.compare && range.compare !== "previous_period") {
    params.compare = range.compare;
  }
  return params;
}

/** Percentage change, or null when there is nothing to compare against. */
export function percentChange(current, previous) {
  if (previous == null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
