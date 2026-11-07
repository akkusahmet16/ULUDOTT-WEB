import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  getIconEntry,
  ICON_IDS,
  ICON_REGISTRY,
  Icon,
  isIconId,
  type IconId,
} from "../../src/components/ui/icons/index.tsx";
import { socialIcons } from "../../src/modules/site-settings/domain/contact.ts";
import { SocialIcon } from "../../src/modules/site-settings/ui/social-icon.tsx";

const ROOT_DIR = process.cwd();

function collectTsFiles(dirPath: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))
    ) {
      results.push(full);
    }
  }
  return results;
}

describe("Faz 2 / İş 2C — Merkezi ikon kaydı ve erişilebilirlik sözleşmesi", () => {
  it("IconId kümesini, mevcut SVG path/viewBox/stroke/fill yapısını ve marka SVG varlıklarını bire bir korur", () => {
    expect(ICON_IDS).toEqual(socialIcons);
    for (const id of ICON_IDS) {
      expect(isIconId(id)).toBe(true);
      const entry = getIconEntry(id);
      expect(entry.id).toBe(id);
      expect(entry.viewBox).toBe("0 0 24 24");
      expect(entry.defaultSize).toBe(28);

      if (entry.kind === "inline-svg") {
        if (entry.id === "link") {
          expect(entry.fill).toBe("none");
          expect(entry.stroke).toBe("currentColor");
          expect(entry.strokeWidth).toBe("2");
          expect(entry.paths).toEqual([
            "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2",
          ]);
        } else if (entry.id === "text") {
          expect(entry.fill).toBe("none");
          expect(entry.stroke).toBe("currentColor");
          expect(entry.strokeWidth).toBe("2");
          expect(entry.paths).toHaveLength(1);
        } else {
          expect(["link", "text"]).toContain(entry.id);
        }
      } else {
        expect(entry.colorMode).toBe("intrinsic-svg");
        const svgPath = path.join(ROOT_DIR, "public", entry.src);
        expect(fs.existsSync(svgPath)).toBe(true);
        const svgContent = fs.readFileSync(svgPath, "utf8");
        expect(svgContent).toContain('viewBox="0 0 24 24"');
        expect(svgContent).toContain("<path ");
      }
    }

    expect(isIconId("unknown-icon")).toBe(false);
    expect(isIconId("")).toBe(false);
    expect(() => getIconEntry("unknown" as IconId)).toThrow(/Unknown IconId/);
  });

  it("dekoratif ikona aria-hidden/boş alt, anlamlı ikona role='img' ve erişilebilir ad verir", () => {
    // 1. Dekoratif satır içi SVG ikon
    const decorativeLinkHtml = renderToStaticMarkup(
      createElement(Icon, { id: "link", decorative: true, size: 24 }),
    );
    expect(decorativeLinkHtml).toContain('aria-hidden="true"');
    expect(decorativeLinkHtml).not.toContain('role="img"');
    expect(decorativeLinkHtml).not.toContain("aria-label=");
    expect(decorativeLinkHtml).toContain('width="24"');
    expect(decorativeLinkHtml).toContain('height="24"');
    expect(decorativeLinkHtml).toContain('stroke="currentColor"');
    expect(decorativeLinkHtml).toContain('stroke-width="2"');

    // 2. Anlamlı satır içi SVG ikon
    const meaningfulLinkHtml = renderToStaticMarkup(
      createElement(Icon, {
        id: "link",
        label: "Harici bağlantı",
        decorative: false,
        size: 28,
      }),
    );
    expect(meaningfulLinkHtml).toContain('role="img"');
    expect(meaningfulLinkHtml).toContain('aria-label="Harici bağlantı"');
    expect(meaningfulLinkHtml).not.toContain("aria-hidden");

    // 3. Dekoratif marka ikonu
    const decorativeInstagramHtml = renderToStaticMarkup(
      createElement(Icon, { id: "instagram", decorative: true, size: 24 }),
    );
    expect(decorativeInstagramHtml).toContain('class="social-logo"');
    expect(decorativeInstagramHtml).toContain('src="/brand/social/instagram.svg"');
    expect(decorativeInstagramHtml).toContain('alt=""');
    expect(decorativeInstagramHtml).toContain('width="24"');
    expect(decorativeInstagramHtml).toContain('height="24"');

    // 4. Anlamlı marka ikonu
    const meaningfulInstagramHtml = renderToStaticMarkup(
      createElement(Icon, {
        id: "instagram",
        label: "Uludott Instagram",
        decorative: false,
      }),
    );
    expect(meaningfulInstagramHtml).toContain('alt="Uludott Instagram"');

    // 5. Anlamlı ikonda (decorative=false) boş etiket reddedilir
    expect(() =>
      renderToStaticMarkup(
        createElement(Icon, { id: "link", decorative: false, label: "   " }),
      ),
    ).toThrow(/requires a non-empty accessible label/);

    // 6. SocialIcon sarmalayıcısı v0.1 çıktısını bire bir üretir
    for (const id of ICON_IDS) {
      const socialHtml = renderToStaticMarkup(
        createElement(SocialIcon, { icon: id, size: 24 }),
      );
      const directHtml = renderToStaticMarkup(
        createElement(Icon, { id, size: 24, decorative: true }),
      );
      expect(socialHtml).toBe(directHtml);
    }
    expect(Object.keys(ICON_REGISTRY)).toEqual([...ICON_IDS]);
  });

  it("merkezi ikon kaydı dışında izinsiz <svg> veya yeni emoji ikon bulunmadığını doğrular; kullanıcı QR/SVG çıktısını engellemez", () => {
    const srcFiles = collectTsFiles(path.join(ROOT_DIR, "src"));
    const canonicalIconFile = path.join(
      ROOT_DIR,
      "src/components/ui/icons/icon.tsx",
    );

    const unauthorizedInlineSvgFiles: string[] = [];
    const emojiViolations: string[] = [];
    const V01_PRESERVED_TYPOGRAPHIC_GLYPHS = new Set(["↗", "▶"]);
    const emojiPattern = /\p{Extended_Pictographic}/gu;

    function findForbiddenEmojis(text: string): string[] {
      const matches = text.match(emojiPattern) ?? [];
      return matches.filter(
        (glyph) => !V01_PRESERVED_TYPOGRAPHIC_GLYPHS.has(glyph),
      );
    }

    for (const filePath of srcFiles) {
      const content = fs.readFileSync(filePath, "utf8");
      const rel = path.relative(ROOT_DIR, filePath).split(path.sep).join("/");

      if (
        filePath !== canonicalIconFile &&
        !filePath.endsWith("status-mark.tsx") &&
        /<svg[\s>]/i.test(content)
      ) {
        unauthorizedInlineSvgFiles.push(rel);
      }

      if (
        rel.startsWith("src/components/") ||
        rel.startsWith("src/app/") ||
        (rel.startsWith("src/modules/") && rel.includes("/ui/"))
      ) {
        const forbidden = findForbiddenEmojis(content);
        if (forbidden.length > 0) {
          emojiViolations.push(`${rel}: [${forbidden.join(", ")}]`);
        }
      }
    }

    expect(unauthorizedInlineSvgFiles).toEqual([]);
    expect(emojiViolations).toEqual([]);
    expect(findForbiddenEmojis("Keşfet ↗ ▶")).toEqual([]);
    expect(findForbiddenEmojis("Oyunlar 🎮 🚀")).toEqual(["🎮", "🚀"]);

    // QR ve kullanıcı/kart görüntü akışlarının (WebCard, link-qr) engellenmediğini doğrula
    const webCardSource = fs.readFileSync(
      path.join(ROOT_DIR, "src/modules/cards/ui/web-card.tsx"),
      "utf8",
    );
    expect(webCardSource).toContain("card.qr");
  });
});
