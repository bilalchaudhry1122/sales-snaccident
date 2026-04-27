import { z } from "zod";

export const discountSchema = z.object({
  scope: z.enum(["global", "item"]),
  menuItemId: z.string().optional().nullable(),
  type: z.enum(["percent", "flat"]),
  value: z.number().nonnegative(),
  label: z.string().min(1, "Label is required"),
  isActive: z.boolean().default(true)
}).refine(data => {
  if (data.scope === 'item' && !data.menuItemId) return false;
  if (data.type === 'percent' && data.value > 100) return false;
  return true;
}, {
  message: "Invalid discount configuration"
});
