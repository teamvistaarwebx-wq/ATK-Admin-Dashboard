/**
 * The view tabs above the product and inventory tables — Shopify's
 * "All · Active · Draft" strip at the top of an index table.
 *
 * One definition, because two lists that filter the same way should not drift
 * into looking different.
 */
const BASE = "rounded-lg px-3 py-1 text-xs font-semibold transition";
const ON = "bg-black/[0.08] text-foreground";
const OFF = "text-muted hover:bg-black/[0.05] hover:text-foreground";

export function chipClass(active) {
  return `${BASE} ${active ? ON : OFF}`;
}
