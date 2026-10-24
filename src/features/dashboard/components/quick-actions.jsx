import Link from "next/link";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";

/** Module scope — the same four links on every render. */
const ACTIONS = [
  { href: "/products/new", label: "Add Products" },
  { href: "/banners/new", label: "Add Banner" },
  { href: "/products?stock=sold-out", label: "Review Sold Out" },
  { href: "/inquiries", label: "View Inquiries" },
];

export function QuickActions() {
  return (
    <Card title="Quick actions">
      <div className="grid grid-cols-2 gap-3 px-5 pb-5 pt-4">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-2.5 text-xs font-semibold text-brand transition hover:bg-brand-tint"
          >
            <Plus
              className="h-4 w-4 shrink-0"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span className="truncate">{action.label}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
