import { it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import {
  listSiteAssets,
  assertSiteAsset,
  uploadSiteAsset,
  deleteSiteAsset,
} from "../../src/modules/media/application/site-assets";

// Losing root checks would expose another folder; rejecting Unicode would hide supplied assets.
it("klasör envanteri Türkçe/boşluk içeren medyayı bulur, başka kök ve symlink sunmaz", async () => {
  const root = await mkdtemp(join(tmpdir(), "uludott-assets-"));
  try {
    const dir = join(root, "community/03-hakkimizda/people/ekip");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "Tuğçe foto.webp"), "fixture");
    await writeFile(join(dir, "açılış.mp4"), "fixture");
    await writeFile(join(dir, "bilgi.md"), "not media");
    await writeFile(join(root, "outside.webp"), "outside");
    await symlink(join(root, "outside.webp"), join(dir, "linked.webp"));
    const assets = await listSiteAssets("people", root);
    expect(assets.map((a) => a.path)).toEqual(
      expect.arrayContaining([
        "/community/03-hakkimizda/people/ekip/Tuğçe foto.webp",
        "/community/03-hakkimizda/people/ekip/açılış.mp4",
      ]),
    );
    expect(assets).toHaveLength(2);
    await expect(
      assertSiteAsset(assets[0].path, "people", assets[0].kind, root),
    ).resolves.toBeUndefined();
    for (const path of [
      "/community/03-hakkimizda/people/ekip/linked.webp",
      "/community/03-hakkimizda/people/../../../outside.webp",
      "/community/03-hakkimizda/people/%2e%2e/outside.webp",
      "/outside.webp",
    ])
      await expect(
        assertSiteAsset(path, "people", "image", root),
      ).rejects.toThrow();
    await expect(
      assertSiteAsset(
        "/community/03-hakkimizda/people/ekip/açılış.mp4",
        "people",
        "image",
        root,
      ),
    ).rejects.toThrow();
    expect(await listSiteAssets("games", root)).toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

it("cihazdan yüklenen görsel uploads/ altında klasörlenir, assertSiteAsset ve listSiteAssets ile doğrulanır", async () => {
  const root = await mkdtemp(join(tmpdir(), "uludott-upload-assets-"));
  try {
    const pngBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 200, g: 100, b: 50, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const file = new File([pngBuffer], "Yeni Ekip Üyesi.png", {
      type: "image/png",
    });

    const uploaded = await uploadSiteAsset("people", file, root);

    expect(uploaded.path).toMatch(/^\/uploads\/people\/\d+-yeni-ekip-uyesi\.webp$/);
    expect(uploaded.folder).toBe("/uploads/people");
    expect(uploaded.kind).toBe("image");

    await expect(
      assertSiteAsset(uploaded.path, "people", "image", root),
    ).resolves.toBeUndefined();

    // Wrong scope must be rejected
    await expect(
      assertSiteAsset(uploaded.path, "games", "image", root),
    ).rejects.toThrow();

    // listSiteAssets finds the uploaded asset in uploads/people
    const assets = await listSiteAssets("people", root);
    expect(assets.some((a) => a.path === uploaded.path)).toBe(true);

    // Non-image file must be rejected
    const textFile = new File(["not an image"], "test.txt", {
      type: "text/plain",
    });
    await expect(
      uploadSiteAsset("people", textFile, root),
    ).rejects.toThrow();

    // Invalid scope must be rejected
    await expect(
      // @ts-expect-error invalid scope testing
      uploadSiteAsset("invalid_scope", file, root),
    ).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

it("deleteSiteAsset uploads altındaki dosyayı VDS diskinden kalıcı olarak siler, yetkisiz yolları reddeder", async () => {
  const root = await mkdtemp(join(tmpdir(), "uludott-delete-assets-"));
  try {
    const pngBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 100, g: 150, b: 200, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const file = new File([pngBuffer], "Silinecek Dosya.png", {
      type: "image/png",
    });

    const uploaded = await uploadSiteAsset("sponsors", file, root);
    expect(uploaded.path).toContain("/uploads/sponsors/");

    // Dosyayı sil
    const deleteRes = await deleteSiteAsset(uploaded.path, root);
    expect(deleteRes.success).toBe(true);
    expect(deleteRes.path).toBe(uploaded.path);

    // Silindikten sonra bulunamamalı
    await expect(deleteSiteAsset(uploaded.path, root)).rejects.toThrow("Dosya bulunamadı");

    // İzin verilmeyen yollar ve path traversal engellenmeli
    await expect(deleteSiteAsset("/outside.webp", root)).rejects.toThrow();
    await expect(deleteSiteAsset("/uploads/../../etc/passwd", root)).rejects.toThrow();
    await expect(deleteSiteAsset("../uploads/test.webp", root)).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

it("fanzin kapsamı altında PDF dosyaları (magic bytes ve uzantı ile) 100MB sınırına kadar kabul edilir", async () => {
  const root = await mkdtemp(join(tmpdir(), "uludott-pdf-assets-"));
  try {
    const pdfContent = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
    const file = new File([pdfContent], "Fanzin Sayı 1.pdf", {
      type: "application/pdf",
    });

    const uploaded = await uploadSiteAsset("fanzin", file, root);
    expect(uploaded.path).toMatch(/^\/uploads\/fanzin\/\d+-fanzin-sayi-1\.pdf$/);
    expect(uploaded.folder).toBe("/uploads/fanzin");
    expect(uploaded.kind).toBe("document");

    await expect(
      assertSiteAsset(uploaded.path, "fanzin", "document", root),
    ).resolves.toBeUndefined();

    // Magic bytes içeren ancak uzantısı olmayan veya octet-stream MIME tipi olan PDF de algılanır
    const binaryPdfFile = new File([pdfContent], "adsiz-dosya", {
      type: "application/octet-stream",
    });
    const uploadedBinary = await uploadSiteAsset("fanzin", binaryPdfFile, root);
    expect(uploadedBinary.kind).toBe("document");
    expect(uploadedBinary.path).toMatch(/\.pdf$/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
