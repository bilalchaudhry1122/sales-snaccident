import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Sale from "@/models/Sale";
import Order from "@/models/Order";
import { withRole } from "@/lib/withRole";

export const GET = withRole(["admin"])(async (req: NextRequest) => {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter: any = {};
  if (from && to) {
    dateFilter.deliveredAt = { $gte: new Date(from), $lte: new Date(to) };
  }

  const salesSummary = await Sale.aggregate([
    { $match: dateFilter },
    { $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalDiscount: { $sum: '$discountAmount' },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: '$totalAmount' }
    }}
  ]);

  const statusBreakdown = await Order.aggregate([
    { $match: from && to ? { createdAt: { $gte: new Date(from), $lte: new Date(to) } } : {} },
    { $group: {
        _id: '$status',
        count: { $sum: 1 }
    }}
  ]);

  return NextResponse.json({
    summary: salesSummary[0] || { totalRevenue: 0, totalDiscount: 0, totalOrders: 0, avgOrderValue: 0 },
    statusBreakdown: statusBreakdown.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {})
  });
});
