import { createServer, type Server } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { afterAll, beforeAll, expect, it } from "vitest";
import { auditSite, parseAuditUrl, renderAuditMarkdown } from "../../scripts/live-audit.ts";

let server: Server;
let base: URL;
let generic404 = false;
const requested: string[] = [];
beforeAll(async () => {
  server = createServer((request, response) => {
    requested.push(`${request.method} ${request.url}`);
    const origin = `http://${request.headers.host}`;
    if (request.url === "/") {
      response.setHeader("Content-Type", "text/html");
      response.end(`<html lang='tr'><head><title>ULUDOTT &amp; Test | Site</title><link href='${origin}/' rel='canonical'></head><body><a href='#main-content' class='extra skip'>İçeriğe geç</a><header class='site-header'></header><main id='main-content'></main><script>"<meta name='robots' content='noindex'>"</script></body></html>`);
    } else if (request.url === "/admin") {
      response.setHeader("X-Robots-Tag", "noindex, nofollow");
      response.end("<html lang=tr><title>Yönetim</title><meta content='noindex, nofollow' name='robots'></html>");
    } else if (request.url === "/robots.txt") {
      response.end(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nDisallow: /l/\nSitemap: ${origin}/sitemap.xml\n`);
    } else if (request.url === "/sitemap.xml") {
      response.end(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url></urlset>`);
    } else {
      response.statusCode = 404;
      if (generic404) response.end("<html><title>404</title>Not found</html>");
      else {
        response.setHeader("Cache-Control", "no-store");
        if (request.url?.startsWith("/l/")) {
          response.setHeader("X-Robots-Tag", "noindex, nofollow");
          response.setHeader("Referrer-Policy", "no-referrer");
          response.setHeader("X-Content-Type-Options", "nosniff");
        }
        response.end();
      }
    }
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw Error("Yerel test portu yok");
  base = new URL(`http://127.0.0.1:${address.port}`);
});
afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

it("pnpm -- ayırıcısını kabul eder; URL kimliği/protokolü ve bilinmeyen seçenekleri reddeder", () => {
  expect(parseAuditUrl(["--", "--url", "https://example.invalid/"]).origin).toBe("https://example.invalid");
  for (const args of [[], ["--url", "file:///tmp/a"], ["--url", "https://name:secret@example.invalid"], ["--url", "https://example.invalid/path"], ["--url", "https://example.invalid", "--typo"]]) {
    expect(() => parseAuditUrl(args)).toThrow();
  }
});

it("yalnız GET ile yerel hedefleri denetler; HTML alanlarını ve handler ipuçlarını Markdown'a yazar", async () => {
  const rows = await auditSite(base);
  expect(rows).toHaveLength(6);
  expect(rows.every(row => row.ok)).toBe(true);
  const home = rows.find(row => row.path === "/");
  expect(home).toMatchObject({ title: "ULUDOTT & Test | Site", lang: "tr", skip: true, header: true, robots: "" });
  expect(rows.find(row => row.path === "/admin")?.robots).toContain("noindex");
  expect(requested.every(value => value.startsWith("GET "))).toBe(true);
  const markdown = renderAuditMarkdown(rows);
  expect(markdown).toContain("ULUDOTT &amp; Test &#124; Site");
  expect(markdown).toContain("X-Robots-Tag");
  expect(markdown).toContain("handler ipucu");
});

it("genel 404 HTML'ini rota varlığı sanmaz", async () => {
  generic404 = true;
  try {
    const rows = await auditSite(base);
    expect(rows.filter(row => row.path.startsWith("/l/") || row.path.startsWith("/media/")).every(row => !row.ok && row.note.includes("doğrulanmadı"))).toBe(true);
  } finally { generic404 = false; }
});

it("Node CLI yerel sunucuya bağlanır, pnpm ayırıcısını işler ve tabloyla exit 0 döner", async () => {
  const { stdout } = await promisify(execFile)(process.execPath, ["--experimental-strip-types", "scripts/live-audit.ts", "--", "--url", base.href], { timeout: 10_000 });
  expect(stdout).toContain("| Rota | HTTP | X-Robots-Tag |");
  expect(stdout).toContain("| / | 200 |");
  expect(stdout).not.toContain("✗");
});

it("ağ hatası raporu kesmez ve ham hata/sır değerini çıktıya koymaz", async () => {
  const rows = await auditSite(base, async () => { throw Error("private-secret"); });
  expect(rows.every(row => row.status === null && !row.ok)).toBe(true);
  expect(renderAuditMarkdown(rows)).not.toContain("private-secret");
});
