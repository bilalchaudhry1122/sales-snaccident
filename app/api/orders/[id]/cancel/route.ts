import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { withRole } from "@/lib/withRole";
import { logAudit } from "@/lib/auditLogger";

export const PATCH = withRole(["admin", "counter_a"])(async (req: NextRequest, session: any, context: any) => {
  try {
    await dbConnect();
    const { id } = await Promise.resolve(context.params);
    const { reason } = await req.json();

    if (!reason) {
      return NextResponse.json({ error: "Cancellation reason is required" }, { status: 400 });
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (["delivered", "cancelled", "failed"].includes(order.status)) {
      return NextResponse.json({ error: "Order cannot be cancelled from current state" }, { status: 400 });
    }

    const oldStatus = order.status;
    order.status = "cancelled";
    order.cancelledBy = session.user.id;
    order.cancellationReason = reason;
    await order.save();

    await logAudit({
      action: "ORDER_CANCELLED",
      performedBy: session.user.id,
      performedByName: session.user.name,
      performedByRole: session.user.role,
      targetType: "order",
      targetId: id,
      metadata: { reason, from: oldStatus, to: "cancelled" }
    });

    return NextResponse.json(order);
  } catch (err: any) {
    console.error("PATCH /api/orders/[id]/cancel error:", err);
    return NextResponse.json({ error: err.message || "Failed to cancel order" }, { status: 500 });
  }
});
