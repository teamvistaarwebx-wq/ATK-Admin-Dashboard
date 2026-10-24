"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/**
 * Below `lg` the sidebar has no room, so it becomes a top bar with a menu
 * button that slides the same sidebar in over the page. `children` is the
 * server-rendered sidebar — rendered once, shown in two places.
 */
export function MobileNav({ children }) {
  const pathname = usePathname();
  // The path the menu was opened on. Following a link is the end of the job,
  // so the menu counts as open only while the path is unchanged.
  const [openedOn, setOpenedOn] = useState(null);
  const open = openedOn === pathname;
  const setOpen = (value) => setOpenedOn(value ? pathname : null);

  return (
    <>
      <div className="flex h-12 shrink-0 items-center justify-between bg-sidebar px-3 lg:hidden">
        <Image
          src="/images/logo/logo.svg"
          alt="Atulya Karigari"
          width={110}
          height={25}
          unoptimized
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-1.5 text-white transition hover:bg-sidebar-hover"
        >
          <Menu className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-y-0 left-0 w-64 max-w-[85vw] shadow-xl">
            {children}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-2 top-3 rounded-lg p-1.5 text-white transition hover:bg-sidebar-hover"
            >
              <X className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
