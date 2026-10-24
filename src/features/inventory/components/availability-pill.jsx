/**
 * What a SKU's availability means at a glance.
 *
 * Four states, not two. "Oversold" exists because the ledger deliberately lets
 * availability go negative when a payment lands after its hold expired — that
 * is somebody who has paid for something we do not have, and it must not look
 * the same as an ordinary sold-out row.
 */
import { Badge } from "@/components/ui/badge";

export function AvailabilityPill({
  available,
  threshold,
  allowBackorder,
  hasStockRecord = true,
}) {
  const { label, tone } = describe(
    available,
    threshold,
    allowBackorder,
    hasStockRecord
  );

  return <Badge tone={tone}>{label}</Badge>;
}

function describe(available, threshold, allowBackorder, hasStockRecord) {
  if (available < 0) {
    return { label: "Oversold", tone: "critical" };
  }

  /**
   * Never counted, as opposed to counted and gone. Both read zero and both
   * mean nobody can buy it, but one is an oversight and the other is a sales
   * problem — and they need different actions from whoever is looking.
   */
  if (!hasStockRecord) {
    return { label: "Not stocked", tone: "neutral" };
  }

  if (available === 0) {
    return allowBackorder
      ? { label: "On backorder", tone: "warning" }
      : { label: "Sold out", tone: "critical" };
  }

  if (available <= threshold) {
    return { label: "Low stock", tone: "attention" };
  }

  return { label: "In stock", tone: "success" };
}
