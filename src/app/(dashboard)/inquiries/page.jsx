import { Suspense } from "react";
import { MessageSquare } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import {
  InquiriesCount,
  InquiriesSection,
} from "@/features/inquiries/components/inquiries-section";
import { getInquiries } from "@/features/inquiries/queries/get-inquiries";
import {
  INQUIRY_SOURCE_LABEL,
  INQUIRY_SOURCE_VALUES,
  INQUIRY_STATUS_VALUES,
} from "@/constants/enums";
import { requireAdmin } from "@/lib/auth/dal";
import { capitalize } from "@/lib/format";
import { Select } from "@/components/ui/select";

export const metadata = { title: "Inquiries | AKT Gifting Admin" };

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  ...INQUIRY_STATUS_VALUES.map((value) => ({
    value,
    label: capitalize(value),
  })),
];

const SOURCE_OPTIONS = [
  { value: "", label: "All" },
  ...INQUIRY_SOURCE_VALUES.map((value) => ({
    value,
    label: INQUIRY_SOURCE_LABEL[value] ?? value,
  })),
];

function FilterSelect({ id, name, label, options, defaultValue }) {
  return (
    <div className="flex flex-col gap-1 text-xs text-muted">
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <div className="w-44">
        <Select
          id={id}
          name={name}
          options={options}
          defaultValue={defaultValue}
          aria-labelledby={`${id}-label`}
          size="sm"
        />
      </div>
    </div>
  );
}

/**
 * Corporate enquiry list.
 *
 * Calls the query directly rather than its own HTTP API — it runs inside the
 * app that owns the model, so a network round trip would buy nothing. Same
 * reasoning as the Orders list.
 *
 * The query is started here but awaited nowhere: the heading and the filter
 * form need nothing from the database, so they render straight away while the
 * table and the header's count stream in off the one shared promise.
 */
export default async function InquiriesPage({ searchParams }) {
  await requireAdmin();

  const params = await searchParams;
  const status = params?.status ?? "";
  const source = params?.source ?? "";
  const q = params?.q ?? "";

  const inquiriesPromise = getInquiries({
    status,
    source,
    q,
    page: params?.page,
  });

  return (
    <>
      <PageHeader
        title="Inquiries"
        icon={<MessageSquare className="h-5 w-5" strokeWidth={2} />}
        subtitle="Gift-box and made-to-order enquiries, and where each one stands."
      >
        <Suspense fallback={<Skeleton className="h-4 w-24" />}>
          <InquiriesCount inquiriesPromise={inquiriesPromise} />
        </Suspense>
      </PageHeader>

      <div className="mx-auto w-full max-w-[1400px] px-4 pb-10 sm:px-6">
        <section className="overflow-hidden rounded-xl bg-surface shadow-card">
          <form
            className="flex flex-wrap items-end gap-3 px-3 py-3"
            action="/inquiries"
          >
            <label className="flex flex-col gap-1 text-xs text-muted">
              Search
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Reference, company, contact, phone or email"
                className="h-8 w-80 max-w-full rounded-lg border border-border-strong bg-surface px-3 text-[0.8125rem] text-foreground outline-none transition placeholder:text-subtle focus:border-foreground/50 focus:ring-2 focus:ring-black/5"
              />
            </label>

            {/* Labelled by id, not wrapped: see components/ui/select.jsx. */}
            <FilterSelect
              id="inquiries-status"
              name="status"
              label="Status"
              options={STATUS_OPTIONS}
              defaultValue={status}
            />

            <FilterSelect
              id="inquiries-source"
              name="source"
              label="Type"
              options={SOURCE_OPTIONS}
              defaultValue={source}
            />

            <button type="submit" className={buttonClass("secondary")}>
              Filter
            </button>
          </form>

          <Suspense fallback={<TableSkeleton rows={8} columns={6} />}>
            <InquiriesSection
              inquiriesPromise={inquiriesPromise}
              q={q}
              status={status}
              source={source}
            />
          </Suspense>
        </section>
      </div>
    </>
  );
}
