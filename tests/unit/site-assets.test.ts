import { it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  listSiteAssets,
  assertSiteAsset,
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
