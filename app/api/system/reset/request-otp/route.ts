import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import SystemReset from "@/models/SystemReset";
import { withRole } from "@/lib/withRole";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

export const POST = withRole(["admin"])(async (req: NextRequest, session: any) => {
  await dbConnect();
  const { password } = await req.json();

  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  // Find admin user
  const admin = await User.findById(session.user.id);
  if (!admin) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify password
  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Expire in 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await SystemReset.create({
    userId: admin._id,
    otp,
    expiresAt
  });

  // Send email via nodemailer
  let emailSent = false;
  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Snaccident Security" <${process.env.SMTP_USER}>`,
        to: "cowboybutter9@gmail.com",
        subject: "SECURITY ALERT: System Reset OTP",
        text: `You have requested to RESET THE ENTIRE SYSTEM. \n\nYour 2FA OTP code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, please change your password immediately.`,
      });
      emailSent = true;
    } else {
      console.log("\n==============================================");
      console.log("       SNACCIDENT SYSTEM RESET OTP            ");
      console.log(`       CODE: ${otp}                           `);
      console.log("==============================================\n");
    }
  } catch (err: any) {
    console.error("Failed to send OTP email:", err);
    console.log("\n==============================================");
    console.log("       [FALLBACK] SNACCIDENT RESET OTP        ");
    console.log(`       CODE: ${otp}                           `);
    console.log("==============================================\n");
    return NextResponse.json({ 
      error: "Failed to send email. Please check your App Password.",
      details: err.message,
      emailSent: false
    }, { status: 500 });
  }

  return NextResponse.json({ 
    message: "OTP sent successfully",
    emailSent
  }, { status: 200 });
});
