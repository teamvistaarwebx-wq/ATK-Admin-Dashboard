"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

/**
 * Right-anchored slide-over.
 *
 * The same native <dialog> + showModal() footing as ConfirmDialog — focus trap,
 * Escape, an inert page behind it and top-layer stacking (so it sits over the
 * sticky page header) with no JS of our own. The difference is geometry: margin
 * pinned right, full viewport height.
 *
 * The shell owns the header and nothing else. `children` gets a `min-h-0
 * flex-1` column to fill, so a form inside can put its own scroll region above
 * its own pinned footer and keep its submit button in the same component as
 * its pending state.
 *
 * Mounted only while open, so the list underneath carries no hidden panel. The
 * slide is CSS (`.drawer-panel` in globals.css); a browser without
 * @starting-style shows it without the animation.
 */
export function Drawer({ title, onClose, children }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function handleEscape(event) {
    // React owns whether this is mounted, so swallow the browser's own close
    // and route Escape through the same callback the X button uses.
    event.preventDefault();
    onClose();
  }

  /**
   * A click on a modal <dialog>'s backdrop lands on the dialog element itself,
   * so "outside" means outside the panel's own box.
   */
  function handleBackdropClick(event) {
    if (event.target !== dialogRef.current) return;

    const box = dialogRef.current.getBoundingClientRect();
    const outside =
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom;

    if (outside) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={handleEscape}
      onClick={handleBackdropClick}
      className="drawer-panel m-0 ml-auto h-dvh max-h-dvh w-[min(34rem,100vw)] max-w-none rounded-none border-l border-border bg-surface p-0 text-foreground"
    >
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-3.5">
          <h2
            id={titleId}
            className="text-base font-semibold text-foreground"
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-2 text-muted transition hover:bg-background hover:text-foreground"
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </button>
        </header>

        {children}
      </div>
    </dialog>
  );
}
