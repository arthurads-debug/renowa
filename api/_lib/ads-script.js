// Plano B do Google Ads, sem token de desenvolvedor: um script rodando dentro da própria conta
// do Google Ads (Ferramentas → Scripts) envia os resultados para o painel a cada hora.
// Os números ficam no banco (renowa:gads:<cliente>) e o relatório usa quando a API não está liberada.
import { sign, verify } from "./session.js";
import { kvGetJSON, kvSetJSON } from "./store.js";

const KEY = (clientId) => `renowa:gads:${clientId}`;
export const ingestKey = (clientId) => sign({ k: "ing", c: clientId, exp: Date.now() + 10 * 365 * 864e5 });
export const readIngestKey = (t) => { const v = verify(t); return v?.k === "ing" && v.c ? v : null; };

// Guarda compacto: nomes das campanhas uma vez, linhas como listas de números
export async function saveScriptData(clientId, body) {
  const rows = Array.isArray(body?.rows) ? body.rows.slice(0, 40000) : [];
  const campaigns = {};
  const out = [];
  for (const r of rows) {
    if (!Array.isArray(r) || !/^\d{4}-\d{2}-\d{2}$/.test(String(r[0]))) continue;
    const id = String(r[1]).replace(/\D/g, "").slice(0, 20);
    if (!id) continue;
    campaigns[id] = { n: String(r[2] || "").slice(0, 160), s: String(r[3] || "").slice(0, 20) };
    const num = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v) * 100) / 100 : 0);
    out.push([r[0], id, num(r[4]), num(r[5]), num(r[6]), num(r[7]), num(r[8]), num(r[9])]);
  }
  const a = body?.account || {};
  const data = {
    account: { id: String(a.id || "").slice(0, 20), name: String(a.name || "").slice(0, 120), currency: String(a.currency || "").slice(0, 3) },
    campaigns, rows: out, updatedAt: new Date().toISOString(),
  };
  await kvSetJSON(KEY(clientId), data);
  return { rows: out.length, campaigns: Object.keys(campaigns).length };
}

export const readScriptData = (clientId) => kvGetJSON(KEY(clientId)).catch(() => null);

// Mesmo formato de linha que a API (dia × campanha)
export function scriptRows(data, from, to) {
  if (!data?.rows) return [];
  return data.rows.filter((r) => r[0] >= from && r[0] <= to).map((r) => ({
    date: r[0], platform: "google", campaignId: r[1], campaign: data.campaigns[r[1]]?.n || `Campanha ${r[1]}`, status: data.campaigns[r[1]]?.s || "",
    spend: r[2], impressions: r[3], clicks: r[4], results: r[5], revenue: r[6], engagement: r[7], videoViews: 0,
  }));
}

export function scriptTotals(data, days = 30) {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - (days - 1) * 864e5).toISOString().slice(0, 10);
  return scriptRows(data, from, to).reduce((t, r) => ({ spend: t.spend + r.spend, impressions: t.impressions + r.impressions, clicks: t.clicks + r.clicks, results: t.results + r.results }), { spend: 0, impressions: 0, clicks: 0, results: 0 });
}

// Último envio (ok ou erro) — para o painel dizer o que aconteceu
const STATUS = (clientId) => `renowa:gads:${clientId}:status`;
export const saveScriptStatus = (clientId, st) => kvSetJSON(STATUS(clientId), { ...st, at: new Date().toISOString() });
export const readScriptStatus = (clientId) => kvGetJSON(STATUS(clientId)).catch(() => null);

// O script que a agência cola no Google Ads (Ferramentas → Ações em massa → Scripts).
// Funciona colado na conta do cliente OU na conta de administrador (MCC): na MCC, lê as contas abaixo dela.
export function scriptSource(url, clientName) {
  return `// Renowa — envia os resultados de "${clientName}" para o painel da agência.
// Cole em: Google Ads → Ferramentas → Ações em massa → Scripts → + → Novo script.
// Depois: Autorizar → Salvar → Executar. Na lista de scripts, Frequência: "De hora em hora".
// Funciona na conta do cliente ou na conta de administrador (MCC). Só LÊ os números.
var PAINEL = '${url}';

function enviar(dados) {
  var resp = UrlFetchApp.fetch(PAINEL, { method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify(dados) });
  Logger.log('Resposta do painel: ' + resp.getResponseCode() + ' ' + resp.getContentText());
}

function coletar() {
  var conta = AdsApp.currentAccount();
  var fuso = conta.getTimeZone();
  var hoje = new Date();
  var fim = Utilities.formatDate(hoje, fuso, 'yyyy-MM-dd');
  var inicio = Utilities.formatDate(new Date(hoje.getTime() - 399 * 86400000), fuso, 'yyyy-MM-dd');
  var consulta = "SELECT segments.date, campaign.id, campaign.name, campaign.status, " +
    "metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, " +
    "metrics.conversions_value, metrics.engagements FROM campaign " +
    "WHERE segments.date BETWEEN '" + inicio + "' AND '" + fim + "' AND metrics.impressions > 0";
  var linhas = [];
  var it = AdsApp.search(consulta);
  while (it.hasNext()) {
    var r = it.next(), m = r.metrics || {};
    linhas.push([r.segments.date, String(r.campaign.id), r.campaign.name, r.campaign.status,
      Number(m.costMicros || 0) / 1e6, Number(m.impressions || 0), Number(m.clicks || 0),
      Number(m.conversions || 0), Number(m.conversionsValue || 0), Number(m.engagements || 0)]);
  }
  return linhas;
}

function main() {
  var principal = AdsApp.currentAccount();
  var dados = { account: { id: principal.getCustomerId(), name: principal.getName(), currency: principal.getCurrencyCode() }, rows: [], contas: [] };
  try {
    if (typeof AdsManagerApp !== 'undefined') {
      // conta de administrador (MCC): junta as contas de anúncio abaixo dela
      var contas = AdsManagerApp.accounts().get();
      while (contas.hasNext()) {
        var c = contas.next();
        AdsManagerApp.select(c);
        try {
          var l = coletar();
          dados.rows = dados.rows.concat(l);
          dados.contas.push(c.getName() + ' (' + c.getCustomerId() + '): ' + l.length);
          if (l.length && dados.account.id === principal.getCustomerId()) dados.account = { id: c.getCustomerId(), name: c.getName(), currency: c.getCurrencyCode() };
        } catch (e) { dados.contas.push(c.getCustomerId() + ': ' + e); }
      }
      AdsManagerApp.select(principal);
    } else {
      dados.rows = coletar();
    }
  } catch (e) {
    dados.error = String(e);
  }
  Logger.log('Renowa: ' + dados.rows.length + ' linhas. ' + dados.contas.join(' | ') + (dados.error ? ' ERRO: ' + dados.error : ''));
  enviar(dados);
}
`;
}
