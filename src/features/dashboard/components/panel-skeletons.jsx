/**
 * Suspense fallbacks, sized to roughly match what replaces them so the page
 * does not jump as each panel resolves.
 */
function Block({ className = "" }) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface ${className}`}
      aria-hidden="true"
    />
  );
}

export function KpiRowSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Block className="h-24" />
      <Block className="h-24" />
      <Block className="h-24" />
      <Block className="h-24" />
    </div>
  );
}

export function PanelSkeleton({ height = "h-64" }) {
  return <Block className={`animate-pulse ${height}`} />;
}
