import Image from "next/image";
import {
  Gift,
  Image as ImageIcon,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Package,
  Scissors,
  Settings,
  ShoppingBag,
  Warehouse,
} from "lucide-react";
import { signOut } from "@/features/auth/actions/sign-out";
import { SidebarLink } from "./sidebar-link";

/**
 * Module scope, not rebuilt per render. The icon elements are created once
 * too — they never depend on props.
 */
const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    icon: <LayoutGrid className="h-4.5 w-4.5" strokeWidth={2} />,
  },
  {
    href: "/products",
    label: "Products",
    icon: <Package className="h-4.5 w-4.5" strokeWidth={2} />,
  },
  {
    // Its own catalogue, not a filter on Products: these pieces have no stock
    // and are only ever quoted.
    href: "/made-to-order",
    label: "Made to Order",
    icon: <Scissors className="h-4.5 w-4.5" strokeWidth={2} />,
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: <Warehouse className="h-4.5 w-4.5" strokeWidth={2} />,
  },
  {
    href: "/orders",
    label: "Orders",
    icon: <ShoppingBag className="h-4.5 w-4.5" strokeWidth={2} />,
  },
  {
    href: "/banners",
    label: "Banners",
    icon: <ImageIcon className="h-4.5 w-4.5" strokeWidth={2} />,
  },
  {
    // Packaging and card designs — the box-level add-ons on the cart.
    href: "/gift-options",
    label: "Gift Options",
    icon: <Gift className="h-4.5 w-4.5" strokeWidth={2} />,
  },
  {
    href: "/inquiries",
    label: "Inquiries",
    icon: <MessageSquare className="h-4.5 w-4.5" strokeWidth={2} />,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: <Settings className="h-4.5 w-4.5" strokeWidth={2} />,
  },
];

export function AdminSidebar({ session }) {
  return (
    <div className="flex h-full flex-col bg-brand">
      <div className="flex h-24 shrink-0 items-center border-b border-white/15 px-6">
        <Image
          src="/images/logo/logo.svg"
          alt="Atulya Karigari"
          width={150}
          height={51}
          priority
          unoptimized
        />
      </div>

      <nav
        aria-label="Admin sections"
        className="scrollbar-subtle flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-6"
      >
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/15 px-4 py-4">
        <p className="truncate px-1.5 text-sm font-semibold text-white">
          {session.name || session.email}
        </p>
        <p className="truncate px-1.5 text-xs text-white/60">
          {session.role.replace(/_/g, " ")}
        </p>

        <form action={signOut} className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4.5 w-4.5" strokeWidth={2} aria-hidden="true" />
            <span className="font-newsreader text-base font-bold">
              Sign out
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
