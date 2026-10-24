/**
 * The white panel every dashboard section sits in.
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
      className={`overflow-hidden rounded-xl border border-border bg-surface ${className}`}
    >
      {hasHeader ? (
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div>
            {title ? (
              <h2 className="font-newsreader text-lg font-semibold text-brand">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 font-nunito text-xs text-muted">{subtitle}</p>
            ) : null}
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}

      {children}
    </section>
  );
}
