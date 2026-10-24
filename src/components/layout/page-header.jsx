import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const WIDTHS = {
  // Index tables and the dashboard use the room.
  wide: "max-w-[1400px]",
  // Detail and form pages read better in a column, as in Shopify.
  narrow: "max-w-[1100px]",
};

/**
 * The title row at the top of every dashboard screen, laid out like a Shopify
 * admin page: an optional back arrow, an icon and the title on the left,
 * secondary and primary actions on the right.
 *
 * Sticky rather than static: the scroll container is the main column in
 * `(dashboard)/layout.jsx`, so `top-0` pins this to the top of that scrollport
 * and long tables run underneath it. It needs an opaque background for the
 * same reason — a transparent header would let rows show through.
 */
export function PageHeader({
  title,
  subtitle,
  icon,
  backHref,
  width = "wide",
  children,
}) {
  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className={`mx-auto flex w-full ${WIDTHS[width] ?? WIDTHS.wide} flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6`}>
        <div className="flex min-w-0 items-center gap-2">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Back"
              className="-ml-1 rounded-lg p-1 text-muted transition hover:bg-black/5 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </Link>
          ) : null}

          {icon ? (
            <span className="shrink-0 text-foreground" aria-hidden="true">
              {icon}
            </span>
          ) : null}

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-xs text-muted">{subtitle}</p>
            ) : null}
          </div>
        </div>

        {children ? (
          <div className="flex flex-wrap items-center gap-2">{children}</div>
        ) : null}
      </div>
    </header>
  );
}

/** The padded, width-capped body under a PageHeader. */
export function PageBody({ width = "wide", className = "", children }) {
  return (
    <div
      className={`mx-auto w-full ${WIDTHS[width] ?? WIDTHS.wide} px-4 pb-10 sm:px-6 ${className}`}
    >
      {children}
    </div>
  );
}
