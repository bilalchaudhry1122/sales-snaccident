import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { withRole } from "@/lib/withRole";
import { createOrderSchema } from "@/schemas/zod/order";
import { generateOrderNumber } from "@/lib/orderNumber";
import { logAudit } from "@/lib/auditLogger";

const MAX_PAGE_SIZE = 200; // hard cap per request

export const GET = withRole(["admin", "counter_a", "counter_b"])(async (req: NextRequest) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(MAX_PAGE_SIZE, parseInt(searchParams.get("limit") || "100", 10));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    } else if (!status) {
      // Default: active orders only — keeps the payload tiny for counter screens
      query.status = { $in: ["pending", "preparing", "ready"] };
    }
    // "all" = no status filter, but still paginated

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ placedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch orders" }, { status: 500 });
  }
});

export const POST = withRole(["admin", "counter_a"])(async (req: NextRequest, session: any) => {
  try {
    await dbConnect();
    const body = await req.json();

    const validation = createOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const orderNumber = await generateOrderNumber();

    const orderData = {
      ...validation.data,
      orderNumber,
      placedBy: session.user.id,
      status: "pending",
    };

    const newOrder = await Order.create(orderData);

    // Audit log is fire-and-forget — don't block the response
    logAudit({
      action: "ORDER_PLACED",
      performedBy: session.user.id,
      performedByName: session.user.name,
      performedByRole: session.user.role,
      targetType: "order",
      targetId: newOrder._id.toString(),
      after: newOrder.toObject(),
    }).catch(console.error);

    return NextResponse.json(newOrder, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json({ error: err.message || "Failed to place order" }, { status: 500 });
  }
});
