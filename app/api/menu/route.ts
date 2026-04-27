import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import { withRole } from "@/lib/withRole";
import { menuItemSchema } from "@/schemas/zod/menu";
import { logAudit } from "@/lib/auditLogger";

export const GET = async (req: NextRequest) => {
  await dbConnect();
  const items = await MenuItem.find({ isDeleted: false }).lean();
  return NextResponse.json(items);
};

export const POST = withRole(["admin"])(async (req: NextRequest, session: any) => {
  await dbConnect();
  const body = await req.json();
  
  const validation = menuItemSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.format() }, { status: 400 });
  }

  const newItem = await MenuItem.create(validation.data);

  await logAudit({
    action: "MENU_ITEM_ADDED",
    performedBy: session.user.id,
    performedByName: session.user.name,
    performedByRole: session.user.role,
    targetType: "menuItem",
    targetId: newItem._id.toString(),
    after: newItem.toObject(),
  });

  return NextResponse.json(newItem, { status: 201 });
});
