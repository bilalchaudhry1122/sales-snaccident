import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET() {
  await dbConnect();

  // Check if admin already exists
  const existingAdmin = await User.findOne({ email: "Admin@sales.com" });
  
  if (existingAdmin) {
    return NextResponse.json({ message: "Database is already seeded with users!" });
  }

  // Pre-hash passwords
  const adminHash = await bcrypt.hash("Bilal347@", 10);
  const orderHash = await bcrypt.hash("@sales52", 10);
  const cookingHash = await bcrypt.hash("@Cooking", 10);

  const users = [
    {
      name: "System Admin",
      email: "Admin@sales.com",
      passwordHash: adminHash,
      role: "admin",
      isActive: true,
    },
    {
      name: "Order Counter",
      email: "Order@sales.com",
      passwordHash: orderHash,
      role: "counter_a",
      isActive: true,
    },
    {
      name: "Cooking Counter",
      email: "Cooking@sales.com",
      passwordHash: cookingHash,
      role: "counter_b",
      isActive: true,
    }
  ];

  await User.insertMany(users);

  return NextResponse.json({
    message: "Successfully seeded database!",
    usersCreated: users.map(u => ({ email: u.email, role: u.role }))
  });
}
