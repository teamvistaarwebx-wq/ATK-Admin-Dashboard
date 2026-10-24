import { Suspense } from "react";
import Image from "next/image";
import {
  Gift,
  House,
  Image as ImageIcon,
  LogOut,
  MessageSquare,
  Package,
  Scissors,
  Settings,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { signOut } from "@/features/auth/actions/sign-out";
import { getNavCounts } from "@/features/dashboard/queries/get-nav-counts";
import { SidebarNav } from "./sidebar-link";

const ICON = "h-4 w-4";

/**
 * Module scope, not rebuilt per render. The icon elements are created once
 * too — they never depend on props.
 *
 * Grouped the way Shopify's admin is: the daily work first, then the
 * storefront's content, then settings pinned to the bottom. `children` only
 * show while their parent section is open, so the list stays short.
 */
const MAIN_NAV = [
  { href: "/", label: "Home", icon: <House className={ICON} strokeWidth={2} /> },
  {
    href: "/orders",
    label: "Orders",
    icon: <ShoppingBag className={ICON} strokeWidth={2} />,
    badgeKey: "toFulfil",
  },
  {
    href: "/products",
    label: "Products",
    icon: <Tag className={ICON} strokeWidth={2} />,
    children: [
      { href: "/products", label: "All products" },
      { href: "/inventory", label: "Inventory" },
      { href: "/products/import", label: "Import" },
    ],
    // Inventory lives under Products, as in Shopify — opening it keeps this
    // section expanded.
    also: ["/inventory"],
  },
  {
    // Its own catalogue, not a filter on Products: these pieces have no stock
    // and are only ever quoted.
    href: "/made-to-order",
    label: "Made to order",
    icon: <Scissors className={ICON} strokeWidth={2} />,
  },
  {
    href: "/inquiries",
    label: "Inquiries",
    icon: <MessageSquare className={ICON} strokeWidth={2} />,
    badgeKey: "newInquiries",
  },
];

const CONTENT_NAV = [
  {
    href: "/banners",
    label: "Banners",
    icon: <ImageIcon className={ICON} strokeWidth={2} />,
  },
  {
    // Packaging and card designs — the box-level add-ons on the cart.
    href: "/gift-options",
    label: "Gift options",
    icon: <Gift className={ICON} strokeWidth={2} />,
  },
];

const SETTINGS_NAV = [
  {
    href: "/settings",
    label: "Settings",
    icon: <Settings className={ICON} strokeWidth={2} />,
  },
];

export function AdminSidebar({ session }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-ink">
      <div className="flex h-14 shrink-0 items-center gap-2 px-4">
        <Image
          src="/images/logo/logo.svg"
          alt="Atulya Karigari"
          width={132}
          height={30}
          priority
          unoptimized
        />
      </div>

      <nav
        aria-label="Admin sections"
        className="scrollbar-subtle flex flex-1 flex-col overflow-y-auto px-2 pb-4"
      >
        {/* The counts are a database read. Behind their own boundary so the
            sidebar paints at once and the numbers drop in after. */}
        <Suspense fallback={<SidebarNav items={MAIN_NAV} counts={null} />}>
          <MainNav />
        </Suspense>

        <p className="mt-5 px-2 pb-1 text-xs font-semibold text-sidebar-muted">
          Storefront content
        </p>
        <SidebarNav items={CONTENT_NAV} counts={null} />

        <div className="mt-auto pt-5">
          <SidebarNav items={SETTINGS_NAV} counts={null} />
        </div>
      </nav>

      <div className="flex shrink-0 items-center gap-2.5 border-t border-white/10 px-3 py-3">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#36fba1] text-xs font-bold text-[#1a1a1a]"
        >
          {initials(session.name || session.email)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">
            {session.name || session.email}
          </p>
          <p className="truncate text-[0.6875rem] capitalize text-sidebar-muted">
            {session.role.replace(/_/g, " ")}
          </p>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="rounded-lg p-1.5 text-sidebar-muted transition hover:bg-sidebar-hover hover:text-white"
          >
            <LogOut className={ICON} strokeWidth={2} aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}

async function MainNav() {
  const counts = await getNavCounts().catch(() => null);
  return <SidebarNav items={MAIN_NAV} counts={counts} />;
}

function initials(name) {
  return (
    String(name ?? "")
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "A"
  );
}
