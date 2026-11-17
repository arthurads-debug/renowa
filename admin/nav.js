// Navegação do administrador: busca rápida (⌘K / Ctrl+K ou "/"), barra inferior no celular
// e atalhos de teclado. Encontra qualquer função, lead ou cliente sem procurar páginas.
import { h, $ } from "/cliente/assets/util.js";

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const KEY_HINT = isMac ? "⌘K" : "Ctrl K";

const ICONS = {
  leads: "M4 6h16M4 12h10M4 18h7",
  clients: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM22 19v-1a4 4 0 0 0-3-3.9M16 3.1a3.5 3.5 0 0 1 0 6.8",
  site: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  portal: "M3 12h4l3-8 4 16 3-8h4",
  plus: "M12 5v14M5 12h14",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  check: "M5 12l5 5 9-11",
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0",
  report: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  out: "M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5",
  filter: "M3 5h18l-7 8v6l-4-2v-4z",
};
export const ico = (name) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("class", "nav-ico");
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", ICONS[name] || ICONS.search);
  svg.append(p);
  return svg;
};

/**
 * @param {() => Array<{group:string,label:string,hint?:string,icon?:string,keywords?:string,run:()=>void}>} getItems
 */
export function initNav(getItems) {
  let open = false, items = [], sel = 0, lastFocus = null;

  const input = h("input", { type: "search", class: "cmd__input", placeholder: "Buscar função, lead ou cliente…", "aria-label": "Buscar", autocomplete: "off", spellcheck: "false" });
  const list = h("div", { class: "cmd__list", role: "listbox", id: "cmd-list" });
  const box = h("div", { class: "cmd", id: "cmd", hidden: true },
    h("div", { class: "cmd__backdrop", onclick: close }),
    h("div", { class: "cmd__panel", role: "dialog", "aria-modal": "true", "aria-label": "Busca rápida" },
      h("div", { class: "cmd__bar" }, ico("search"), input, h("kbd", { class: "cmd__esc" }, "Esc")),
      list,
      h("p", { class: "cmd__foot" }, h("span", {}, h("kbd", {}, "↑"), h("kbd", {}, "↓"), " navegar"), h("span", {}, h("kbd", {}, "Enter"), " abrir"), h("span", {}, h("kbd", {}, KEY_HINT), " abre esta busca de qualquer tela"))));
  document.body.append(box);

  function render() {
    const q = norm(input.value.trim());
    const words = q.split(/\s+/).filter(Boolean);
    const all = getItems();
    items = (words.length ? all.filter((it) => { const t = norm(`${it.label} ${it.hint || ""} ${it.keywords || ""} ${it.group}`); return words.every((w) => t.includes(w)); }) : all.filter((it) => !it.searchOnly)).slice(0, 40);
    sel = Math.min(sel, Math.max(0, items.length - 1));
    if (!items.length) { list.replaceChildren(h("p", { class: "cmd__empty" }, "Nada encontrado. Tente o nome do lead, da empresa ou de uma função.")); return; }
    const out = [];
    let group = null;
    items.forEach((it, i) => {
      if (it.group !== group) { group = it.group; out.push(h("p", { class: "cmd__group" }, group)); }
      out.push(h("button", {
        type: "button", class: "cmd__item", role: "option", id: `cmd-${i}`, "aria-selected": String(i === sel),
        onmousemove: () => { if (sel !== i) { sel = i; mark(); } },
        onclick: () => run(i),
      }, ico(it.icon), h("span", { class: "cmd__label" }, it.label), it.hint ? h("small", {}, it.hint) : null));
    });
    list.replaceChildren(...out);
    mark();
  }
  function mark() {
    list.querySelectorAll(".cmd__item").forEach((b, i) => b.setAttribute("aria-selected", String(i === sel)));
    const cur = list.querySelector(`#cmd-${sel}`);
    cur?.scrollIntoView({ block: "nearest" });
    input.setAttribute("aria-activedescendant", cur ? cur.id : "");
  }
  function run(i) { const it = items[i]; if (!it) return; close(); setTimeout(() => it.run(), 10); }

  function show() {
    if (open) return;
    open = true; lastFocus = document.activeElement;
    box.hidden = false; input.value = ""; sel = 0; render();
    requestAnimationFrame(() => { box.classList.add("is-open"); input.focus(); });
  }
  function close() {
    if (!open) return;
    open = false; box.classList.remove("is-open");
    setTimeout(() => (box.hidden = true), 160);
    lastFocus?.focus?.();
  }

  input.addEventListener("input", () => { sel = 0; render(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); mark(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); mark(); }
    else if (e.key === "Enter") { e.preventDefault(); run(sel); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
  });

  const typing = (t) => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  document.addEventListener("keydown", (e) => {
    if ($("#view-app")?.hidden) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open ? close() : show(); return; }
    if (open || typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "/") { e.preventDefault(); show(); }
  });

  return { show, close };
}
