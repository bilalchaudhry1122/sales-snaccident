import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { withRole } from "@/lib/withRole";

export const GET = withRole(["admin"])(async (req: NextRequest) => {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(500, parseInt(searchParams.get("limit") || "200", 10));
    const skip = (page - 1) * limit;

    const dateFilter: any = {};
    if (from || to) {
      dateFilter.placedAt = {};
      if (from) dateFilter.placedAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.placedAt.$lte = toDate;
      }
    }

    // Use MongoDB aggregation for summary — no JS-level looping over 1000s of docs
    const [summaryResult, statusBreakdown, orders, total] = await Promise.all([
      Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ["$status", "delivered"] }, "$totalAmount", 0],
              },
            },
            totalDiscounts: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$status", "delivered"] },
                      { $gt: ["$subtotal", "$totalAmount"] },
                    ],
                  },
                  { $subtract: ["$subtotal", "$totalAmount"] },
                  0,
                ],
              },
            },
            totalOrders: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            cancelledOrders: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["cancelled", "failed"]] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $addFields: {
            averageOrderValue: {
              $cond: [
                { $gt: ["$totalOrders", 0] },
                { $round: [{ $divide: ["$totalRevenue", "$totalOrders"] }, 0] },
                0,
              ],
            },
          },
        },
      ]),

      // Status breakdown for chart
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Paginated order list for table/export — only load what's needed
      Order.find(dateFilter)
        .sort({ placedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("placedBy", "name email role")
        .lean(),

      Order.countDocuments(dateFilter),
    ]);

    const summary = summaryResult[0] ?? {
      totalRevenue: 0,
      totalDiscounts: 0,
      totalOrders: 0,
      cancelledOrders: 0,
      averageOrderValue: 0,
    };

    const breakdown = statusBreakdown.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    return NextResponse.json({
      summary: {
        totalRevenue: summary.totalRevenue,
        totalDiscounts: summary.totalDiscounts,
        totalOrders: summary.totalOrders,
        cancelledOrders: summary.cancelledOrders,
        averageOrderValue: summary.averageOrderValue,
      },
      statusBreakdown: breakdown,
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      // Legacy fields for backward compatibility with audit page
      delivered: orders.filter((o: any) => o.status === "delivered"),
      cancelled: orders.filter((o: any) =>
        ["cancelled", "failed"].includes(o.status)
      ),
      allOrders: orders,
    });
  } catch (err: any) {
    console.error("GET /api/audit/report error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate report" },
      { status: 500 }
    );
  }
});
