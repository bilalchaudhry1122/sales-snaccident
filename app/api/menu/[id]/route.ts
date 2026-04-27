import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import { withRole } from "@/lib/withRole";
import { updateMenuItemSchema } from "@/schemas/zod/menu";
import { logAudit } from "@/lib/auditLogger";

export const PATCH = withRole(["admin"])(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  await dbConnect();
  const body = await req.json();
  const { id } = params;

  const validation = updateMenuItemSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.format() }, { status: 400 });
  }

  const oldItem = await MenuItem.findById(id).lean();
  if (!oldItem) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const updatedItem = await MenuItem.findByIdAndUpdate(id, validation.data, { new: true });

  await logAudit({
    action: "MENU_ITEM_EDITED",
    performedBy: session.user.id,
    performedByName: session.user.name,
    performedByRole: session.user.role,
    targetType: "menuItem",
    targetId: id,
    before: oldItem,
    after: updatedItem.toObject(),
  });

  return NextResponse.json(updatedItem);
});

export const DELETE = withRole(["admin"])(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  await dbConnect();
  const { id } = params;

  const oldItem = await MenuItem.findById(id).lean();
  if (!oldItem) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const deletedItem = await MenuItem.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

  await logAudit({
    action: "MENU_ITEM_DELETED",
    performedBy: session.user.id,
    performedByName: session.user.name,
    performedByRole: session.user.role,
    targetType: "menuItem",
    targetId: id,
    before: oldItem,
    after: deletedItem.toObject(),
  });

  return NextResponse.json({ success: true });
});
