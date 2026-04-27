import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Discount from "@/models/Discount";
import { withRole } from "@/lib/withRole";
import { discountSchema } from "@/schemas/zod/discount";
import { logAudit } from "@/lib/auditLogger";

export const GET = withRole(["admin", "counter_a"])(async () => {
  await dbConnect();
  const discounts = await Discount.find({}).sort({ createdAt: -1 }).populate('menuItemId', 'name').lean();
  return NextResponse.json(discounts);
});

export const POST = withRole(["admin"])(async (req: NextRequest, session: any) => {
  await dbConnect();
  const body = await req.json();

  const validation = discountSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.format() }, { status: 400 });
  }

  const newDiscount = await Discount.create(validation.data);

  await logAudit({
    action: "DISCOUNT_APPLIED",
    performedBy: session.user.id,
    performedByName: session.user.name,
    performedByRole: session.user.role,
    targetType: "discount",
    targetId: newDiscount._id.toString(),
    after: newDiscount.toObject(),
  });

  return NextResponse.json(newDiscount, { status: 201 });
});
