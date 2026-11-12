import { z } from "zod";

export const SOZLUK_RANKS = ["caylak", "yazar", "moderator", "admin"] as const;
export type SozlukRank = (typeof SOZLUK_RANKS)[number];

export const SOZLUK_ENTRY_STATUSES = [
  "published",
  "pending",
  "hidden",
  "deleted",
] as const;
export type SozlukEntryStatus = (typeof SOZLUK_ENTRY_STATUSES)[number];

export const SOZLUK_REPORT_REASONS = [
  "spam",
  "harassment",
  "rule_violation",
  "spoiler",
  "other",
] as const;
export type SozlukReportReason = (typeof SOZLUK_REPORT_REASONS)[number];

const NICK_REGEX = /^[a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]{3,24}$/;

export const authorRegisterSchema = z.object({
  nick: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(NICK_REGEX, "Geçersiz yazar mahlası"),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128),
  bio: z.string().trim().max(300).optional().default(""),
});

export const authorLoginSchema = z.object({
  identifier: z.string().trim().min(3).max(160),
  password: z.string().min(1).max(128),
});

export const googleOnboardingSchema = z.object({
  nick: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(NICK_REGEX, "Geçersiz yazar mahlası"),
  bio: z.string().trim().max(300).optional().default(""),
});

export const createTopicSchema = z.object({
  title: z.string().trim().min(2).max(100),
  channelSlug: z.string().trim().min(1).max(48).optional(),
  content: z.string().trim().min(3).max(8000),
});

export const createEntrySchema = z.object({
  topicSlug: z.string().trim().min(1).max(120),
  content: z.string().trim().min(3).max(8000),
});

export const updateEntrySchema = z.object({
  content: z.string().trim().min(3).max(8000),
});

export const voteEntrySchema = z.object({
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

export const reportEntrySchema = z.object({
  reason: z.enum(SOZLUK_REPORT_REASONS),
  note: z.string().trim().max(500).optional().default(""),
});

export type AuthorRegisterInput = z.infer<typeof authorRegisterSchema>;
export type AuthorLoginInput = z.infer<typeof authorLoginSchema>;
export type GoogleOnboardingInput = z.infer<typeof googleOnboardingSchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type VoteEntryInput = z.infer<typeof voteEntrySchema>;
export type ReportEntryInput = z.infer<typeof reportEntrySchema>;
