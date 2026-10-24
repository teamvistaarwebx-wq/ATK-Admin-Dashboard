/**
 * Label + input, wired together by id so clicking the label focuses the
 * field. Everything else is forwarded, which keeps `type`, `required`,
 * `autoComplete` and friends at the call site where they read as HTML.
 *
 * `error` turns the border red and replaces the hint with the message, so a
 * failure is answered where it happened rather than in a summary at the far
 * end of a long form. It replaces rather than stacks — a field showing both
 * "Enter a retail price" and "Struck through on the storefront" is noise.
 */
const BASE =
  "font-nunito h-11 rounded-lg border bg-surface px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:ring-2 disabled:bg-background";
const NEUTRAL = "border-border focus:border-brand/50 focus:ring-brand/10";
const INVALID = "border-danger focus:border-danger focus:ring-danger/10";

export function TextField({
  id,
  label,
  hint,
  error,
  required,
  className = "",
  ...props
}) {
  const messageId = error ? `${id}-error` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={id}
        className="font-nunito text-xs font-semibold text-foreground"
      >
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>

      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className={`${BASE} ${error ? INVALID : NEUTRAL}`}
        {...props}
      />

      {error ? (
        <p id={messageId} role="alert" className="font-nunito text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
