import { z } from "zod";
const path = z.string().max(500);
export const chapterInput = z.strictObject({
  title: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(100),
  video: path,
  videoVisible: z.boolean().default(true),
  poster: path,
});
export const memberInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(100),
  quote: z.string().trim().max(400),
  details: z.array(z.string().trim().min(1).max(200)).max(5),
  photo: path,
  chapterSlug: z.string().min(1).max(100),
  position: z.int().min(0).max(10000),
});
export type MemberFields = z.infer<typeof memberInput>;
export type ChapterFields = z.infer<typeof chapterInput>;
export type PeopleEntry =
  | {
      slot: string;
      kind: "chapter";
      revision: number;
      fields: ChapterFields;
      deleted?: boolean;
    }
  | {
      slot: string;
      kind: "member";
      revision: number;
      fields: MemberFields;
      deleted?: boolean;
    };
