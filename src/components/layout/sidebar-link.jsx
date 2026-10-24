"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The only client part of the sidebar — it exists purely because the active
 * state needs the current path. Icons arrive as already-rendered elements so
 * `lucide-react` stays in the server bundle.
 */
export function SidebarNav({ items, counts }) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-px">
      {items.map((item) => {
        const open =
          isWithin(pathname, item.href) ||
          (item.also ?? []).some((href) => isWithin(pathname, href));
        const count = item.badgeKey ? counts?.[item.badgeKey] : 0;

        return (
          <li key={item.href}>
            <NavRow
              href={item.href}
              icon={item.icon}
              label={item.label}
              // With children, the child row carries "you are here"; the
              // parent only reads as the open section.
              active={open && !item.children}
              highlighted={open}
              count={count}
            />

            {item.children && open ? (
              <ul className="mb-1 mt-px flex flex-col gap-px">
                {item.children.map((child) => (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      aria-current={activeChild(pathname, item, child) ? "page" : undefined}
                      className={`flex h-7 items-center rounded-lg pl-9 pr-2 text-[0.8125rem] transition ${
                        activeChild(pathname, item, child)
                          ? "bg-sidebar-active font-semibold text-white"
                          : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
                      }`}
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function NavRow({ href, icon, label, active, highlighted, count }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-8 items-center gap-2.5 rounded-lg px-2 text-[0.8125rem] font-semibold transition ${
        active
          ? "bg-sidebar-active text-white"
          : highlighted
            ? "text-white hover:bg-sidebar-hover"
            : "text-sidebar-ink hover:bg-sidebar-hover hover:text-white"
      }`}
    >
      <span className="shrink-0 opacity-90" aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {count > 0 ? (
        <span className="rounded-md bg-white/15 px-1.5 text-[0.6875rem] font-semibold tabular-nums text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

/** Exact match for the home page, prefix match for everything else. */
function isWithin(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * "All products" is lit on /products and its drawers, but not on
 * /products/import, which is a child of its own.
 */
function activeChild(pathname, parent, child) {
  if (child.href === parent.href) {
    const siblings = parent.children.filter((c) => c.href !== parent.href);
    return (
      isWithin(pathname, parent.href) &&
      !siblings.some((c) => isWithin(pathname, c.href))
    );
  }
  return isWithin(pathname, child.href);
}
