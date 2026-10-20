import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export type AuditRow = {
  path: string;
  status: number | null;
  xRobots: string;
  robots: string;
  title: string;
  canonical: string;
  lang: string;
  skip: boolean;
  header: boolean;
  note: string;
  ok: boolean;
};

export function parseAuditUrl(args: string[]): URL {
  const values = args[0] === "--" ? args.slice(1) : args;
  if (values.length !== 2 || values[0] !== "--url" || !values[1])
    throw Error("Kullanım: pnpm audit:live -- --url https://uludott.com.tr");
  const url = new URL(values[1]);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash)
    throw Error("Kök HTTP(S) adresi gerekli; kimlik bilgisi, yol, sorgu veya fragment kullanmayın.");
  return url;
}

function decode(value: string): string {
  return value.replace(/&(?:#(\d+)|#x([a-f0-9]+)|(amp|quot|apos|lt|gt));/gi, (entity, decimal: string | undefined, hex: string | undefined, name: string | undefined) => {
    if (decimal || hex) {
      const point = Number.parseInt(decimal ?? hex ?? "", decimal ? 10 : 16);
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
    }
    switch (name?.toLowerCase()) {
      case "amp": return "&";
      case "quot": return '"';
      case "apos": return "'";
      case "lt": return "<";
      case "gt": return ">";
      default: return entity;
    }
  });
}
function attributes(tag: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return result;
}
function tokens(value: string | undefined): string[] {
  return (value ?? "").toLowerCase().split(/\s+/);
}
function htmlFields(source: string) {
  // RSC/script metnindeki HTML benzeri string'ler gerçek meta/işaretçi sayılmaz.
  const html = source.replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "");
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0]));
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0]));
  const anchors = [...html.matchAll(/<a\b[^>]*>/gi)].map(match => attributes(match[0]));
  return {
    robots: metas.filter(meta => meta.name?.toLowerCase() === "robots").map(meta => meta.content ?? "").join(", "),
    title: decode(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html)?.[1] ?? "").trim(),
    canonical: links.find(link => tokens(link.rel).includes("canonical"))?.href ?? "",
    lang: attributes(/<html\b[^>]*>/i.exec(html)?.[0] ?? "").lang ?? "",
    skip: anchors.some(anchor => tokens(anchor.class).includes("skip") && anchor.href === "#main-content") && /\bid\s*=\s*["']main-content["']/i.test(html),
    header: [...html.matchAll(/<header\b[^>]*>/gi)].some(match => tokens(attributes(match[0]).class).includes("site-header")),
  };
}
async function boundedText(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let size = 0;
  let result = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2 * 1024 * 1024) {
        await reader.cancel();
        throw Error("Yanıt boyutu sınırı");
      }
      result += decoder.decode(value, { stream: true });
    }
    return result + decoder.decode();
  } finally { reader.releaseLock(); }
}

