// Depois que o cliente (ou a agência por ele) conecta o Google ou o Facebook,
// escolhe sozinho a conta de anúncios / página quando só existe uma opção.
// Com várias, a agência escolhe numa lista (sem digitar ID).
import { findById, invalidateClients } from "./clients.js";
import { writeClient } from "./store.js";
import { listGoogleAccounts } from "./google-ads.js";
import { listMetaAdAccounts, listPages } from "./meta-ads.js";

const only = (list) => {
  const active = list.filter((a) => a.status === "Ativa");
  return active.length === 1 ? active[0] : list.length === 1 ? list[0] : null;
};

export async function autoLink(provider, clientId) {
  const c = await findById(clientId);
  if (!c || c.source === "env") return { found: 0, linked: [] };
  const next = { ...c };
  delete next.source;
  const linked = [];
  let found = 0;

  if (provider === "google") {
    const list = await listGoogleAccounts(clientId);
    found = list.length;
    const cur = list.find((a) => a.id.replace(/\D/g, "") === String(c.googleAds?.customerId || "").replace(/\D/g, ""));
    const pick = cur || only(list);
    if (pick) {
      next.googleAds = { customerId: pick.id, name: pick.name, loginCustomerId: pick.loginCustomerId || "" };
      linked.push(`Google Ads: ${pick.name}`);
    }
  } else {
    const [ads, pages] = await Promise.all([listMetaAdAccounts(clientId), listPages(clientId)]);
    found = ads.length + pages.length;
    const ad = ads.find((a) => a.id === c.metaAds?.adAccountId) || only(ads);
    if (ad) { next.metaAds = { ...(c.metaAds || {}), adAccountId: ad.id, name: ad.name }; linked.push(`Meta Ads: ${ad.name}`); }
    const page = pages.find((p) => p.id === c.facebook?.pageId) || (pages.length === 1 ? pages[0] : null);
    if (page) {
      next.facebook = { pageId: page.id, name: page.name };
      linked.push(`Facebook: ${page.name}`);
      if (page.instagram) { next.instagram = { userId: page.instagram.id, username: page.instagram.username }; linked.push(`Instagram: @${page.instagram.username}`); }
    }
  }
  if (linked.length) {
    next.updatedAt = new Date().toISOString();
    await writeClient(next);
    invalidateClients();
  }
  return { found, linked };
}
