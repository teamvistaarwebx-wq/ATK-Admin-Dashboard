"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  ALL_TIME,
  COMPARE_OPTIONS,
  MAX_RANGE_DAYS,
  RANGE_PRESETS,
  addDays,
  daysBetween,
  formatRangeLabel,
  isDayKey,
  presetDays,
  todayKey,
} from "@/lib/date-range";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_TITLE = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Shopify's date-range control: a button naming the range, opening a panel
 * with the presets down the left and a two-month calendar on the right.
 *
 * The range lives in the URL (`range`, or `from` + `to`), so the server
 * renders the page for it and a filtered view is a link somebody can share.
 * Applying a range drops `page` — page 4 of the old range is meaningless.
 *
 * `range` is the server-resolved range, so the button always names what the
 * page is actually showing, whatever was typed into the address bar.
 */
export function DateRangePicker({ range, allowAllTime = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function onPointer(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function apply(next) {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ["range", "from", "to", "page"]) params.delete(key);
    for (const [key, value] of Object.entries(next)) params.set(key, value);
    setOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-surface px-3 text-[0.8125rem] font-semibold text-foreground shadow-button ring-1 ring-border-strong/70 transition hover:bg-surface-hover"
      >
        <Calendar className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        {range.label}
      </button>

      {open ? (
        <RangePanel
          range={range}
          allowAllTime={allowAllTime}
          onApply={apply}
          onCancel={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

function RangePanel({ range, allowAllTime, onApply, onCancel }) {
  const today = todayKey();
  const [preset, setPreset] = useState(range.key);
  const [from, setFrom] = useState(range.from ?? addDays(today, -29));
  const [to, setTo] = useState(range.to ?? today);
  // Waiting for the second click of a custom range.
  const [anchor, setAnchor] = useState(null);
  const [hover, setHover] = useState(null);
  // The left-hand month of the pair.
  const [view, setView] = useState(() =>
    monthOf(addMonthsKey(to ?? today, -1))
  );

  const [fromText, setFromText] = useState(from);
  const [toText, setToText] = useState(to);

  function choosePreset(key) {
    setPreset(key);
    if (key === ALL_TIME.key) return;
    // The server resolves the same key from the same function when the URL
    // lands; this copy only drives the calendar highlight.
    const days = presetDays(key, today);
    setFrom(days.from);
    setTo(days.to);
    setFromText(days.from);
    setToText(days.to);
    setView(monthOf(addMonthsKey(days.to, -1)));
  }

  function pickDay(key) {
    setPreset("custom");
    if (!anchor) {
      setAnchor(key);
      setFrom(key);
      setTo(key);
      setFromText(key);
      setToText(key);
      return;
    }
    const [a, b] = key < anchor ? [key, anchor] : [anchor, key];
    setFrom(a);
    setTo(b);
    setFromText(a);
    setToText(b);
    setAnchor(null);
    setHover(null);
  }

  function commitText(which, value) {
    if (!isDayKey(value)) return;
    setPreset("custom");
    if (which === "from") {
      setFrom(value);
      if (value > to) setTo(value);
    } else {
      setTo(value);
      if (value < from) setFrom(value);
    }
  }

  const tooLong = preset === "custom" && daysBetween(from, to) > MAX_RANGE_DAYS;

  function handleApply() {
    if (preset === ALL_TIME.key) return onApply({ range: ALL_TIME.key });
    if (preset !== "custom") return onApply({ range: preset });
    if (tooLong) return undefined;
    return onApply({ from, to });
  }

  // While choosing the second end, preview the range under the pointer.
  const previewFrom =
    anchor && hover ? (hover < anchor ? hover : anchor) : from;
  const previewTo = anchor && hover ? (hover < anchor ? anchor : hover) : to;

  return (
    <div
      role="dialog"
      aria-label="Choose a date range"
      className="absolute left-0 top-10 z-30 w-[min(44rem,calc(100vw-2rem))] overflow-hidden rounded-xl bg-surface shadow-popover"
    >
      <div className="flex flex-col sm:flex-row">
        <ul className="flex shrink-0 gap-1 overflow-x-auto border-b border-border p-2 sm:w-44 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r">
          {allowAllTime ? (
            <PresetItem
              active={preset === ALL_TIME.key}
              onClick={() => choosePreset(ALL_TIME.key)}
            >
              {ALL_TIME.label}
            </PresetItem>
          ) : null}
          {RANGE_PRESETS.map((item) => (
            <PresetItem
              key={item.key}
              active={preset === item.key}
              onClick={() => choosePreset(item.key)}
            >
              {item.label}
            </PresetItem>
          ))}
          <PresetItem
            active={preset === "custom"}
            onClick={() => setPreset("custom")}
          >
            Custom
          </PresetItem>
        </ul>

        <div className="min-w-0 flex-1 p-4">
          <div className="grid grid-cols-2 gap-3">
            <DateInput
              label="Starting"
              value={fromText}
              onChange={setFromText}
              onCommit={(value) => commitText("from", value)}
              disabled={preset === ALL_TIME.key}
            />
            <DateInput
              label="Ending"
              value={toText}
              onChange={setToText}
              onCommit={(value) => commitText("to", value)}
              disabled={preset === ALL_TIME.key}
            />
          </div>

          <div
            className={`mt-4 ${preset === ALL_TIME.key ? "pointer-events-none opacity-40" : ""}`}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setView((v) => addMonthsKey(v, -1))}
                aria-label="Previous month"
                className="rounded-lg p-1 text-muted transition hover:bg-surface-hover hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setView((v) => addMonthsKey(v, 1))}
                aria-label="Next month"
                className="rounded-lg p-1 text-muted transition hover:bg-surface-hover hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-1 grid gap-6 sm:grid-cols-2">
              {[view, addMonthsKey(view, 1)].map((month, index) => (
                <Month
                  key={month}
                  month={month}
                  // One month is enough on a phone.
                  className={index === 1 ? "hidden sm:block" : ""}
                  today={today}
                  from={previewFrom}
                  to={previewTo}
                  onPick={pickDay}
                  onHover={anchor ? setHover : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <p className="text-xs text-muted">
          {tooLong
            ? `Pick ${MAX_RANGE_DAYS} days or fewer.`
            : preset === ALL_TIME.key
              ? "Every order, newest first."
              : `${formatRangeLabel(from, to)} · ${daysBetween(from, to)} ${
                  daysBetween(from, to) === 1 ? "day" : "days"
                } · IST`}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-7 rounded-lg bg-surface px-3 text-xs font-semibold text-foreground shadow-button ring-1 ring-border-strong/70 transition hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={tooLong}
            className="h-7 rounded-lg bg-primary px-3 text-xs font-semibold text-white shadow-primary transition hover:bg-primary-hover disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function PresetItem({ active, onClick, children }) {
  return (
    <li className="shrink-0">
      <button
        type="button"
        onClick={onClick}
        className={`w-full whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-[0.8125rem] transition ${
          active
            ? "bg-surface-hover font-semibold text-foreground"
            : "text-foreground hover:bg-surface-hover"
        }`}
      >
        {children}
      </button>
    </li>
  );
}

function DateInput({ label, value, onChange, onCommit, disabled }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
      {label}
      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value);
          onCommit(event.target.value);
        }}
        className="h-8 rounded-lg border border-border-strong bg-surface px-2.5 text-[0.8125rem] outline-none focus:border-foreground/50 focus:ring-2 focus:ring-black/5 disabled:bg-surface-subdued"
      />
    </label>
  );
}

function Month({ month, today, from, to, onPick, onHover, className = "" }) {
  const first = `${month}-01`;
  const lead = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const length = daysInMonth(month);

  const cells = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let day = 1; day <= length; day += 1) {
    cells.push(`${month}-${String(day).padStart(2, "0")}`);
  }

  return (
    <div className={className}>
      <p className="text-center text-[0.8125rem] font-semibold text-foreground">
        {MONTH_TITLE.format(new Date(`${first}T00:00:00Z`))}
      </p>
      <div className="mt-2 grid grid-cols-7 text-center text-[0.6875rem] font-medium text-muted">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7" onMouseLeave={() => onHover?.(null)}>
        {cells.map((key, index) => {
          if (!key) return <span key={`blank-${index}`} />;

          const inRange = from && to && key >= from && key <= to;
          const isEdge = key === from || key === to;
          const future = key > today;

          return (
            <button
              key={key}
              type="button"
              disabled={future}
              onClick={() => onPick(key)}
              onMouseEnter={() => onHover?.(key)}
              aria-pressed={Boolean(inRange)}
              aria-label={key}
              className={`h-8 text-[0.8125rem] tabular-nums transition disabled:cursor-not-allowed disabled:text-border-strong ${
                isEdge
                  ? "rounded-lg bg-primary font-semibold text-white"
                  : inRange
                    ? "bg-surface-hover text-foreground"
                    : "rounded-lg text-foreground hover:bg-surface-hover"
              } ${key === today && !isEdge ? "font-bold underline underline-offset-4" : ""}`}
            >
              {Number(key.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The compare-to control beside the range. A small menu rather than a second
 * panel — there are only three choices.
 */
export function CompareSelect({ range }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!range.from) return null;

  function change(event) {
    const params = new URLSearchParams(searchParams.toString());
    if (event.target.value === "previous_period") params.delete("compare");
    else params.set("compare", event.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <label className="relative inline-flex h-8 items-center rounded-lg bg-surface pl-3 text-[0.8125rem] font-semibold text-foreground shadow-button ring-1 ring-border-strong/70 transition hover:bg-surface-hover">
      <span className="text-muted">Compare:&nbsp;</span>
      <select
        value={range.compare}
        onChange={change}
        className="h-full cursor-pointer appearance-none bg-transparent pr-7 font-semibold outline-none"
      >
        {COMPARE_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronRight
        className="pointer-events-none absolute right-2 h-3.5 w-3.5 rotate-90 text-muted"
        aria-hidden="true"
      />
    </label>
  );
}

/* ------------------------------------------------------------ calendar math */

function monthOf(key) {
  return key.slice(0, 7);
}

/** Works on "YYYY-MM" and "YYYY-MM-DD" alike, returning "YYYY-MM". */
function addMonthsKey(key, months) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));
  return date.toISOString().slice(0, 7);
}

function daysInMonth(month) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}
