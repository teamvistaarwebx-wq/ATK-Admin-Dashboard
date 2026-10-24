/**
 * The orders list's URL, with one thing changed. Range, tab and search all
 * live in the query string, so every link on the page has to carry the other
 * two — and drop `page`, which means nothing once the filter changes.
 */
const KEPT = ["range", "from", "to", "view", "q"];

export function buildOrdersHref(current, changes = {}, path = "/orders") {
  const params = new URLSearchParams();
  for (const key of KEPT) {
    const value = key in changes ? changes[key] : current[key];
    if (value) params.set(key, value);
  }
  if (changes.page && changes.page > 1)
    params.set("page", String(changes.page));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
