import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import SystemReset from "@/models/SystemReset";
import Order from "@/models/Order";
import Sale from "@/models/Sale";
import AuditLog from "@/models/AuditLog";
import { withRole } from "@/lib/withRole";
import { logAudit } from "@/lib/auditLogger";

export const POST = withRole(["admin"])(async (req: NextRequest, session: any) => {
  await dbConnect();
  const { otp } = await req.json();

  if (!otp) {
    return NextResponse.json({ error: "OTP is required" }, { status: 400 });
  }

  // Find a valid OTP
  const validReset = await SystemReset.findOne({
    userId: session.user.id,
    otp,
    used: false,
    expiresAt: { $gt: new Date() }
  });

  if (!validReset) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
  }

  // Mark OTP as used
  validReset.used = true;
  await validReset.save();

  // Perform the System Reset
  try {
    await Order.deleteMany({});
    await Sale.deleteMany({});
    await AuditLog.deleteMany({});

    // Log the fact that the system was reset (creating a new AuditLog since we just deleted them)
    await logAudit({
      action: "SYSTEM_FACTORY_RESET",
      performedBy: session.user.id,
      performedByName: session.user.name,
      performedByRole: session.user.role,
      targetType: "user",
      targetId: session.user.id,
      metadata: { note: "All transactional data wiped." }
    });

    return NextResponse.json({ message: "System reset successful" }, { status: 200 });
  } catch (error) {
    console.error("System reset failed:", error);
    return NextResponse.json({ error: "System reset failed during database operation" }, { status: 500 });
  }
});
