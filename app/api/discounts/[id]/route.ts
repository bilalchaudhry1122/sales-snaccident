import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Discount from "@/models/Discount";
import MenuItem from "@/models/MenuItem";
import { withRole } from "@/lib/withRole";
import { logAudit } from "@/lib/auditLogger";

// Import cache invalidator from parent route
// Since Next.js module instances are shared per process, mutating the cache here works
// We re-export the invalidation as a module-level side effect
const clearDiscountCache = () => {
  // Dynamic import to break circular reference — the GET route holds the cache
  // We use a simple shared module-level flag instead
  (global as any).__discountCacheInvalidated = Date.now();
};

export const PATCH = withRole(["admin"])(async (req: NextRequest, session: any, context: any) => {
  try {
    await dbConnect();
    void MenuItem;
    const { id } = await Promise.resolve(context.params);
    const body = await req.json();

    const oldDiscount = await Discount.findById(id).lean();
    if (!oldDiscount) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    const updatedDiscount = await Discount.findByIdAndUpdate(id, body, { new: true })
      .populate("menuItemId", "name")
      .lean();

    clearDiscountCache();

    logAudit({
      action: "DISCOUNT_TOGGLED",
      performedBy: session.user.id,
      performedByName: session.user.name,
      performedByRole: session.user.role,
      targetType: "discount",
      targetId: id,
      before: oldDiscount,
      after: updatedDiscount,
    }).catch(console.error);

    return NextResponse.json(updatedDiscount);
  } catch (err: any) {
    console.error("PATCH /api/discounts/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update discount" },
      { status: 500 }
    );
  }
});

export const DELETE = withRole(["admin"])(async (req: NextRequest, session: any, context: any) => {
  try {
    await dbConnect();
    const { id } = await Promise.resolve(context.params);

    const oldDiscount = await Discount.findById(id).lean();
    if (!oldDiscount) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    await Discount.findByIdAndDelete(id);
    clearDiscountCache();

    logAudit({
      action: "DISCOUNT_REMOVED",
      performedBy: session.user.id,
      performedByName: session.user.name,
      performedByRole: session.user.role,
      targetType: "discount",
      targetId: id,
      before: oldDiscount,
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/discounts/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete discount" },
      { status: 500 }
    );
  }
});
