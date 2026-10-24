const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand/90",
  secondary: "bg-brand-soft text-brand hover:bg-brand-tint",
  ghost: "text-brand hover:bg-brand-soft",
  outline: "border border-border bg-surface text-foreground hover:bg-background",
};

const SIZES = {
  sm: "h-9 px-3",
  md: "h-11 px-4",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  return (
    <button
      className={`${BASE} ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? SIZES.md} ${className}`}
      {...props}
    />
  );
}
