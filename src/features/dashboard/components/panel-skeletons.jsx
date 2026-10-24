/**
 * Suspense fallback, sized to roughly match what replaces it so the page does
 * not jump as each panel resolves.
 */
export function PanelSkeleton({ height = "h-64" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface shadow-card ${height}`}
      aria-hidden="true"
    />
  );
}
