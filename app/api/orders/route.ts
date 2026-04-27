import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { withRole } from "@/lib/withRole";
import { createOrderSchema } from "@/schemas/zod/order";
import { generateOrderNumber } from "@/lib/orderNumber";
import { logAudit } from "@/lib/auditLogger";

export const GET = withRole(["admin", "counter_a", "counter_b"])(async (req: NextRequest) => {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  
  const query: any = {};
  if (status && status !== "all") {
    query.status = status;
  } else if (!status) {
    // Default to active orders
    query.status = { $in: ["pending", "preparing", "ready"] };
  }

  const orders = await Order.find(query).sort({ placedAt: -1 }).lean();
  return NextResponse.json(orders);
});

export const POST = withRole(["admin", "counter_a"])(async (req: NextRequest, session: any) => {
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

  await logAudit({
    action: "ORDER_PLACED",
    performedBy: session.user.id,
    performedByName: session.user.name,
    performedByRole: session.user.role,
    targetType: "order",
    targetId: newOrder._id.toString(),
    after: newOrder.toObject(),
  });

  return NextResponse.json(newOrder, { status: 201 });
});
