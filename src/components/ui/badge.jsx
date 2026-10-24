/**
 * The status pill used in every table — Shopify's badge: a tinted fill, ink
 * that clears AA on it, and an optional leading dot or ring that says
 * "complete / incomplete / partial" without leaning on colour alone.
 */
const TONES = {
  neutral: "bg-badge-neutral text-badge-neutral-ink",
  success: "bg-badge-success text-badge-success-ink",
  attention: "bg-badge-attention text-badge-attention-ink",
  warning: "bg-badge-warning text-badge-warning-ink",
  critical: "bg-badge-critical text-badge-critical-ink",
  info: "bg-badge-info text-badge-info-ink",
};

/**
 * `progress`: "complete" draws a filled dot, "incomplete" a hollow ring,
 * "partial" a half-filled one — the same shapes Shopify uses for payment and
 * fulfilment.
 */
export function Badge({ tone = "neutral", progress, children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-0.5 text-xs font-medium ${
        TONES[tone] ?? TONES.neutral
      } ${className}`}
    >
      {progress ? <ProgressIcon progress={progress} /> : null}
      {children}
    </span>
  );
}

function ProgressIcon({ progress }) {
  return (
    <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 shrink-0" aria-hidden="true">
      <circle
        cx="5"
        cy="5"
        r="3.75"
        fill={progress === "complete" ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {progress === "partial" ? (
        <path d="M5 1.25 A3.75 3.75 0 0 1 5 8.75 Z" fill="currentColor" />
      ) : null}
    </svg>
  );
}
