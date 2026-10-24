import { getOrdersForExport } from "@/features/orders/queries/get-orders";
import { orderStatusView } from "@/features/orders/lib/order-status";
import { getSession } from "@/lib/auth/session";
import { toCsv } from "@/lib/csv";
import { resolveDateRange, todayKey } from "@/lib/date-range";
import { serverError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const IST_DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const rupees = (paise) => (Number(paise ?? 0) / 100).toFixed(2);

/** One column per thing a packer, an accountant or a courier would sort by. */
const COLUMNS = [
  { header: "Order", value: (o) => o.orderNumber },
  { header: "Date (IST)", value: (o) => IST_DATE_TIME.format(new Date(o.createdAt)) },
  { header: "Status", value: (o) => o.status.replace(/_/g, " ") },
  { header: "Payment", value: (o) => orderStatusView(o.status).payment?.label ?? "" },
  { header: "Fulfillment", value: (o) => orderStatusView(o.status).fulfillment?.label ?? "" },
  { header: "Customer", value: (o) => o.contact?.fullName },
  { header: "Email", value: (o) => o.contact?.email },
  { header: "Phone", value: (o) => o.contact?.phone },
  { header: "Company", value: (o) => o.companyName },
  { header: "Items", value: (o) => o.itemCount },
  {
    header: "Line items",
    value: (o) =>
      (o.items ?? [])
        .map((item) => `${item.title}${item.sku ? ` [${item.sku}]` : ""} x ${item.quantity}`)
        .join("; "),
  },
  { header: "Subtotal (INR)", value: (o) => rupees(o.amounts?.subtotal) },
  { header: "Packaging (INR)", value: (o) => rupees(o.amounts?.packaging) },
  { header: "Card (INR)", value: (o) => rupees(o.amounts?.card) },
  { header: "Shipping (INR)", value: (o) => rupees(o.amounts?.shipping) },
  { header: "Total (INR)", value: (o) => rupees(o.total) },
  { header: "Address", value: (o) => o.address?.line1 },
  { header: "City", value: (o) => o.address?.city },
  { header: "State", value: (o) => o.address?.state },
  { header: "Pincode", value: (o) => o.address?.pincode },
  { header: "Card message", value: (o) => o.cardMessage },
  { header: "Razorpay payment", value: (o) => o.payment?.razorpayPaymentId ?? "" },
];

/**
 * GET /api/orders/export — the orders list as a CSV, with exactly the
 * filters on screen: the same range, tab and search the table is showing.
 *
 * A route handler rather than a server action because the response is a
 * file download. Session-checked: getSession answers a signed-out caller
 * with a 401, where requireAdmin would redirect a download to HTML.
 */
export async function GET(request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not signed in" }, { status: 401 });

  try {
    const params = request.nextUrl.searchParams;
    const range = resolveDateRange(
      {
        range: params.get("range") ?? undefined,
        from: params.get("from") ?? undefined,
        to: params.get("to") ?? undefined,
      },
      { fallback: "all", allowAllTime: true }
    );

    const orders = await getOrdersForExport({
      view: params.get("view") ?? params.get("status") ?? "",
      q: params.get("q") ?? "",
      range,
    });

    const span = range.from ? `${range.from}_to_${range.to}` : `all_to_${todayKey()}`;

    return new Response(toCsv(orders, COLUMNS), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders_${span}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/orders/export failed:", error);
    return serverError("Could not export orders");
  }
}
