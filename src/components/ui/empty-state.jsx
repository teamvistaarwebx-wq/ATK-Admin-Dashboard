/**
 * What a list shows when it has nothing to show. `bare` drops the card frame
 * for use inside a card that already has one.
 */
export function EmptyState({ title, description, bare = false }) {
  return (
    <div
      className={`bg-surface px-6 py-16 text-center ${bare ? "" : "rounded-xl shadow-card"}`}
    >
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
