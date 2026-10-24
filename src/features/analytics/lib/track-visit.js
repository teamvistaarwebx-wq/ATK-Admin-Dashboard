import { connectDb } from "@/db/connect";
import { SiteSession } from "@/models/site-session.model";
import { ALL_INDIAN_STATES, STATE_BY_CODE } from "@/constants/india";

/** A visit ends after thirty minutes with nothing from the visitor. */
export const SESSION_IDLE_MS = 30 * 60 * 1000;

const VISITOR_ID = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * Vercel sends the ISO 3166-2 subdivision code ("MH", "KA") rather than a
 * name, and the dashboard groups by the name Order.address.state uses. Only
 * Indian codes are mapped; anything else is stored as sent.
 */
const STATE_BY_LOWER = new Map(
  ALL_INDIAN_STATES.map((name) => [name.toLowerCase(), name])
);

/** "MH", "maharashtra" and "Maharashtra" all become "Maharashtra". */
export function normaliseState(value, country = "IN") {
  const raw = decodeSafe(String(value ?? "").trim()).slice(0, 80);
  if (!raw) return "";

  if (country === "IN" || !country) {
    const byCode = STATE_BY_CODE[raw.toUpperCase()];
    if (byCode) return byCode;
    const byName = STATE_BY_LOWER.get(raw.toLowerCase());
    if (byName) return byName;
  }

  return raw;
}

/** Vercel URL-encodes the city ("New%20Delhi"). */
function decodeSafe(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|yandex|ecosia)\./i;
const SOCIAL =
  /(^|\.)(facebook|fb|instagram|t\.co|twitter|x|linkedin|pinterest|youtube|whatsapp|wa\.me|lnkd)\./i;

/** Where the visit came from, in Shopify's traffic-type buckets. */
export function classifySource(referrer, path, ownHost) {
  const query = String(path ?? "").split("?")[1] ?? "";
  const params = new URLSearchParams(query);
  const medium = (params.get("utm_medium") ?? "").toLowerCase();

  if (
    params.has("gclid") ||
    params.has("fbclid") ||
    /cpc|paid|ads?$/.test(medium)
  ) {
    return "paid";
  }
  if (medium === "email") return "email";

  let host = "";
  try {
    host = referrer ? new URL(referrer).hostname : "";
  } catch {
    host = "";
  }

  if (!host || (ownHost && host.endsWith(ownHost))) return "direct";
  if (SEARCH.test(host)) return "search";
  if (SOCIAL.test(host)) return "social";
  return "referral";
}

function clip(value, max) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

/**
 * Records one hit from the storefront.
 *
 * `event` is "pageview" (counts a page), "heartbeat" (keeps the session live
 * without counting a page — the storefront sends one every minute while the
 * tab is visible) or "cart" (the cart changed). Every event refreshes
 * `lastSeenAt`, which is what the live view reads.
 *
 * Extends the visitor's live session if there is one, otherwise opens a new
 * one. Two hits racing can open two sessions for one visit; that overcounts by
 * one in a rare race and is not worth a transaction.
 */
export async function trackVisit(input, { ownHost = "" } = {}) {
  const visitorId = clip(input?.visitorId, 64);
  if (!VISITOR_ID.test(visitorId)) return { error: "Bad visitorId" };

  const event = ["pageview", "heartbeat", "cart"].includes(input?.event)
    ? input.event
    : "pageview";

  await connectDb();

  const now = new Date();
  const path = clip(input?.path, 300);
  const country = clip(input?.country, 2).toUpperCase();
  const region = {
    country,
    state: normaliseState(input?.state, country),
    city: decodeSafe(clip(input?.city, 80)),
  };

  const hasCart = input?.cart && typeof input.cart === "object";
  const cart = hasCart
    ? {
        items: Math.max(
          0,
          Math.min(999, Number.parseInt(input.cart.items, 10) || 0)
        ),
        value: Math.max(0, Math.round(Number(input.cart.value) || 0)),
        updatedAt: now,
      }
    : null;

  const set = { lastSeenAt: now };
  if (path && event === "pageview") set.lastPath = path;
  if (cart) set.cart = cart;
  // Geo can arrive late (a heartbeat from a different edge) — keep the first.

  const live = await SiteSession.findOneAndUpdate(
    {
      visitorId,
      lastSeenAt: { $gte: new Date(now.getTime() - SESSION_IDLE_MS) },
    },
    { $set: set, $inc: { pageViews: event === "pageview" ? 1 : 0 } },
    { sort: { lastSeenAt: -1 }, new: true, projection: { _id: 1 } }
  ).lean();

  if (live) return { ok: true, sessionId: String(live._id), started: false };

  const referrer = clip(input?.referrer, 300);
  const created = await SiteSession.create({
    visitorId,
    startedAt: now,
    lastSeenAt: now,
    pageViews: event === "pageview" ? 1 : 0,
    landingPath: path,
    lastPath: path,
    referrer,
    source: classifySource(referrer, path, ownHost),
    device: ["mobile", "tablet", "desktop"].includes(input?.device)
      ? input.device
      : "",
    region,
    ...(cart ? { cart } : {}),
  });

  return { ok: true, sessionId: String(created._id), started: true };
}
