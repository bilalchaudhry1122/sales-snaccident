import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import { withRole } from "@/lib/withRole";
import { logAudit } from "@/lib/auditLogger";

export const PATCH = withRole(["admin"])(async (req: NextRequest, session: any, { params }: { params: { id: string } }) => {
  await dbConnect();
  const { id } = params;

  const item = await MenuItem.findById(id);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const oldInStock = item.inStock;
  item.inStock = !item.inStock;
  await item.save();

  await logAudit({
    action: "STOCK_TOGGLED",
    performedBy: session.user.id,
    performedByName: session.user.name,
    performedByRole: session.user.role,
    targetType: "menuItem",
    targetId: id,
    metadata: { before: oldInStock, after: item.inStock }
  });

  return NextResponse.json(item);
});
