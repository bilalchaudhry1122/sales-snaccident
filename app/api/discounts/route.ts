import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Discount from "@/models/Discount";
import MenuItem from "@/models/MenuItem"; // Must be imported to register the model for populate()
import { withRole } from "@/lib/withRole";
import { discountSchema } from "@/schemas/zod/discount";
import { logAudit } from "@/lib/auditLogger";

// In-process cache: discounts rarely change, no need to hit DB on every order page load
let discountCache: { data: any[]; cachedAt: number } | null = null;
const CACHE_TTL_MS = 30_000; // 30 seconds

function invalidateDiscountCache() {
  discountCache = null;
}

export const GET = withRole(["admin", "counter_a"])(async () => {
  try {
    // Serve from cache if fresh and not externally invalidated
    const globalInvalidated: number = (global as any).__discountCacheInvalidated ?? 0;
    const cacheValid =
      discountCache &&
      Date.now() - discountCache.cachedAt < CACHE_TTL_MS &&
      discountCache.cachedAt > globalInvalidated;

    if (cacheValid) {
      return NextResponse.json(discountCache!.data);
    }

    await dbConnect();
    void MenuItem; // Ensure MenuItem model is registered before populate()

    const discounts = await Discount.find({})
      .sort({ createdAt: -1 })
      .populate("menuItemId", "name")
      .lean();

    discountCache = { data: discounts, cachedAt: Date.now() };
    return NextResponse.json(discounts);
  } catch (err: any) {
    console.error("GET /api/discounts error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch discounts" },
      { status: 500 }
    );
  }
});

export const POST = withRole(["admin"])(async (req: NextRequest, session: any) => {
  try {
    await dbConnect();
    const body = await req.json();

    const validation = discountSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const newDiscount = await Discount.create(validation.data);
    invalidateDiscountCache();

    // Fire-and-forget audit log
    logAudit({
      action: "DISCOUNT_APPLIED",
      performedBy: session.user.id,
      performedByName: session.user.name,
      performedByRole: session.user.role,
      targetType: "discount",
      targetId: newDiscount._id.toString(),
      after: newDiscount.toObject(),
    }).catch(console.error);

    // Return the populated version for immediate display
    const populated = await Discount.findById(newDiscount._id)
      .populate("menuItemId", "name")
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/discounts error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create discount" },
      { status: 500 }
    );
  }
});
