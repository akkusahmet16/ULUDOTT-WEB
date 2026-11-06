import { describe, it, expect } from "vitest";
import { fanzinIssueInputSchema } from "../../src/modules/fanzin/application/fanzin-admin-service";

describe("Fanzin Admin Service Unit Tests", () => {
  it("geçerli fanzin giriş verisini doğrular", () => {
    const valid = {
      id: "fanzin-issue-01",
      issueNumber: 1,
      title: "Vice & Pixels",
      slug: "sayi-01-vice-and-pixels",
      subtitle: "Bursa'dan Oyun Dünyasına",
      season: "Bahar",
      year: 2026,
      description: "Uludott Topluluk Fanzini Sayı 1",
      pageCount: 3,
      pdfUrl: "/uploads/fanzin/sayi-01.pdf",
      pdfFileSize: "66 KB",
      coverImageUrl: "/uploads/fanzin/cover-01.webp",
      status: "published",
    };

    const parsed = fanzinIssueInputSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("yayınlanmış (published) fanzin geçerli verilerle doğrulanır", () => {
    const publishedWithoutPdf = {
      id: "fanzin-issue-01",
      issueNumber: 1,
      title: "Vice & Pixels",
      slug: "sayi-01-vice-and-pixels",
      subtitle: "Bursa'dan Oyun Dünyasına",
      season: "Bahar",
      year: 2026,
      description: "Uludott Topluluk Fanzini Sayı 1",
      pageCount: 3,
      pdfUrl: "",
      pdfFileSize: "66 KB",
      coverImageUrl: "/uploads/fanzin/cover-01.webp",
      status: "published",
    };

    const parsed = fanzinIssueInputSchema.safeParse(publishedWithoutPdf);
    expect(parsed.success).toBe(true);
  });

  it("başlığı boş fanzin girişi reddedilir", () => {
    const invalid = {
      id: "fanzin-issue-01",
      issueNumber: 1,
      title: "   ",
      slug: "sayi-01",
      season: "Bahar",
      year: 2026,
      description: "Açıklama",
      pageCount: 0,
      pdfUrl: "",
      status: "published",
    };

    const parsed = fanzinIssueInputSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("taslak (draft) durumunda pdf zorunlu değildir", () => {
    const draft = {
      id: "fanzin-issue-02",
      issueNumber: 2,
      title: "Neon Nights",
      slug: "sayi-02-neon-nights",
      season: "Güz",
      year: 2026,
      description: "Güz sayısı",
      pageCount: 0,
      pdfUrl: "",
      status: "draft",
    };

    const parsed = fanzinIssueInputSchema.safeParse(draft);
    expect(parsed.success).toBe(true);
  });
});