export async function auditSite(base: URL, fetcher: typeof fetch = fetch): Promise<AuditRow[]> {
  // Geçersiz kimlikler var olan içerik/token keşfetmeden handler ipucu verir.
  const paths = ["/", "/robots.txt", "/sitemap.xml", "/admin", "/l/__audit_invalid_id__", "/media/__audit_invalid_id__"] as const;
  const rows: AuditRow[] = [];
  for (const path of paths) {
    const row: AuditRow = { path, status: null, xRobots: "", robots: "", title: "", canonical: "", lang: "", skip: false, header: false, note: "", ok: false };
    try {
      const response = await fetcher(new URL(path, base), {
        method: "GET", redirect: "manual", signal: AbortSignal.timeout(10_000),
        headers: { Accept: "text/html,application/xml,text/plain", "User-Agent": "ULUDOTT-live-audit/1" },
      });
      const body = await boundedText(response);
      row.status = response.status;
      row.xRobots = response.headers.get("x-robots-tag") ?? "";
      if (path === "/" || path === "/admin") {
        Object.assign(row, htmlFields(body));
        if (path === "/") {
          const canonical = row.canonical ? new URL(row.canonical, base) : null;
          row.ok = response.status === 200 && !/noindex/i.test(`${row.xRobots},${row.robots}`) && !!row.title && canonical?.href === base.href && !!row.lang && row.skip && row.header;
          row.note = row.ok ? "Genel indeksleme ve depo işaretçileri uygun" : "Durum/indeksleme/metadata/depo işaretçilerini inceleyin";
        } else {
          row.ok = response.status === 200 && /noindex/i.test(row.xRobots) && /noindex/i.test(row.robots);
          row.note = row.ok ? "Yönetim noindex korunuyor" : "Yönetim durumu ve noindex korumasını inceleyin";
        }
      } else if (path === "/robots.txt") {
        row.ok = response.status === 200 && /^Allow:\s*\/\s*$/im.test(body)
          && ["/admin", "/api", "/l/"].every(value => body.split(/\r?\n/).some(line => line.trim().toLowerCase() === `disallow: ${value}`))
          && body.split(/\r?\n/).some(line => line.trim() === `Sitemap: ${new URL("/sitemap.xml", base).href}`);
        row.note = row.ok ? "Allow/Disallow ve sitemap bağlantısı uygun" : "Robots kuralları doğrulanmadı";
      } else if (path === "/sitemap.xml") {
        row.ok = response.status === 200 && /<urlset\b/i.test(body) && body.includes(`<loc>${base.href}</loc>`) && !/<loc>[^<]*\/(?:admin|api|l)(?:\/|<)/i.test(body);
        row.note = row.ok ? "Sitemap yanıtı ve genel kök URL uygun" : "Sitemap yanıtı doğrulanmadı";
      } else {
        const noStore = /\bno-store\b/i.test(response.headers.get("cache-control") ?? "");
        const shortLinkHeaders = /noindex/i.test(row.xRobots) && response.headers.get("referrer-policy") === "no-referrer" && response.headers.get("x-content-type-options") === "nosniff";
        row.ok = response.status === 404 && body.trim() === "" && noStore && (path.startsWith("/media/") || shortLinkHeaders);
        row.note = row.ok ? "Boş 404 + özel başlıklar: handler ipucu; tek başına kesin kanıt değildir" : "Rota varlığı doğrulanmadı; genel 404 varlık kanıtı sayılmaz";
      }
    } catch {
      row.note = "Ağ/yanıt doğrulanmadı (10 sn zaman aşımı, 2 MiB sınırı); ham hata yazılmadı";
    }
    rows.push(row);
  }
  return rows;
}

function cell(value: string): string {
  return (value || "—").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("|", "&#124;").replace(/[\r\n]+/g, " ");
}
export function renderAuditMarkdown(rows: AuditRow[]): string {
  const headings = ["Rota", "HTTP", "X-Robots-Tag", "meta robots", "title", "canonical", "lang", "skip", "site-header", "Sonuç"];
  return [
    `| ${headings.join(" | ")} |`,
    `| ${headings.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${[row.path, row.status?.toString() ?? "HATA", row.xRobots, row.robots, row.title, row.canonical, row.lang, row.skip ? "✓" : "—", row.header ? "✓" : "—", `${row.ok ? "✓" : "✗"} ${row.note}`].map(cell).join(" | ")} |`),
  ].join("\n");
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const rows = await auditSite(parseAuditUrl(process.argv.slice(2)));
    console.log(renderAuditMarkdown(rows));
    if (rows.some(row => !row.ok)) process.exitCode = 1;
  } catch (error) {
    // URL parser'ın ham hata mesajı kimlik bilgisi içerebilir.
    console.error(error instanceof Error && error.message.startsWith("Kullanım:") ? error.message : "Geçersiz denetim argümanı; kök HTTP(S) URL kullanın.");
    process.exitCode = 1;
  }
}
