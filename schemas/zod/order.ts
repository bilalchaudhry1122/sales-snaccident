import { z } from "zod";

const orderItemSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  priceAtOrder: z.number().int(),
  quantity: z.number().int().positive(),
  itemDiscount: z.object({
    type: z.enum(["percent", "flat"]),
    value: z.number()
  }).optional().nullable(),
  lineTotal: z.number().int()
});

export const createOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  subtotal: z.number().int(),
  orderDiscount: z.object({
    type: z.enum(["percent", "flat"]),
    value: z.number()
  }).optional().nullable(),
  totalAmount: z.number().int(),
  notes: z.string().optional()
});

export const orderStatusSchema = z.object({
  status: z.enum(["pending", "preparing", "ready", "delivered", "cancelled", "failed"]),
  reason: z.string().optional() // for cancellation or failure
});
