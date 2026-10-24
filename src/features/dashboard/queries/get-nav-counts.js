import { cache } from "react";
import { connectDb } from "@/db/connect";
import { Inquiry } from "@/models/inquiry.model";
import { Order } from "@/models/order.model";
import { INQUIRY_STATUS, ORDER_STATUS } from "@/constants/enums";

/**
 * The counts beside "Orders" and "Inquiries" in the sidebar — what is waiting
 * on somebody, the way Shopify shows unfulfilled orders.
 *
 * Paid-but-not-shipped is the to-do list for orders; a brand-new enquiry is
 * the to-do list for sales. Both ride indexed status fields.
 */
export const getNavCounts = cache(async function getNavCounts() {
  await connectDb();

  const [toFulfil, newInquiries] = await Promise.all([
    Order.countDocuments({
      status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.CONFIRMED] },
    }),
    Inquiry.countDocuments({ status: INQUIRY_STATUS.NEW }),
  ]);

  return { toFulfil, newInquiries };
});
