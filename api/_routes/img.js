// GET /api/img?u=<endereço>&s=<assinatura> — entrega pelo próprio site as capas dos posts do Instagram/Facebook.
// O Safari (principalmente no iPhone) às vezes bloqueia as imagens dos servidores da Meta, e elas somem do relatório/PDF.
// Só busca endereços assinados pelo servidor e só de domínios de imagem da Meta e do YouTube.
import { macOf } from "../_lib/session.js";

const ALLOWED = /(^|\.)(fbcdn\.net|cdninstagram\.com|ytimg\.com|ggpht\.com|googleusercontent\.com)$/i;

export const proxied = (u) => (u && /^https:\/\//.test(u) ? `/api/img?u=${encodeURIComponent(u)}&s=${macOf(u)}` : u);

export default async function handler(req, res) {
  const q = new URL(req.url, "http://x").searchParams;
  const u = q.get("u") || "";
  const end = (code) => { res.statusCode = code; res.setHeader("Cache-Control", "no-store"); res.end(); };
  let host = "";
  try { host = new URL(u).hostname; } catch { return end(400); }
  if (!/^https:/.test(u) || !ALLOWED.test(host) || q.get("s") !== macOf(u)) return end(403);
  try {
    const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (Renowa)" }, signal: AbortSignal.timeout(8000) });
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !type.startsWith("image/")) return end(404);
    const buf = Buffer.from(await r.arrayBuffer());
    res.statusCode = 200;
    res.setHeader("Content-Type", type);
    res.setHeader("Content-Length", String(buf.length));
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, immutable");
    res.end(buf);
  } catch { return end(502); }
}
