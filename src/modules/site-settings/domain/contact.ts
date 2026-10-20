import { z } from "zod";
export const socialIcons = [
  "instagram",
  "whatsapp",
  "x",
  "youtube",
  "link",
] as const;
export const httpsUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        !/[\s\\]/.test(value)
      );
    } catch {
      return false;
    }
  }, "Geçerli bir HTTPS adresi girin");
export const socialSchema = z.strictObject({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
  title: z.string().trim().min(1).max(80),
  url: httpsUrl,
  icon: z.enum(socialIcons),
  contact: z.boolean(),
  footer: z.boolean(),
});
export const contactSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(3000),
    channelsTitle: z.string().trim().min(1).max(160),
    email: z.union([z.email().max(250), z.literal("")]),
    phone: z
      .string()
      .trim()
      .max(40)
      .refine(
        (value) =>
          value === "" ||
          (/^[+\d ()-]+$/.test(value) &&
            /^\+?\d{7,15}$/.test(value.replace(/[ ()-]/g, ""))),
        "Geçerli bir telefon numarası girin",
      ),
    footerDescription: z.string().trim().max(300),
    footerTagline: z.string().trim().max(500),
    socials: z.array(socialSchema).max(30),
  })
  .refine(
    (data) =>
      new Set(data.socials.map((social) => social.id)).size ===
      data.socials.length,
    "Bağlantı kimliği tekrarlanamaz",
  );
export type ContactSettings = z.infer<typeof contactSchema>;
export type SocialAccount = z.infer<typeof socialSchema>;
export const defaultContactSettings: ContactSettings = {
  title: "İletişim",
  description:
    "Bir fikrin, sorunun ya da birlikte yapmak istediğin bir şey varsa konuşalım.",
  channelsTitle: "Bize ulaş",
  email: "uludott@gmail.com",
  phone: "+90 532 350 62 86",
  footerDescription: "Dijital Oyun Tasarım Topluluğu",
  footerTagline: "Oyunlar, fikirler ve birlikte üretmek.",
  socials: [
    {
      id: "instagram",
      title: "Instagram",
      url: "https://www.instagram.com/uludott",
      icon: "instagram",
      contact: true,
      footer: true,
    },
    {
      id: "whatsapp",
      title: "WhatsApp",
      url: "https://chat.whatsapp.com/G9zI4u4FOEu8Cz5AhitkVS?s=cl&p=i&mlu=4&ilr=4",
      icon: "whatsapp",
      contact: true,
      footer: true,
    },
    {
      id: "x",
      title: "X",
      url: "https://x.com/uludott",
      icon: "x",
      contact: true,
      footer: true,
    },
    {
      id: "youtube",
      title: "YouTube",
      url: "https://youtube.com/@uludott",
      icon: "youtube",
      contact: true,
      footer: true,
    },
  ],
};
