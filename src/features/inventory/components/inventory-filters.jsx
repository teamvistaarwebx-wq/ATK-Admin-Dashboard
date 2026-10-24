"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { chipClass } from "@/components/ui/chip";
import { STOCK_VIEW } from "@/constants/inventory";

/**
 * Search and the four views above the inventory table.
 *
 * Same shape as the products filter bar: state lives in the URL so the table
 * stays a server component, and the results arrive as `children` so one
 * transition can dim them while the next page loads.
 */
const SEARCH_DEBOUNCE_MS = 300;

const VIEWS = [
  { value: STOCK_VIEW.ALL, label: "All" },
  { value: STOCK_VIEW.LOW, label: "Low stock" },
  { value: STOCK_VIEW.OUT, label: "Sold out" },
  { value: STOCK_VIEW.OVERSOLD, label: "Oversold" },
];

export function InventoryFilters({ q, view, searchIcon, children }) {
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
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  }

  /** Chips flush any search still waiting, so neither change is lost. */
  function applyNow(updates) {
    clearTimeout(debounceRef.current);
    apply({ q: term.trim(), ...updates });
  }

  function handleSearchChange(event) {
    const value = event.target.value;
    setTerm(value);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => apply({ q: value.trim() }),
      SEARCH_DEBOUNCE_MS
    );
  }

  return (
    <section className="overflow-hidden rounded-xl bg-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-2">
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Stock views">
          {VIEWS.map((chip) => {
            const active = chip.value === view;

            return (
              <button
                key={chip.value}
                type="button"
                aria-pressed={active}
                // "All" is the default, so it drops the param instead of
                // spelling it out in the URL.
                onClick={() =>
                  applyNow({
                    view: chip.value === STOCK_VIEW.ALL ? "" : chip.value,
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
            placeholder="Search SKU or product"
            aria-label="Search stock"
            className="h-8 w-full rounded-lg border border-border-strong bg-surface pl-8 pr-3 text-[0.8125rem] text-foreground outline-none transition placeholder:text-subtle focus:border-foreground/50 focus:ring-2 focus:ring-black/5"
          />
        </div>
      </div>

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
