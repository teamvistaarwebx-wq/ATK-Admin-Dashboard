"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The only client component in the sidebar — it exists purely because the
 * active state needs the current path. Icons arrive as already-rendered
 * elements so `lucide-react` stays in the server bundle.
 */
export function SidebarLink({ href, label, icon }) {
  const pathname = usePathname();

  // Exact match for the dashboard, prefix match for everything else, so
  // /products/new keeps Products lit.
  const isActive =
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition ${
        isActive
          ? "bg-gold font-bold text-brand"
          : "text-white/85 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className="shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span className="font-newsreader text-base font-bold">{label}</span>
    </Link>
  );
}
