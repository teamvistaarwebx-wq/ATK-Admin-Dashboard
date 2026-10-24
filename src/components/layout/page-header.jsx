/**
 * The bar at the top of every dashboard screen.
 *
 * Sticky rather than static: the scroll container is the flex column in
 * `(dashboard)/layout.jsx`, so `top-0` pins this to the top of that scrollport
 * and long tables run underneath it. It needs an opaque `bg-background` for
 * the same reason — a transparent header would let rows show through.
 */
export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-start justify-between gap-4 border-b border-border bg-background px-6 py-5 sm:px-8">
      <div>
        <h1 className="font-newsreader text-2xl font-semibold text-brand">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 font-nunito text-xs text-muted sm:text-sm">{subtitle}</p>
        ) : null}
      </div>

      {children ? <div className="flex items-center gap-3">{children}</div> : null}
    </header>
  );
}
