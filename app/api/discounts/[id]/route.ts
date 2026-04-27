import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Discount from "@/models/Discount";
import { withRole } from "@/lib/withRole";
import { logAudit } from "@/lib/auditLogger";

export const PATCH = withRole(["admin"])(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  await dbConnect();
  const { id } = params;
  const body = await req.json();

  const oldDiscount = await Discount.findById(id).lean();
  if (!oldDiscount) {
    return NextResponse.json({ error: "Discount not found" }, { status: 404 });
  }

  const updatedDiscount = await Discount.findByIdAndUpdate(id, body, { new: true });

  await logAudit({
    action: "DISCOUNT_TOGGLED",
    performedBy: session.user.id,
    performedByName: session.user.name,
    performedByRole: session.user.role,
    targetType: "discount",
    targetId: id,
    before: oldDiscount,
    after: updatedDiscount.toObject(),
  });

  return NextResponse.json(updatedDiscount);
});

export const DELETE = withRole(["admin"])(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  await dbConnect();
  const { id } = params;

  const oldDiscount = await Discount.findById(id).lean();
  if (!oldDiscount) {
    return NextResponse.json({ error: "Discount not found" }, { status: 404 });
  }

  await Discount.findByIdAndDelete(id);

  await logAudit({
    action: "DISCOUNT_REMOVED",
    performedBy: session.user.id,
    performedByName: session.user.name,
    performedByRole: session.user.role,
    targetType: "discount",
    targetId: id,
    before: oldDiscount,
  });

  return NextResponse.json({ success: true });
});
