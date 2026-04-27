import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { withRole } from "@/lib/withRole";

export const dynamic = "force-dynamic";

export const GET = withRole(["admin"])(async (req: NextRequest) => {
  await dbConnect();
  
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  
  const query: any = {};
  
  if (from || to) {
    query.placedAt = {};
    if (from) query.placedAt.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.placedAt.$lte = toDate;
    }
  }

  const orders = await Order.find(query).sort({ placedAt: 1 }).populate('placedBy', 'name email role').lean();
  
  // Calculate summary
  let totalRevenue = 0;
  let totalDiscounts = 0;
  const delivered = [] as any[];
  const cancelled = [] as any[];
  
  orders.forEach((order: any) => {
    if (order.status === 'delivered') {
      delivered.push(order);
      totalRevenue += order.totalAmount;
      if (order.orderDiscount && order.orderDiscount.value) {
        totalDiscounts += (order.subtotal - order.totalAmount);
      }
    } else if (order.status === 'cancelled' || order.status === 'failed') {
      cancelled.push(order);
    }
  });

  return NextResponse.json({
    summary: {
      totalRevenue,
      totalDiscounts,
      totalOrders: delivered.length,
      cancelledOrders: cancelled.length,
      averageOrderValue: delivered.length ? Math.round(totalRevenue / delivered.length) : 0
    },
    delivered,
    cancelled,
    allOrders: orders
  });
});
