// Cenas 7 a 11: tráfego, jornada, painel Renowa, proposta e bônus/encerramento.
import { h, icon, markPrio, logoPrio, logoRenowa, statusBar } from "./shared/lib.js";
import { ARTES, REGIAO, REFERENCIAS_MAPA, VALORES } from "./shared/config.js";
import { art } from "./shared/arts.js";
import { box, show, key, move, fn, ink, count, kin, svgLayer, sv, path, seg, mix } from "./motor.js";

const brl = (v) => "R$ " + Math.round(v).toLocaleString("pt-BR");

export function cenasFinais({ scene, kick, phoneShell, siteHome }) {
  /* ============================== 07 · TRÁFEGO ============================== */
  {
    const { el, t0 } = scene("trafego");
    kick(el, "Passo 06 · Tráfego pago", t0, 118.6);
    const s = svgLayer(el);
    // conteúdos → canais
    const arts = [3, 6, 11].map((ai, i) => { const c = box(el, { x: 120, y: 200 + i * 250, w: 176, hgt: 220, cls: "v-mini" }, art(ARTES[ai])); show(c, t0 + 0.3 + i * 0.3, t0 + 11.4, { in: "left" }); return c; });
    const CH = [["fb", "Facebook", ""], ["insta", "Instagram", ""], ["google", "Google", "quando necessário"], ["yt", "YouTube", "quando necessário"]];
    CH.forEach(([ic, nome, sub], i) => {
      const y = 230 + i * 175;
      show(box(el, { x: 560, y, w: 330, cls: "v-chan" }, h("span", { class: "v-chan__i" }, icon(ic)), h("div", {}, h("b", {}, nome), sub ? h("small", {}, sub) : null)), t0 + 1.4 + i * 0.4, t0 + 11.4, { in: "pop" });
      [0, 1, 2].forEach((a) => {
        const p = ink(path(s, `M300 ${310 + a * 250} C 430 ${310 + a * 250}, 440 ${y + 42}, 560 ${y + 42}`, "ink ink--gold ink--thin"), t0 + 2 + i * 0.2 + a * 0.1, 1);
        fn(t0 + 11, 0.5, (q) => (p.style.opacity = String(1 - q)));
      });
      // posts viajando pelos canais
      for (let k = 0; k < 3; k++) {
        const dot = sv(s, "rect", { width: 18, height: 22, rx: 4, class: "fill-forest" });
        fn(t0 + 3.2 + i * 0.3 + k * 0.9, 1.4, (q) => {
          const a = k % 3, x0 = 300, y0 = 300 + a * 250, x1 = 560, y1 = y + 32;
          const u = q, x = mix(x0, x1, u), yy = mix(y0, y1, u * u * (3 - 2 * u));
          dot.setAttribute("x", x); dot.setAttribute("y", yy); dot.style.opacity = q > 0 && q < 1 ? 1 : 0;
        }, "power1.inOut");
        dot.style.opacity = 0;
      }
    });
    // mapa da região (mesma projeção da apresentação)
    const B = { w: -48.75, e: -46.95, n: -2.05, s: -4.55 }, MW = 640, MH = 890, MX = 1180, MY = 120;
    const px = (lng, lat) => [MX + ((lng - B.w) / (B.e - B.w)) * MW, MY + ((B.n - lat) / (B.n - B.s)) * MH];
    const map = svgLayer(el);
    show(map, t0 + 3.6, 118.6, { in: "fade", di: 1 });
    for (let x = 0; x < MW; x += 32) for (let y = 0; y < MH; y += 32) sv(map, "circle", { cx: MX + x, cy: MY + y, r: 1.4, fill: "rgba(11,74,50,.16)" });
    const road = [[-48.15, -1.3], [-47.92, -1.62], [-47.63, -2.13], [-47.5, -2.56], [-47.35, -3], [-47.43, -3.4], [-47.49, -3.75], [-47.55, -4.29], [-47.48, -5], [-47.48, -5.53]].map(([a, b], i) => `${i ? "L" : "M"}${px(a, b).join(" ")}`).join(" ");
    ink(path(map, road, "ink ink--gold ink--thin ink--dash"), t0 + 4, 2);
    const base = REGIAO.find((r) => r.base);
    const [bx, by] = px(base.lng, base.lat);
    const waves = [0, 1, 2, 3].map(() => sv(map, "circle", { cx: bx, cy: by, r: 10, fill: "none", stroke: "#1F8F4E", "stroke-width": 2 }));
    fn(t0 + 6, 13, (_, t) => waves.forEach((w, i) => { const ph = (((Math.max(0, t - t0 - 6)) / 3.2 + i / 4) % 1); w.setAttribute("r", String(20 + ph * 520)); w.style.opacity = String((1 - ph) * 0.8); }));
    REFERENCIAS_MAPA.filter((c) => c.lat < B.n && c.lat > B.s && c.lng > B.w && c.lng < B.e).forEach((c) => { const [x, y] = px(c.lng, c.lat); sv(map, "circle", { cx: x, cy: y, r: 3.5, fill: "rgba(18,26,22,.35)" }); const tx = sv(map, "text", { x: x + 10, y: y + 5, class: "v-mapref" }); tx.textContent = c.nome; });
    REGIAO.forEach((c, i) => {
      const [x, y] = px(c.lng, c.lat);
      const g = sv(map, "g", {});
      const ray = ink(path(g, `M${bx} ${by} L${x} ${y}`, "ink ink--gold ink--thin"), t0 + 5.4 + i * 0.3, 0.9);
      sv(g, "circle", { cx: x, cy: y, r: c.base ? 13 : 9, fill: c.base ? "#B8955B" : "#fff", stroke: c.base ? "#fff" : "#0B4A32", "stroke-width": 3 });
      const left = c.lng < -47.8;
      const tx = sv(g, "text", { x: x + (left ? -20 : 20), y: y + 7, "text-anchor": left ? "end" : "start", class: `v-mapcity ${c.base ? "is-base" : ""}` }); tx.textContent = c.nome;
      fn(t0 + 5.2 + i * 0.3, 0.6, (q) => (g.style.opacity = String(q))); g.style.opacity = 0;
      // pessoas descobrindo a empresa perto de cada cidade
      if (!c.base) { const pp = sv(map, "g", { transform: `translate(${x + (left ? -40 : 30)} ${y - 46})` }); path(pp, "M0 -10 A6 6 0 1 0 0.1 -10 M-9 12 Q0 -2 9 12", "ink ink--thin"); sv(pp, "rect", { x: 12, y: -14, width: 12, height: 20, rx: 2, fill: "none", stroke: "#B8955B", "stroke-width": 2 }); fn(t0 + 8 + i * 0.4, 0.6, (q) => (pp.style.opacity = String(q))); pp.style.opacity = 0; }
    });
    show(box(el, { x: MX, y: 1030, w: MW, cls: "note" }, "Estratégia geográfica pretendida · não representa resultados."), t0 + 6, 118.6, { in: "up" });
    // tipografia + fluxo
    kin(el, "Não basta produzir.", { x: 120, y: 260, size: 84, t0: t0 + 11.8, t1: 118.6 });
    kin(el, ["É preciso chegar às ", h("em", {}, "pessoas certas.")], { x: 120, y: 360, size: 84, t0: t0 + 12.8, t1: 118.6 });
    const FL = [["megaphone", "Anúncio"], ["globe", "Instagram ou site"], ["msg", "Atendimento"], ["wa", "WhatsApp"]];
    FL.forEach(([ic, t], i) => {
      show(box(el, { x: 120 + i * 260, y: 620, cls: `chipv ${i === 3 ? "chipv--forest" : ""}` }, icon(ic), t), t0 + 11.6 + i * 0.5, 118.6, { in: "up" });
      if (i < 3) show(box(el, { x: 120 + i * 260 + 236, y: 630, cls: "v-arrow" }, icon("arrowR")), t0 + 11.9 + i * 0.5, 118.6, { in: "left" });
    });
  }

  /* ============================== 08 · JORNADA ============================== */
  {
    const { el, t0 } = scene("jornada");
    kick(el, "O ecossistema funcionando", t0, 131.6);
    const ST = [["megaphone", "Vê um anúncio"], ["globe", "Acessa o site"], ["corn", "Consulta sementes de milho"], ["bot", "Conversa com a assistente"], ["file", "Solicita atendimento"], ["wa", "Chega ao WhatsApp"]];
    const xs = ST.map((_, i) => 210 + i * 300), Y = 600;
    const s = svgLayer(el);
    const d = `M${xs[0]} ${Y} ` + xs.slice(1).map((x, i) => `C ${xs[i] + 150} ${Y + (i % 2 ? 90 : -90)}, ${x - 150} ${Y + (i % 2 ? 90 : -90)}, ${x} ${Y}`).join(" ");
    const track = path(s, d, "ink ink--gold ink--dash");
    ink(track, t0 + 0.6, 9.2, "none");
    const len = track.getTotalLength ? null : null;
    // estações
    ST.forEach(([ic, t], i) => {
      const at = t0 + 0.6 + i * 1.7;
      const st = box(el, { x: xs[i] - 62, y: Y - 62, w: 124, hgt: 124, cls: "v-st" }, icon(ic));
      show(st, at - 0.3, 131.6, { in: "pop" });
      fn(at + 0.2, 0.5, (q) => st.classList.toggle("is-on", q > 0.5));
      show(box(el, { x: xs[i] - 130, y: Y + 90, w: 260, cls: "v-stl" }, t), at, 131.6, { in: "up" });
    });
    // o produtor (ícone vetorial) percorre a jornada
    const pr = box(el, { w: 90, hgt: 120, cls: "v-prod" });
    pr.style.left = "0"; pr.style.top = "0";
    pr.innerHTML = `<svg viewBox="-45 -70 90 120" width="90" height="120"><path class="ink" d="M-26 -38 H26 M-16 -38 Q-14 -60 0 -60 Q14 -60 16 -38"/><circle class="ink" cx="0" cy="-24" r="12"/><path class="ink" d="M-22 30 Q-24 -4 0 -6 Q24 -4 22 30 M-8 30 V48 M8 30 V48"/></svg>`;
    show(pr, t0 + 0.4, 131.6, { in: "fade" });
    fn(t0 + 0.6, 9.2, (p) => {
      const u = p * (ST.length - 1), i = Math.min(ST.length - 2, Math.floor(u)), f = u - i;
      const x = mix(xs[i], xs[i + 1], f), y = Y + Math.sin(f * Math.PI) * (i % 2 ? 68 : -68) - 150;
      pr.style.setProperty("--x", `${x - 45}px`); pr.style.setProperty("--y", `${y}px`);
    }, "none");
    pr.style.setProperty("--x", `${xs[0] - 45}px`); pr.style.setProperty("--y", `${Y - 150}px`);
    kin(el, ["Do primeiro contato à ", h("em", {}, "oportunidade comercial.")], { x: 0, y: 190, w: 1920, align: "center", size: 74, t0: t0 + 9.6, t1: 131.6 });
    show(box(el, { x: 0, y: 870, w: 1920, cls: "note v-center" }, "Uma oportunidade é o início da conversa comercial. Quem conduz a venda é a equipe da PrioSafra."), t0 + 10.4, 131.6, { in: "up" });
  }

  /* ============================== 09 · PAINEL RENOWA ============================== */
  {
    const { el, t0 } = scene("painel", { bg: "dark" });
    kick(el, "Plataforma Renowa · área do cliente", t0, 151.6, true);
    const s = svgLayer(el);
    // dados viajando até o computador
    const lines = [180, 420, 660, 900].map((y, i) => ink(path(s, `M-20 ${y} C 160 ${y}, 200 460, 300 460`, "ink ink--light ink--thin"), t0 + 0.2 + i * 0.15, 1.2));
    for (let k = 0; k < 10; k++) {
      const c = sv(s, "circle", { r: 6, fill: k % 2 ? "#FA4802" : "#6D66FF" });
      const y0 = [180, 420, 660, 900][k % 4];
      fn(t0 + 0.6 + k * 0.28, 1.2, (q) => { const x = mix(-20, 300, q), y = mix(y0, 460, q * q); c.setAttribute("cx", x); c.setAttribute("cy", y); c.style.opacity = q > 0 && q < 1 ? 1 : 0; }, "power1.in");
      c.style.opacity = 0;
    }
    fn(t0 + 3.6, 0.6, (q) => s.style.setProperty("--o", String(1 - q)));
    ink(path(s, "M318 84 H1602 Q1622 84 1622 104 V804 Q1622 824 1602 824 H318 Q298 824 298 804 V104 Q298 84 318 84 Z", "ink ink--light"), t0 + 0.6, 1.4);
    // painel (mesmos componentes do painel demonstrativo da apresentação)
    const kpi = (l, v, sub, acc) => h("div", { class: `dk ${acc ? "dk--acc" : ""}` }, h("span", { class: "dk__l" }, l), v, h("span", { class: "dk__s" }, sub));
    const vInv = h("b", { class: "dk__v" }), vVis = h("b", { class: "dk__v" }), vWa = h("b", { class: "dk__v" }), vSol = h("b", { class: "dk__v" });
    const chartW = 760, chartH = 210;
    const vals = [38, 44, 41, 52, 49, 58, 55, 63, 60, 71, 68, 76, 74, 83, 80, 88, 86, 95, 92, 101];
    const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * chartW},${chartH - (v / 110) * chartH}`).join(" ");
    const chart = h("div", { class: "v-chart", html: `<svg viewBox="0 0 ${chartW} ${chartH}" preserveAspectRatio="none"><g stroke="rgba(255,255,255,.07)">${[0, 1, 2, 3].map((i) => `<line x1="0" x2="${chartW}" y1="${i * 70}" y2="${i * 70}"/>`).join("")}</g><polygon points="0,${chartH} ${pts} ${chartW},${chartH}" fill="rgba(75,68,255,.22)"/><polyline points="${pts}" fill="none" stroke="#6D66FF" stroke-width="3" stroke-linejoin="round"/><polyline points="${vals.map((v, i) => `${(i / (vals.length - 1)) * chartW},${chartH - (v * 0.42 / 110) * chartH}`).join(" ")}" fill="none" stroke="#FA4802" stroke-width="3" stroke-linejoin="round"/></svg>` });
    const opsList = h("div", { class: "v-ops" });
    const newOp = h("div", { class: "a v-op v-op--new" }, icon("wa"), h("div", {}, h("b", {}, "Novo contato comercial"), h("span", {}, "Milho · Ulianópolis · Orçamento")), h("em", {}, "agora"));
    newOp.style.position = "relative";
    opsList.append(newOp, ...[["Pastagens · Dom Eliseu", "ontem"], ["Sorgo · Paragominas", "ontem"]].map(([t, w]) => h("div", { class: "v-op" }, icon("msg"), h("div", {}, h("b", {}, "Solicitação de atendimento"), h("span", {}, t)), h("em", {}, w))));
    const db = h("div", { class: "db v-db" },
      h("aside", { class: "db__side" }, logoRenowa({ tone: "light", cls: "rlogo db__logo" }),
        h("div", { class: "db__acc" }, h("span", { class: "db__accav" }, markPrio({ cls: "pmark", dark: "#E9F2EC", light: "#3FB56E" })), h("div", {}, h("b", {}, "PrioSafra Agronegócio"), h("span", {}, "Área do cliente"))),
        h("nav", { class: "db__nav" }, [["grid", "Visão geral"], ["fb", "Meta Ads"], ["fb", "Facebook"], ["insta", "Instagram"], ["google", "Google Ads"], ["yt", "YouTube"], ["globe", "Visitas ao site"], ["handshake", "Oportunidades"], ["file", "Relatórios"]].map(([i, t], k) => h("button", { "aria-current": String(k === 0) }, icon(i), h("span", {}, t))))),
      h("div", { class: "db__main" },
        h("div", { class: "db__top" }, h("div", { class: "db__demo" }, icon("info", "ic ic--xs"), "Demonstração de interface — dados ilustrativos"), h("div", { class: "db__topr" }, h("span", { class: "db__upd" }, h("i"), "Última sincronização: há 12 min"), h("div", { class: "db__per" }, h("button", {}, "7 dias"), h("button", { "aria-pressed": "true" }, "30 dias")))),
        h("div", { class: "db__content" },
          h("div", { class: "dk-row" }, kpi("Investimento em mídia", vInv, "Meta + Google"), kpi("Visitas ao site", vVis, "período"), kpi("Cliques no WhatsApp", vWa, "intenção de contato"), kpi("Solicitações de atendimento", vSol, "site e assistente", true)),
          h("div", { class: "dg dg--2-1" }, h("section", { class: "dp" }, h("h4", { class: "v-dph" }, "Alcance e visitas"), chart, h("div", { class: "lc__leg" }, h("span", {}, h("i", { style: { background: "#6D66FF" } }), "Alcance"), h("span", {}, h("i", { style: { background: "#FA4802" } }), "Visitas ao site"))), h("section", { class: "dp" }, h("h4", { class: "v-dph" }, "Oportunidades"), opsList)),
          h("div", { class: "v-plats" }, [["fb", "Meta Ads", "4 campanhas ativas"], ["insta", "Instagram", "alcance orgânico"], ["fb", "Facebook", "interações"], ["google", "Google Ads", "pesquisas"], ["yt", "YouTube", "visualizações"]].map(([i, t, s2]) => h("div", {}, icon(i), h("b", {}, t), h("span", {}, s2)))))));
    const scr = box(el, { x: 312, y: 98, w: 1296, hgt: 712, cls: "v-dbwrap" }, db);
    show(scr, t0 + 1.8, 151.6, { in: "scale", di: 1 });
    [...db.querySelectorAll(".dk, .dp, .v-plats > div")].forEach((n, i) => { n.classList.add("a"); n.style.position = "relative"; show(n, t0 + 2.4 + i * 0.22, 151.6, { in: "up", dist: 20 }); });
    fn(t0 + 4.2, 2.6, (q) => (chart.style.clipPath = `inset(0 ${100 - q * 100}% 0 0)`), "power2.inOut");
    chart.style.clipPath = "inset(0 100% 0 0)";
    count(vInv, t0 + 3, 2.2, 0, 1358, (v) => brl(v));
    count(vVis, t0 + 3, 2.2, 0, 3712);
    count(vWa, t0 + 3, 2.2, 0, 121);
    count(vSol, t0 + 3, 2.2, 0, 43);
    // eventos: nova visita, novo contato
    fn(t0 + 11.6, 0.6, (q) => (vVis.textContent = (3712 + (q > 0.5 ? 1 : 0)).toLocaleString("pt-BR")));
    const toast = box(el, { x: 1260, y: 120, w: 330, cls: "v-toast" }, icon("eye"), h("div", {}, h("b", {}, "Nova visita ao site"), h("span", {}, "Página: Sementes de milho")));
    show(toast, t0 + 11.4, t0 + 13.6, { in: "down", out: "up" });
    show(newOp, t0 + 13.8, 151.6, { in: "left" });
    fn(t0 + 14, 0.6, (q) => (vSol.textContent = String(43 + (q > 0.5 ? 1 : 0))));
    fn(t0 + 14, 1.4, (q) => db.querySelector(".dk--acc").style.setProperty("box-shadow", `0 0 0 ${q < 1 ? 3 : 0}px rgba(250,72,2,${(1 - q).toFixed(2)})`));
    show(box(el, { x: 312, y: 832, w: 1296, cls: "note note--light v-center" }, "Atualização conforme a sincronização e as permissões de cada plataforma."), t0 + 6, 151.6, { in: "up" });
    ["TRANSPARÊNCIA.", "CONTROLE.", "INTELIGÊNCIA DE DADOS."].forEach((w, i) => kin(el, w, { x: [312, 770, 1100][i], y: 905, size: 46, cls: "kin--caps kin--ivory", t0: t0 + 15 + i * 0.9, t1: 151.6 }));
  }

  /* ============================== 10 · PROPOSTA ============================== */
  {
    const { el, t0 } = scene("proposta");
    kick(el, "A proposta comercial", t0, 167.6);
    const items = VALORES.avulso;
    const cards = items.map((it, i) => {
      const c = box(el, { w: 320, hgt: 190, cls: "card v-cost" }, h("span", {}, it.item), h("b", {}, it.min === it.max ? brl(it.min) : `${brl(it.min)} a ${brl(it.max)}`), h("small", {}, it.nota));
      c.style.left = "0"; c.style.top = "0";
      show(c, t0 + 0.4 + i * 0.6, t0 + 10.6, { in: "pop" });
      move(c, t0 + 8, 1.6, { x: 120 + i * 344, y: 250, s: 1 }, { x: 800, y: 330, s: 0.3 }, "expo.inOut");
      return c;
    });
    const sumMin = h("b", {}), sumMax = h("b", {});
    const sum = box(el, { x: 120, y: 520, w: 1680, cls: "v-sumline" }, h("span", {}, "Contratação individual estimada"), h("div", {}, sumMin, h("i", {}, " a "), sumMax, h("small", {}, "/mês")));
    show(sum, t0 + 3.6, t0 + 9.4, { in: "up" });
    count(sumMin, t0 + 3.8, 1.8, 0, 6550, (v) => brl(v)); count(sumMax, t0 + 3.8, 1.8, 0, 7250, (v) => brl(v));
    // reúne tudo em uma estrutura e muda o fundo
    const s = svgLayer(el);
    ink(path(s, "M760 300 H1160 Q1180 300 1180 320 V560 Q1180 580 1160 580 H760 Q740 580 740 560 V320 Q740 300 760 300 Z", "ink ink--gold"), t0 + 8.6, 1.2);
    fn(t0 + 9.6, 0.4, (q) => (s.style.opacity = String(1 - q)));
    const deep = box(el, { cls: "deep v-deep" });
    deep.style.left = "0"; deep.style.top = "0";
    fn(t0 + 9.8, 1.2, (q) => (deep.style.clipPath = `circle(${q * 120}% at 50% 42%)`), "power3.inOut");
    deep.style.clipPath = "circle(0% at 50% 42%)";
    kin(el, "ECOSSISTEMA COMPLETO RENOWA", { x: 0, y: 230, w: 1920, align: "center", size: 40, cls: "kin--caps kin--gold", t0: t0 + 10.8, t1: 167.6 });
    const big = h("b", {}, "0");
    show(box(el, { x: 0, y: 300, w: 1920, cls: "v-price" }, h("span", {}, "R$"), big, h("em", {}, "/mês")), t0 + 11.2, 167.6, { in: "scale" });
    count(big, t0 + 11.3, 1.8, 0, 3900, (v) => Math.round(v).toLocaleString("pt-BR"));
    show(box(el, { x: 0, y: 640, w: 1920, cls: "v-eco" }, "Economia recorrente estimada: ", h("b", {}, "R$ 2.650 a R$ 3.350"), " por mês"), t0 + 13.4, 167.6, { in: "up" });
    show(box(el, { x: 0, y: 980, w: 1920, cls: "note note--light v-center" }, "Valores comparativos estimados, da proposta comercial. Verba de anúncios não inclusa."), t0 + 13.8, 167.6, { in: "up" });
  }

  /* ============================== 11 · BÔNUS E ENCERRAMENTO ============================== */
  {
    const { el, t0 } = scene("bonus", { bg: "deep" });
    // site como bônus
    const mini = box(el, { x: 170, y: 230, w: 760, hgt: 470, cls: "v-minisite" }, h("div", { class: "bw__bar" }, h("span", { class: "bw__dots" }, h("i"), h("i"), h("i")), h("span", { class: "bw__addr" }, "priosafra.com.br")), h("div", { class: "v-minisite__b" }, siteHome()));
    show(mini, t0 + 0.1, t0 + 4.8, { in: "left", out: "fade" });
    show(box(el, { x: 1040, y: 260, cls: "v-bk" }, "Desenvolvimento do site"), t0 + 0.6, t0 + 4.8, { in: "up" });
    const strike = h("i", { class: "v-strike" });
    show(box(el, { x: 1040, y: 320, cls: "v-old" }, "R$ 3.000", strike), t0 + 1, t0 + 4.8, { in: "up" });
    fn(t0 + 2.2, 0.7, (q) => (strike.style.transform = `scaleX(${q})`), "power3.inOut");
    strike.style.transform = "scaleX(0)";
    show(box(el, { x: 1040, y: 470, cls: "v-stamp" }, icon("gift"), "INCLUSO COMO BÔNUS"), t0 + 3, t0 + 4.8, { in: "pop" });
    show(box(el, { x: 1044, y: 580, w: 700, cls: "v-bsub" }, "Manutenção mensal também inclusa, sem cobrança adicional."), t0 + 3.6, t0 + 4.8, { in: "up" });
    // ecossistema orbitando a PrioSafra
    const O = [["insta", "Instagram"], ["calendar", "Conteúdo"], ["camera", "Audiovisual"], ["globe", "Site"], ["bot", "Assistente"], ["megaphone", "Anúncios"], ["wa", "WhatsApp"], ["gauge", "Dashboard"]];
    const s = svgLayer(el);
    const CX = 960, CY = 470, R = 330;
    const core = box(el, { x: CX - 110, y: CY - 110, w: 220, hgt: 220, cls: "v-core" }, markPrio({ cls: "pmark", dark: "#E9F2EC", light: "#3FB56E" }));
    show(core, t0 + 4.6, t0 + 6.4, { in: "pop" });
    const nodes = O.map(([ic, t], i) => { const n = box(el, { w: 150, cls: "v-orb" }, h("span", {}, icon(ic)), h("b", {}, t)); n.style.left = "0"; n.style.top = "0"; show(n, t0 + 4.8 + i * 0.1, t0 + 6.2, { in: "pop" }); return n; });
    const spokes = O.map(() => sv(s, "line", { class: "ink ink--gold ink--thin", x1: CX, y1: CY }));
    fn(t0 + 4.6, 3, (_, t) => O.forEach((_, i) => {
      const a = (i / O.length) * Math.PI * 2 - Math.PI / 2 + (t - t0 - 4.6) * 0.3;
      const x = CX + Math.cos(a) * R, y = CY + Math.sin(a) * R * 0.78;
      nodes[i].style.setProperty("--x", `${x - 75}px`); nodes[i].style.setProperty("--y", `${y - 42}px`);
      spokes[i].setAttribute("x2", x); spokes[i].setAttribute("y2", y);
    }));
    fn(t0 + 4.5, 3, (_, t) => (s.style.opacity = String(seg(t, t0 + 4.8, 0.6) * (1 - seg(t, t0 + 6, 0.5)))));
    s.style.opacity = "0";
    // as conexões voltam a ser as linhas da lavoura
    const f = svgLayer(el);
    for (let i = -9; i <= 9; i++) ink(path(f, `M${960 + i * 150} 1120 L${960 + i * 16} 760`, "ink ink--gold ink--thin"), t0 + 6.3 + Math.abs(i) * 0.05, 1.4);
    // assinatura final
    const lock = box(el, { x: 0, y: 220, w: 1920, cls: "v-lock" }, logoPrio({ tone: "light", cls: "plogo v-lock__p" }), h("span", { class: "v-lock__x" }, "×"), logoRenowa({ tone: "light", cls: "rlogo v-lock__r" }));
    show(lock, t0 + 6.6, 180, { in: "up" });
    kin(el, "MAIS QUE MARKETING.", { x: 0, y: 430, w: 1920, align: "center", size: 76, cls: "kin--caps kin--ivory", t0: t0 + 7.2 });
    kin(el, h("em", {}, "Uma estrutura completa para sua empresa."), { x: 0, y: 530, w: 1920, align: "center", size: 64, cls: "kin--gold", t0: t0 + 7.8 });
    show(box(el, { x: 0, y: 650, w: 1920, cls: "v-tagline" }, "Cultivando autoridade. Construindo oportunidades."), t0 + 8.2, 180, { in: "up" });
  }
}
