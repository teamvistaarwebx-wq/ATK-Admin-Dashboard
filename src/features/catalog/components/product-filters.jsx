"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { chipClass } from "@/components/ui/chip";
import { STOCK_FILTER } from "@/constants/catalog-query";

/**
 * Search, category chips and the stock toggle above the products table.
 *
 * Filter state lives in the URL rather than in here, so the table stays a
 * server component: every change is a navigation the server answers with a
 * new list. That also makes a filtered view something staff can bookmark and
 * send to each other.
 *
 * The table arrives as `children` — a server component passed through — which
 * is what lets one `useTransition` dim the results it is filtering while the
 * next page streams in. Splitting them would leave the table with no idea a
 * filter had changed.
 */

/** One navigation per pause in typing, not one per keystroke. */
const SEARCH_DEBOUNCE_MS = 300;

const STOCK_CHIPS = [
  { value: STOCK_FILTER.ALL, label: "All" },
  { value: STOCK_FILTER.IN, label: "In stock" },
  { value: STOCK_FILTER.OUT, label: "Sold out" },
];

/** Category filters: Shopify's dashed-outline filter pills. */
const PILL = "rounded-lg border px-2.5 py-0.5 text-xs font-medium transition";
const PILL_ON = "border-foreground bg-foreground text-white";
const PILL_OFF =
  "border-dashed border-border-strong text-muted hover:border-foreground/50 hover:text-foreground";

export function ProductFilters({
  q,
  subcategory,
  stock,
  subcategories,
  searchIcon,
  showStock = true,
  children,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [term, setTerm] = useState(q);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef(null);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  function apply(updates) {
    const params = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }

    // A narrower filter can leave the current page past the end of the list.
    params.delete("page");

    const query = params.toString();

    // replace, not push: twenty keystrokes must not become twenty entries in
    // the back button. The transition keeps the chips and the input live
    // while the server builds the new list.
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  }

  /**
   * Chips navigate immediately, and cancel any search still waiting out its
   * debounce — carrying the typed term along, so a click mid-word applies
   * both rather than losing one to the other.
   */
  function applyNow(updates) {
    clearTimeout(debounceRef.current);
    apply({ q: term.trim(), ...updates });
  }

  function handleSearchChange(event) {
    const value = event.target.value;

    // Urgent: the input must never lag behind the keyboard.
    setTerm(value);

    // Debounced in the handler rather than an effect — the navigation belongs
    // to the keystroke, not to a render.
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => apply({ q: value.trim() }),
      SEARCH_DEBOUNCE_MS
    );
  }

  return (
    <section className="overflow-hidden rounded-xl bg-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-2">
        {/* Made to order has no stock to filter by, so its strip is a lone
            "All" tab. */}
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Stock">
          {(showStock ? STOCK_CHIPS : STOCK_CHIPS.slice(0, 1)).map((chip) => {
            const active = chip.value === stock;

            return (
              <button
                key={chip.value}
                type="button"
                aria-pressed={active}
                // "All" is the default, so it drops the param instead of
                // spelling it out in the URL.
                onClick={() =>
                  applyNow({
                    stock: chip.value === STOCK_FILTER.ALL ? "" : chip.value,
                  })
                }
                className={chipClass(active)}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
          >
            {searchIcon}
          </span>

          <input
            type="search"
            value={term}
            onChange={handleSearchChange}
            placeholder="Search products"
            aria-label="Search products"
            className="h-8 w-full rounded-lg border border-border-strong bg-surface pl-8 pr-3 text-[0.8125rem] text-foreground outline-none transition placeholder:text-subtle focus:border-foreground/50 focus:ring-2 focus:ring-black/5"
          />
        </div>
      </div>

      {subcategories.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-3 py-2">
          <span className="mr-1 text-xs text-muted">Category</span>
          {subcategories.map((sub) => {
            const active = sub.slug === subcategory;

            return (
              <button
                key={sub.slug}
                type="button"
                aria-pressed={active}
                // Clicking the lit pill clears it — the row doubles as its own
                // "all categories" control, so it needs no extra pill.
                onClick={() => applyNow({ subcategory: active ? "" : sub.slug })}
                className={`${PILL} ${active ? PILL_ON : PILL_OFF}`}
              >
                {sub.name}
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        aria-busy={isPending}
        className={`transition-opacity duration-150 ${
          isPending ? "opacity-50" : "opacity-100"
        }`}
      >
        {children}
      </div>
    </section>
  );
}
