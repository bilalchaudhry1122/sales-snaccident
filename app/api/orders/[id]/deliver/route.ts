import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import Sale from "@/models/Sale";
import { withRole } from "@/lib/withRole";
import { logAudit } from "@/lib/auditLogger";

export const PATCH = withRole(["admin", "counter_b"])(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  await dbConnect();
  const { id } = params;

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const order = await Order.findById(id).session(mongoSession);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "delivered") {
      throw new Error("Order already delivered");
    }

    const oldStatus = order.status;
    order.status = "delivered";
    order.deliveredBy = session.user.id;
    order.deliveredAt = new Date();
    await order.save({ session: mongoSession });

    // Calculate discount amount for sales record
    const discountAmount = order.subtotal - order.totalAmount;

    const saleData = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      items: order.items,
      subtotal: order.subtotal,
      discountAmount,
      totalAmount: order.totalAmount,
      deliveredBy: session.user.id,
      placedBy: order.placedBy,
      deliveredAt: order.deliveredAt,
    };

    await Sale.create([saleData], { session: mongoSession });

    await logAudit({
      action: "ORDER_DELIVERED",
      performedBy: session.user.id,
      performedByName: session.user.name,
      performedByRole: session.user.role,
      targetType: "order",
      targetId: id,
      metadata: { from: oldStatus, to: "delivered" }
    });

    await mongoSession.commitTransaction();
    return NextResponse.json(order);
  } catch (error: any) {
    await mongoSession.abortTransaction();
    return NextResponse.json({ error: error.message }, { status: 400 });
  } finally {
    mongoSession.endSession();
  }
});
