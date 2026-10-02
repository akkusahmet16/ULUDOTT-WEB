import "server-only";
export async function readJson(req: Request, maxBytes = 32 * 1024) {
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    throw Error("Geçersiz istek");
  const r = req.body?.getReader();
  if (!r) throw Error("Geçersiz istek");
  let total = 0,
    expired = false;
  const chunks: Uint8Array[] = [];
  const timer = setTimeout(() => {
    expired = true;
    void r.cancel();
  }, 10000);
  try {
    for (;;) {
      const { done, value } = await r.read();
      if (expired) throw Error("İstek süresi aşıldı");
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await r.cancel();
        throw Error("İstek çok büyük");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } finally {
    clearTimeout(timer);
    r.releaseLock();
  }
}
