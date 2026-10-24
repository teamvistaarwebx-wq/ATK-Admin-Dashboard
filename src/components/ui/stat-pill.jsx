const TONES = {
  success: "bg-success/10 text-success",
  gold: "bg-gold text-brand",
  muted: "bg-track/50 text-muted",
  danger: "bg-danger/10 text-danger",
};

export function StatPill({ children, tone = "muted" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        TONES[tone] ?? TONES.muted
      }`}
    >
      {children}
    </span>
  );
}
