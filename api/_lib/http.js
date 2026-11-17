export function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

export async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

// Nunca devolve detalhes internos (tokens, IDs, stack) para o navegador.
export function fail(res, err, fallback = "Erro inesperado. Tente novamente.") {
  console.error("[portal]", err);
  const status = err?.status || 500;
  const message = err?.expose ? err.message : status === 503 ? "Portal em configuração. Fale com a agência." : fallback;
  json(res, status, { error: message });
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
