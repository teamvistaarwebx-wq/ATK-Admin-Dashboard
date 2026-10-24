import { notFound } from "next/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getOrder } from "@/features/orders/queries/get-orders";
import { OrderStatusControls } from "@/features/orders/components/order-status-controls";
import { ORDER_TRANSITIONS } from "@/constants/inventory";
import {
  formatDateTime,
  formatPrice,
  formatRelativeDateTime,
} from "@/lib/format";
import { resolveImageUrl } from "@/lib/storefront";
import { orderStatusView } from "@/features/orders/lib/order-status";
import { CardLogoPreview } from "@/features/gifting/components/card-logo-preview";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `${id} | AKT Gifting Admin` };
}

/** Everything staff need to pack and dispatch one gift box. */
export default async function OrderDetailPage({ params }) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) notFound();

  const view = orderStatusView(order.status);

  return (
    <>
      <PageHeader
        width="narrow"
        backHref="/orders"
        title={
          <span className="flex flex-wrap items-center gap-2">
            {order.orderNumber}
            <StatusBadge badge={view.payment} />
            <StatusBadge badge={view.fulfillment} />
            <StatusBadge badge={view.delivery} />
          </span>
        }
        subtitle={`${formatRelativeDateTime(order.createdAt)} · ${
          order.companyName
            ? `Corporate · ${order.companyName}`
            : "Online store"
        }`}
      >
        <OrderStatusControls
          orderId={order.id}
          allowed={ORDER_TRANSITIONS[order.status] ?? []}
        />
      </PageHeader>

      <PageBody width="narrow">
        {/* Set when a payment landed after its stock hold had expired, so the
            item may already have gone to somebody else. Loud on purpose: this
            is a customer who has paid and needs a phone call. */}
        {order.needsReview ? (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-badge-critical px-4 py-3"
          >
            <p className="text-[0.8125rem] font-semibold text-badge-critical-ink">
              This order needs attention
            </p>
            <p className="mt-0.5 text-[0.8125rem] text-badge-critical-ink/90">
              {order.reviewNote ||
                "Something about this order could not be settled automatically."}
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-4">
            <Card
              title={
                <span className="flex items-center gap-2">
                  <StatusBadge badge={view.fulfillment ?? view.payment} />
                  <span>
                    {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                  </span>
                </span>
              }
            >
              <ul className="mt-3 divide-y divide-border border-t border-border">
                {order.items.map((item) => (
                  <li
                    key={`${item.productId}-${item.sku}`}
                    className="flex items-center gap-3 px-4 py-3 text-[0.8125rem]"
                  >
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-subdued">
                      {resolveImageUrl(item.image?.url) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveImageUrl(item.image.url)}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-link">
                        {item.title}
                      </span>
                      {item.sku ? (
                        <span className="block text-xs text-muted">
                          SKU: {item.sku}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {formatPrice(item.price)} × {item.quantity}
                    </span>
                    <span className="w-24 shrink-0 text-right tabular-nums text-foreground">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card
              title={
                <span className="flex items-center gap-2">
                  <StatusBadge badge={view.payment} />
                </span>
              }
            >
              <div className="px-4 pb-4 pt-3">
                <div className="rounded-lg border border-border">
                  <Row
                    label="Subtotal"
                    detail={`${order.itemCount} ${order.itemCount === 1 ? "item" : "items"}`}
                    value={formatPrice(order.amounts.subtotal)}
                  />
                  <Row
                    label="Packaging"
                    detail={order.packaging?.name || ""}
                    value={formatPrice(order.amounts.packaging)}
                  />
                  <Row
                    label="Card"
                    detail={order.card?.name || ""}
                    value={formatPrice(order.amounts.card)}
                  />
                  <Row
                    label="Shipping"
                    value={formatPrice(order.amounts.shipping)}
                  />
                  <div className="flex justify-between gap-3 border-t border-border px-3 py-2 text-[0.8125rem] font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">
                      {formatPrice(order.amounts.total)}
                    </span>
                  </div>
                </div>
                {order.payment.razorpayPaymentId ? (
                  <p className="mt-2 text-xs text-muted">
                    Razorpay payment {order.payment.razorpayPaymentId}
                    {order.payment.paidAt
                      ? ` · paid ${formatDateTime(order.payment.paidAt)}`
                      : ""}
                  </p>
                ) : null}
                {order.payment.failureReason ? (
                  <p className="mt-2 text-xs text-danger">
                    {order.payment.failureReason}
                  </p>
                ) : null}
              </div>
            </Card>

            <Card title="Packaging & card">
              <div className="flex flex-col gap-1 px-4 pb-4 pt-2">
                <Line label="Packaging" value={order.packaging?.name || "—"} />
                <Line label="Card" value={order.card?.name || "—"} />
                {order.cardMessage ? (
                  <div className="pt-2">
                    <p className="text-xs text-muted">Message to print</p>
                    <p className="mt-1 rounded-lg bg-surface-subdued px-3 py-2 text-[0.8125rem] italic">
                      “{order.cardMessage}”
                    </p>
                  </div>
                ) : null}
                <CardLogoPreview logo={order.cardLogo} />
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card title="Customer">
              <div className="flex flex-col gap-0.5 px-4 pb-4 pt-2 text-[0.8125rem]">
                <p className="font-medium text-link">
                  {order.contact.fullName}
                </p>
                {order.companyName ? (
                  <p className="text-muted">{order.companyName}</p>
                ) : null}
              </div>
              <Section title="Contact information">
                <p className="break-all text-link">{order.contact.email}</p>
                <p>{order.contact.phone}</p>
                {order.verifiedPhone ? (
                  <p className="text-xs text-muted">
                    OTP verified · {order.verifiedPhone}
                  </p>
                ) : null}
              </Section>
              <Section title="Shipping address">
                <p>{order.contact.fullName}</p>
                <p>{order.address.line1}</p>
                <p>
                  {order.address.city}, {order.address.state}{" "}
                  {order.address.pincode}
                </p>
                <p>India</p>
              </Section>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div className="border-t border-border px-4 py-3 text-[0.8125rem] text-foreground">
      <p className="mb-1 text-xs font-semibold text-foreground">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, detail, value }) {
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)_auto] gap-3 px-3 py-1.5 text-[0.8125rem]">
      <span className="text-foreground">{label}</span>
      <span className="truncate text-muted">{detail}</span>
      <span className="text-right tabular-nums">{value}</span>
    </div>
  );
}

function Line({ label, value }) {
  return (
    <div className="flex justify-between gap-3 py-0.5 text-[0.8125rem]">
      <span className="text-muted">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function StatusBadge({ badge }) {
  if (!badge) return null;
  return (
    <Badge tone={badge.tone} progress={badge.progress}>
      {badge.label}
    </Badge>
  );
}
