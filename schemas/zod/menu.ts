import { z } from "zod";

export const menuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().int().positive("Price must be a positive integer in cents"),
  description: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal("")),
  inStock: z.boolean().default(true),
  discount: z.object({
    type: z.enum(["percent", "flat"]),
    value: z.number().nonnegative()
  }).optional().nullable()
});

export const updateMenuItemSchema = menuItemSchema.partial();
