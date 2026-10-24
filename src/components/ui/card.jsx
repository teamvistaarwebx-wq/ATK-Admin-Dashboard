/**
 * The white panel every section sits in — Shopify's flat card: a hairline
 * edge, a 1px drop, no border colour of its own.
 *
 * `title` / `subtitle` / `action` are optional so the same component covers
 * both a titled panel and a bare container, and `children` is never wrapped
 * in padding the caller cannot escape — full-bleed rows and dividers are
 * common enough that the body owns its own spacing.
 */
export function Card({ title, subtitle, action, className = "", children }) {
  const hasHeader = Boolean(title || action);

  return (
    <section
      className={`overflow-hidden rounded-xl bg-surface shadow-card ${className}`}
    >
      {hasHeader ? (
        <div className="flex items-start justify-between gap-4 px-4 pt-4">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
            ) : null}
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}

      {children}
    </section>
  );
}
