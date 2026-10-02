import { z } from "zod";
export const settingsSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(160),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(100),
    opensAt: z.iso.datetime({ offset: true }).nullable(),
    closesAt: z.iso.datetime({ offset: true }).nullable(),
    capacity: z.int().positive().max(100000).nullable(),
    waitlist: z.boolean(),
    duplicatePolicy: z.enum(["reject", "allow"]),
    thankYou: z.string().trim().min(1).max(2000),
    retentionDays: z.int().min(1).max(3650),
  })
  .refine(
    (s) =>
      !s.closesAt ||
      (s.opensAt !== null && new Date(s.closesAt) > new Date(s.opensAt)),
    "Tarih penceresi geçersiz",
  );
export type FormSettings = z.infer<typeof settingsSchema>;
