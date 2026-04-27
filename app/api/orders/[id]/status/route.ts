import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { withRole } from "@/lib/withRole";
import { logAudit } from "@/lib/auditLogger";

export const PATCH = withRole(["admin", "counter_b"])(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  await dbConnect();
  
  const body = await req.json();
  const { status } = body;
  
  if (!["pending", "preparing", "ready"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await Order.findById(params.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const oldStatus = order.status;
  order.status = status;
  order.editedBy = session.user.id;
  await order.save();

  await logAudit({
    action: "ORDER_STATUS_CHANGED",
    performedBy: session.user.id,
    performedByName: session.user.name,
    performedByRole: session.user.role,
    targetType: "order",
    targetId: order._id.toString(),
    before: { status: oldStatus },
    after: { status: order.status },
  });

  return NextResponse.json({ message: `Order moved to ${status}` });
});
