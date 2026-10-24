/** Label + textarea. TextField's twin, for the fields that need room. */
const BASE =
  "font-nunito resize-y rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:ring-2 disabled:bg-background";
const NEUTRAL = "border-border focus:border-brand/50 focus:ring-brand/10";
const INVALID = "border-danger focus:border-danger focus:ring-danger/10";

export function TextareaField({
  id,
  label,
  hint,
  error,
  required,
  rows = 4,
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

      <textarea
        id={id}
        rows={rows}
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
