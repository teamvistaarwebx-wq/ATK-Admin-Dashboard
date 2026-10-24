import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatCompactPrice } from "@/lib/format";
import { getOpenInquiries } from "../queries/get-open-inquiries";

export async function GiftingRequests() {
  const { items, pipeline } = await getOpenInquiries();

  return (
    <Card
      title="Open inquiries"
      subtitle={`${formatCompactPrice(pipeline)} in open pipeline`}
      action={
        <Link
          href="/inquiries"
          className="text-xs font-semibold text-link hover:underline"
        >
          View all
        </Link>
      }
    >
      {items.length === 0 ? (
        <p className="px-4 pb-5 pt-3 text-sm text-muted">
          No open enquiries.
        </p>
      ) : (
        <ul className="flex flex-col gap-3.5 px-4 pb-4 pt-4">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-[0.8125rem] font-semibold text-foreground">
                  {item.contactName}
                </p>
                <p className="truncate text-xs text-muted">
                  {item.madeToOrder
                    ? [item.companyName, `Made to order · ${item.units} units`]
                        .filter(Boolean)
                        .join(" · ")
                    : `${item.companyName}${
                        item.headcount > 0 ? ` · ${item.headcount} people` : ""
                      }`}
                </p>
              </div>

              <p className="shrink-0 text-[0.8125rem] font-semibold tabular-nums text-foreground">
                {formatCompactPrice(item.budget)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
