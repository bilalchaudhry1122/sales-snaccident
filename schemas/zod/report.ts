import { z } from "zod";

export const reportQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  format: z.enum(["json", "pdf", "csv"]).default("json"),
  section: z.string().optional()
});
