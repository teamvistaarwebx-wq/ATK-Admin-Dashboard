const BASE =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-semibold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Shopify's button set: one charcoal primary per screen, white secondaries
 * with a pressed-in bottom edge, and a plain text style for tertiary links.
 * Brand red is kept out of buttons on purpose — it is the accent, and an
 * accent on every control stops meaning anything.
 */
const VARIANTS = {
  primary: "bg-primary text-white shadow-primary hover:bg-primary-hover",
  secondary:
    "bg-surface text-foreground shadow-button ring-1 ring-border-strong/70 hover:bg-surface-hover",
  plain: "text-foreground hover:bg-surface-hover",
  critical: "bg-danger text-white shadow-primary hover:bg-danger/90",
  // Kept so existing call sites read the same; maps onto the new set.
  ghost: "text-foreground hover:bg-surface-hover",
  outline:
    "bg-surface text-foreground shadow-button ring-1 ring-border-strong/70 hover:bg-surface-hover",
};

const SIZES = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-8 px-3 text-[0.8125rem]",
  lg: "h-10 px-4 text-sm",
};

/** For a <Link> that should look like a button. */
export function buttonClass(variant = "primary", size = "md", className = "") {
  return `${BASE} ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? SIZES.md} ${className}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}
