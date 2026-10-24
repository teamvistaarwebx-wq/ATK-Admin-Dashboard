import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { InquiryStatusPill } from "./inquiry-status-pill";
import { formatCompactPrice, formatDateTime } from "@/lib/format";
import { INQUIRY_SOURCE, INQUIRY_SOURCE_LABEL } from "@/constants/enums";

/**
 * The enquiry table, split out of the page so it can stream.
 *
 * Takes the promise rather than the rows. The page starts the query and hands
 * the same promise to this and to the header's count, so the two render off
 * one read instead of two.
 */
export async function InquiriesSection({
  inquiriesPromise,
  q,
  status,
  source,
}) {
  const { items, page, totalPages } = await inquiriesPromise;

  const isFiltered = Boolean(q || status || source);

  if (items.length === 0) {
    return (
      <div className="border-t border-border">
        <EmptyState
          bare
          title={isFiltered ? "No matching enquiries" : "No enquiries yet"}
          description={
            isFiltered
              ? "Try a different search or clear the filters."
              : "Enquiries sent from the storefront's Request a Quote buttons — the gift box and made-to-order products — land here."
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-left text-[0.8125rem]">
          <thead className="whitespace-nowrap border-y border-border bg-surface-subdued text-xs text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Enquiry</th>
              <th className="px-4 py-2 font-medium">Company</th>
              <th className="px-4 py-2 font-medium">Contact</th>
              <th className="px-4 py-2 font-medium">People / units</th>
              <th className="px-4 py-2 font-medium">Est. value</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((inquiry) => (
              <tr
                key={inquiry.id}
                className="transition hover:bg-surface-subdued"
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/inquiries/${inquiry.id}`}
                    className="font-semibold text-foreground hover:underline"
                  >
                    {/* Enquiries typed up by sales carry no reference. */}
                    {inquiry.inquiryNumber ?? "View"}
                  </Link>
                  {inquiry.source === INQUIRY_SOURCE.MADE_TO_ORDER ? (
                    <Badge tone="info" className="mt-1">
                      {INQUIRY_SOURCE_LABEL[inquiry.source]}
                    </Badge>
                  ) : null}
                  {inquiry.occasion ? (
                    <span className="block text-xs text-muted">
                      {inquiry.occasion}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2 text-foreground">
                  {/* Made-to-order requests can come from individuals. */}
                  {inquiry.companyName || "—"}
                </td>
                <td className="px-4 py-2">
                  <span className="block text-foreground">
                    {inquiry.contactName}
                  </span>
                  <span className="block text-xs text-muted">
                    {inquiry.phone || inquiry.email || "—"}
                  </span>
                </td>
                <td className="px-4 py-2 text-foreground">
                  {inquiry.source === INQUIRY_SOURCE.MADE_TO_ORDER
                    ? `${inquiry.units} units`
                    : inquiry.headcount || "—"}
                </td>
                <td className="px-4 py-2 font-medium text-foreground">
                  {inquiry.budget ? formatCompactPrice(inquiry.budget) : "—"}
                </td>
                <td className="px-4 py-2">
                  <InquiryStatusPill status={inquiry.status} />
                </td>
                <td className="px-4 py-2 text-muted">
                  {formatDateTime(inquiry.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <p className="border-t border-border px-4 py-3 text-xs text-muted">
          Page {page} of {totalPages}
        </p>
      ) : null}
    </>
  );
}

/**
 * The count beside the heading. Its own component, off the same promise, so
 * the heading itself is not held back waiting for a number.
 */
export async function InquiriesCount({ inquiriesPromise }) {
  const { total } = await inquiriesPromise;

  return (
    <p className="text-sm text-muted">
      {total} {total === 1 ? "enquiry" : "enquiries"}
    </p>
  );
}
