import Link from "next/link";

/**
 * The Previous / Next bar under a listing table.
 *
 * Products and Inventory had a byte-identical copy of this each; they now
 * share one. `buildHref` stays a caller-supplied function because the two
 * screens carry different filters in their URLs — that difference is the only
 * thing that was ever actually different between the copies.
 */
export function Pagination({ page, totalPages, total, noun, buildHref }) {
  // Nothing to page through — render nothing rather than a bar with both
  // buttons dead.
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs"
    >
      <p className="text-muted">
        Page {page} of {totalPages} · {total} {total === 1 ? noun : `${noun}s`}
      </p>

      <div className="flex items-center gap-2">
        <PageLink href={buildHref(page - 1)} disabled={page <= 1}>
          Previous
        </PageLink>
        <PageLink href={buildHref(page + 1)} disabled={page >= totalPages}>
          Next
        </PageLink>
      </div>
    </nav>
  );
}

/** A span, not a disabled link — there is no such thing, and a link to the
 *  page you are already on is a trap for keyboard users. */
function PageLink({ href, disabled, children }) {
  if (disabled) {
    return (
      <span className="rounded-lg px-3 py-1 text-xs font-semibold text-muted opacity-50 ring-1 ring-border">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-lg bg-surface px-3 py-1 text-xs font-semibold text-foreground shadow-button ring-1 ring-border-strong/70 transition hover:bg-surface-hover"
    >
      {children}
    </Link>
  );
}
