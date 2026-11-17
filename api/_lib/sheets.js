// Lê planilhas do Google Sheets publicadas como CSV (Arquivo → Compartilhar → Publicar na Web → CSV).
// A URL fica só no servidor; o navegador do cliente nunca a vê.
// Modelos de colunas em /modelos/*.csv

const norm = (s) => String(s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export function parseCSV(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((v) => v.trim() !== ""));
  if (!head) return [];
  const keys = head.map(norm);
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] || "").trim()])));
}

// "2026-11-20", "20/11/2026", "20/11/26" → "2026-11-20"
export function isoDate(v) {
  const s = String(v || "").trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) return `${m[3].length === 2 ? "20" + m[3] : m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

// "2026-10", "10/2026", "out/2026", "outubro 2026" → "2026-10"
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export function isoMonth(v) {
  const s = norm(v);
  let m = s.match(/^(\d{4})_(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})_(\d{4})/);
  if (m) return `${m[2]}-${m[1].padStart(2, "0")}`;
  m = s.match(/^([a-z]{3})[a-z]*_(\d{4})/);
  if (m && MONTHS.includes(m[1])) return `${m[2]}-${String(MONTHS.indexOf(m[1]) + 1).padStart(2, "0")}`;
  return null;
}

// "R$ 1.234,56" → 1234.56
export function num(v) {
  const s = String(v || "").replace(/[^\d,.-]/g, "");
  if (!s) return 0;
  const n = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  return Number(n) || 0;
}

async function fetchSheet(url) {
  if (!/^https:\/\/docs\.google\.com\//.test(url)) throw new Error("URL de planilha inválida (use o link CSV publicado do Google Sheets)");
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Planilha indisponível (${res.status})`);
  return parseCSV(await res.text());
}

const STATUS = {
  planejado: "planejado", ideia: "planejado",
  em_producao: "producao", producao: "producao",
  aguardando_aprovacao: "aprovacao", em_aprovacao: "aprovacao", aprovacao: "aprovacao",
  aprovado: "aprovado", agendado: "aprovado",
  publicado: "publicado", postado: "publicado",
};

export async function fetchCalendar(url) {
  return (await fetchSheet(url))
    .map((r, i) => ({
      id: `c${i}`,
      date: isoDate(r.data),
      time: r.hora || "",
      network: r.rede || "Instagram",
      format: r.formato || "Post",
      title: r.tema || r.titulo || "",
      caption: r.legenda || "",
      status: STATUS[norm(r.status)] || "planejado",
      boost: /^s/i.test(r.impulsionar || ""),
      link: /^https:\/\//.test(r.link || "") ? r.link : "",
    }))
    .filter((r) => r.date);
}

export async function fetchSales(url) {
  return (await fetchSheet(url))
    .map((r) => ({
      date: isoDate(r.data),
      count: num(r.vendas || r.quantidade || "1") || 0,
      value: num(r.valor || r.faturamento),
      channel: r.canal || "",
    }))
    .filter((r) => r.date);
}

export async function fetchReports(url) {
  const split = (s) => String(s || "").split(/\s*[;\n•]\s*/).map((x) => x.trim()).filter(Boolean);
  return (await fetchSheet(url))
    .map((r) => ({
      month: isoMonth(r.mes),
      summary: r.resumo || "",
      highlights: split(r.destaques),
      next: split(r.proximos_passos),
    }))
    .filter((r) => r.month)
    .sort((a, b) => b.month.localeCompare(a.month));
}
