// Cache em memória por instância da função. Evita estourar limites das APIs de anúncios
// quando vários usuários abrem o painel ao mesmo tempo.
const store = new Map();
const TTL = (parseInt(process.env.CACHE_TTL_SECONDS || "300", 10) || 300) * 1000;

export async function cached(key, fn, ttl = TTL) {
  const hit = store.get(key);
  if (hit && hit.exp > Date.now()) return hit.value;
  const value = await fn();
  store.set(key, { value, exp: Date.now() + ttl });
  if (store.size > 500) store.delete(store.keys().next().value);
  return value;
}
