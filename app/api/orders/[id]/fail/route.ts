import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { withRole } from "@/lib/withRole";
import { logAudit } from "@/lib/auditLogger";

export const PATCH = withRole(["admin"])(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  await dbConnect();
  const { id } = params;
  const { reason } = await req.json();

  if (!reason) {
    return NextResponse.json({ error: "Failure reason is required" }, { status: 400 });
  }

  const order = await Order.findById(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status === "delivered") {
    return NextResponse.json({ error: "Cannot mark delivered order as failed" }, { status: 400 });
  }

  const oldStatus = order.status;
  order.status = "failed";
  order.failureReason = reason;
  await order.save();

  await logAudit({
    action: "ORDER_FAILED",
    performedBy: session.user.id,
    performedByName: session.user.name,
    performedByRole: session.user.role,
    targetType: "order",
    targetId: id,
    metadata: { reason, from: oldStatus, to: "failed" }
  });

  return NextResponse.json(order);
});
