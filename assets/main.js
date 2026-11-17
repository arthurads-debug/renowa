/* =========================================================
   RENOWA · CONFIGURAÇÃO
   ========================================================= */
window.RENOWA = {
  whatsapp: "5511900000000",  // DDI + DDD + número, só dígitos (provisório)
  formEndpoint: "/api/lead",  // CRM do próprio site (aba Leads do /admin). Sem servidor, entra em modo demonstração.
  instagram: "https://instagram.com/", // perfil da Renowa (provisório)
};

(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  $$("[data-whatsapp]").forEach((a) => {
    a.href = `https://wa.me/${window.RENOWA.whatsapp}`;
    a.target = "_blank";
    a.rel = "noopener";
  });

  /* =========================================================
     PROPOSTA PERSONALIZADA
     Link para o lead: /?para=Nome%20da%20Empresa&nome=Contato
     ========================================================= */
  const params = new URLSearchParams(location.search);
  const clean = (v, max) => String(v || "").replace(/[<>{}]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
  const company = clean(params.get("para"), 60);
  const person = clean(params.get("nome"), 30).split(" ")[0];
  window.RENOWA.lead = { company, person };
  if (company) {
    $$("[data-company], [data-company-short], [data-company-inline]").forEach((el) => (el.textContent = company));
    const g = $("[data-greeting]");
    if (g) g.textContent = person ? `${person}, esta proposta foi preparada para a ${company}` : `Proposta preparada para a ${company}`;
    document.title = `Proposta Renowa · ${company}`;
  }
  const today = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  $$("[data-today]").forEach((el) => (el.textContent = today));

  /* ---------- Capítulos: sumário da capa, índice lateral e menu ---------- */
  const chapters = $$("[data-chapter]").map((sec) => ({ sec, num: sec.dataset.chapter, title: sec.dataset.chapterTitle, id: sec.id }));
  const link = (c) => {
    const a = document.createElement("a");
    a.href = `#${c.id}`;
    const n = document.createElement("span");
    n.textContent = c.num;
    a.append(n, document.createTextNode(" " + c.title));
    return a;
  };
  const toc = $(".toc"), railList = $(".rail__list"), mlist = $(".menu-mobile__list");
  chapters.forEach((c) => {
    if (c.num !== "00" && toc) { const li = document.createElement("li"); li.append(link(c)); toc.append(li); }
    if (railList) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${c.id}`;
      a.setAttribute("aria-label", `${c.num} ${c.title}`);
      a.dataset.num = c.num;
      a.textContent = c.num;
      const t = document.createElement("span");
      t.textContent = c.title;
      a.append(t);
      li.append(a);
      railList.append(li);
    }
    if (mlist) { const li = document.createElement("li"); li.append(link(c)); mlist.append(li); }
  });

  /* ---------- 03 · Escopo: o lead monta e leva para o questionário ---------- */
  const scopeItems = $$(".scope [data-scope]");
  const scopeBtn = $("[data-apply-scope]");
  const updateScope = () => {
    const n = scopeItems.filter((i) => i.getAttribute("aria-pressed") === "true").length;
    $("[data-scope-count]").textContent = n;
    $("[data-scope-label]").textContent = n === 1 ? "frente no seu escopo" : "frentes no seu escopo";
    if (scopeBtn) scopeBtn.disabled = !n;
  };
  scopeItems.forEach((item) => {
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.setAttribute("aria-pressed", "false");
    const toggle = () => { item.setAttribute("aria-pressed", item.getAttribute("aria-pressed") === "true" ? "false" : "true"); updateScope(); };
    item.addEventListener("click", toggle);
    item.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  });
  scopeBtn?.addEventListener("click", () => {
    const servicos = scopeItems.filter((i) => i.getAttribute("aria-pressed") === "true").map((i) => i.dataset.scope);
    window.RenowaQuiz?.open({ servicos });
  });
  if (scopeItems.length) updateScope();

  /* ---------- 02 · Ecossistema: as 12 áreas se ligam entre si e depois à marca ---------- */
  const ecoBox = $(".eco");
  const ecoSvg = $(".eco__lines");
  let ecoNet = null;
  if (ecoBox && ecoSvg) {
    const NS = "http://www.w3.org/2000/svg";
    const nodes = $$(".eco__node", ecoBox);
    const core = $(".eco__core", ecoBox);
    const N = nodes.length;
    const group = () => ecoSvg.appendChild(document.createElementNS(NS, "g"));
    const gChord = group(), gRing = group(), gSpoke = group();
    const path = (g, cls) => { const p = document.createElementNS(NS, "path"); p.setAttribute("class", cls); g.append(p); return p; };
    const links = [];
    // rede: cada área com a vizinha (anel) e com a que está a 4 posições (triângulos por dentro)
    for (let i = 0; i < N; i++) links.push({ kind: "ring", a: i, b: (i + 1) % N, el: path(gRing, "l-ring" + (i === N - 1 ? " l-wrap" : "")) });
    for (let i = 0; i < N; i++) links.push({ kind: "chord", a: i, b: (i + 4) % N, el: path(gChord, "l-chord") });
    // raios: de cada área até a marca (o fluxo laranja corre em direção ao R)
    for (let i = 0; i < N; i++) {
      const el = path(gSpoke, "l-spoke"), flow = path(gSpoke, "l-flow");
      flow.style.animationDelay = `${-i * 0.37}s`;
      links.push({ kind: "spoke", a: i, b: -1, el, flow });
    }
    let drawn = false;
    const centerOf = (el, box) => { const r = el.getBoundingClientRect(); return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2]; };
    const layout = () => {
      const box = ecoBox.getBoundingClientRect();
      ecoSvg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      const pts = nodes.map((n) => centerOf(n, box));
      const c = centerOf(core, box);
      links.forEach((l) => {
        const [ax, ay] = pts[l.a];
        const [bx, by] = l.b < 0 ? c : pts[l.b];
        const d = `M${ax.toFixed(1)} ${ay.toFixed(1)} L${bx.toFixed(1)} ${by.toFixed(1)}`;
        l.el.setAttribute("d", d);
        if (l.flow) l.flow.setAttribute("d", d);
        l.len = l.el.getTotalLength() || 1;
        if (!drawn) { l.el.style.strokeDasharray = l.len; l.el.style.strokeDashoffset = l.len; }
      });
    };
    const finish = () => {
      drawn = true;
      links.forEach((l) => { l.el.style.strokeDasharray = ""; l.el.style.strokeDashoffset = ""; });
      ecoBox.classList.add("is-live");
    };
    // passar o mouse numa área acende as ligações dela
    nodes.forEach((n, i) => {
      const mine = links.filter((l) => l.a === i || l.b === i);
      n.addEventListener("mouseenter", () => { mine.forEach((l) => l.el.classList.add("l-hot")); });
      n.addEventListener("mouseleave", () => { mine.forEach((l) => l.el.classList.remove("l-hot")); });
    });
    layout();
    new ResizeObserver(() => layout()).observe(ecoBox);
    ecoNet = {
      show() { layout(); finish(); },
      play() {
        layout();
        const ping = $(".eco__ping", ecoBox);
        const by = (k) => links.filter((l) => l.kind === k);
        const tl = gsap.timeline({ onComplete: finish });
        // 1) a marca aparece; as áreas surgem em volta, uma a uma
        tl.fromTo(core, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: "expo.out" })
          .fromTo(nodes, { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 0.55, stagger: 0.07, ease: "back.out(1.7)", clearProps: "transform" }, 0.15);
        // 2) cada área se liga à próxima, em corrente
        by("ring").forEach((l, i) => {
          tl.to(l.el, { strokeDashoffset: 0, duration: 0.32, ease: "power1.inOut" }, 0.7 + i * 0.1);
          tl.to(nodes[l.b], { borderColor: "#FA4802", duration: 0.15, yoyo: true, repeat: 1 }, 0.7 + i * 0.1 + 0.25);
        });
        // 3) a rede se fecha por dentro
        by("chord").forEach((l, i) => tl.to(l.el, { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" }, 2.0 + i * 0.04));
        // 4) todas se ligam à marca; o R pulsa quando recebe
        by("spoke").forEach((l, i) => tl.to(l.el, { strokeDashoffset: 0, duration: 0.55, ease: "power2.in" }, 2.5 + i * 0.05));
        tl.fromTo(ping, { scale: 1, opacity: 0.9 }, { scale: 2.3, opacity: 0, duration: 1.1, ease: "expo.out" }, 3.62)
          .fromTo(core, { scale: 1 }, { scale: 1.12, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" }, 3.58)
          .add(() => ecoBox.classList.add("is-live"), 3.62)
          .fromTo(ping, { scale: 1, opacity: 0.5 }, { scale: 1.9, opacity: 0, duration: 1.2, ease: "expo.out" }, 3.95);
      },
    };
  }

  /* ---------- Atalho do administrador (só aparece para quem entrou no /admin) ---------- */
  let adminFlag = null;
  try { adminFlag = localStorage.getItem("renowa-admin"); } catch { /* sem storage */ }
  if (adminFlag) {
    fetch("/api/admin/me", { credentials: "same-origin" }).then((r) => {
      if (!r.ok) { try { localStorage.removeItem("renowa-admin"); } catch { /* */ } return; }
      const bar = document.createElement("nav");
      bar.className = "admin-pill";
      bar.setAttribute("aria-label", "Atalhos do administrador");
      bar.innerHTML = '<span class="admin-pill__tag">Admin</span><a href="/admin/#leads">Leads</a><a href="/admin/#clientes">Clientes</a><button type="button" aria-label="Esconder atalhos">×</button>';
      bar.querySelector("button").addEventListener("click", () => bar.remove());
      document.body.append(bar);
    }).catch(() => {});
  }

  /* ---------- 01 · Vídeo-manifesto 9:16 ---------- */
  const reel = $(".reel");
  if (reel) {
    const video = $(".reel__video", reel);
    const play = $(".reel__play", reel);
    const status = $(".reel__status", reel);
    const src = video.querySelector("source").getAttribute("src");
    fetch(src, { method: "HEAD" }).then((r) => {
      if (!r.ok) throw new Error("sem vídeo");
      video.hidden = false;
      reel.classList.add("has-video");
    }).catch(() => {
      play.disabled = true;
      play.setAttribute("aria-label", "Vídeo em produção");
      status.textContent = "em produção · em breve";
    });
    play.addEventListener("click", () => {
      if (play.disabled) return;
      reel.classList.add("is-playing");
      video.controls = true;
      video.muted = false;
      video.play().catch(() => {});
    });
    video.addEventListener("ended", () => { reel.classList.remove("is-playing"); video.controls = false; });
  }

  const preloader = $(".preloader");
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove("js");
    preloader?.remove();
    document.body.classList.remove("is-loading");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (reduce) root.classList.add("reduce");

  /* ---------- Scroll suave ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    window.lenis = lenis;
  }

  /* ---------- Menu mobile ---------- */
  const burger = $(".nav__burger");
  const menu = $("#menu-mobile");
  const openMenu = () => {
    menu.hidden = false;
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Fechar menu");
    lenis?.stop();
    gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: reduce ? 0 : 0.4, ease: "power2.out" });
    gsap.fromTo($$("li, .btn", menu), { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, duration: 0.7, delay: 0.1, ease: "expo.out" });
  };
  const closeMenu = () => {
    if (menu.hidden) return;
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Abrir menu");
    lenis?.start();
    gsap.to(menu, { opacity: 0, duration: reduce ? 0 : 0.3, onComplete: () => (menu.hidden = true) });
  };
  burger?.addEventListener("click", () => (menu.hidden ? openMenu() : closeMenu()));
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());
  window.addEventListener("renowa:apply", closeMenu);

  /* ---------- Âncoras ---------- */
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { duration: 1.4 });
      else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    })
  );

  /* ---------- Header ---------- */
  const header = $("[data-header]");
  const lightSections = $$(".section--light");
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    header.classList.toggle("is-hidden", menu.hidden && y > 500 && y > lastY + 2);
    if (y < lastY - 2 || y < 500) header.classList.remove("is-hidden");
    lastY = y;
    header.classList.toggle("is-light", lightSections.some((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= 38 && r.bottom >= 38;
    }));
  };
  if (lenis) lenis.on("scroll", onScroll);
  else window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Capítulo atual (cabeçalho, índice lateral e barra de leitura) ---------- */
  const railEl = $(".rail");
  const curNum = $("[data-current-num]"), curTitle = $("[data-current-title]");
  const readbar = $(".readbar span");
  let lastChap = null;
  const onChapter = () => {
    const probe = window.innerHeight * 0.4;
    let cur = chapters[0];
    for (const c of chapters) if (c.sec.getBoundingClientRect().top <= probe) cur = c;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (readbar) readbar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    railEl?.classList.toggle("is-on", cur.num !== "00");
    railEl?.classList.toggle("is-light", cur.sec.classList.contains("section--light"));
    if (cur === lastChap) return;
    lastChap = cur;
    curNum.textContent = cur.num;
    curTitle.textContent = cur.title;
    $$(".rail a").forEach((a) => a.setAttribute("aria-current", String(a.dataset.num === cur.num)));
  };
  if (lenis) lenis.on("scroll", onChapter);
  else window.addEventListener("scroll", onChapter, { passive: true });
  onChapter();

  /* =========================================================
     ENTRADA
     ========================================================= */
  const heroIntro = () =>
    gsap.timeline({ defaults: { ease: "expo.out" } })
      .to(".hero__title .line > span", { y: 0, duration: 1.4, stagger: 0.1 })
      .to("[data-hero-fade]", { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: "power3.out" }, 0.25)
      .from(".nav > *", { y: -16, opacity: 0, duration: 0.9, stagger: 0.05 }, 0.15);

  const finishLoading = () => {
    document.body.classList.remove("is-loading");
    lenis?.start();
    window.dispatchEvent(new Event("site:ready"));
  };

  if (reduce) {
    ecoNet?.show();
    preloader?.remove();
    gsap.set(".hero__title .line > span, [data-hero-fade]", { clearProps: "all" });
    finishLoading();
  } else {
    gsap.timeline({ onComplete: () => preloader.remove() })
      .from(".pr-a", { xPercent: -50, yPercent: 40, opacity: 0, duration: 0.9, ease: "expo.out" }, 0)
      .from(".pr-b", { xPercent: 50, yPercent: -40, opacity: 0, duration: 0.9, ease: "expo.out" }, 0.1)
      .to(".preloader__bar span", { scaleX: 1, duration: 1.1, ease: "power2.inOut" }, 0)
      .to(".preloader__r", { scale: 10, opacity: 0, duration: 0.9, ease: "expo.in" }, "+=0.05")
      .to(".preloader__bar", { opacity: 0, duration: 0.3 }, "<")
      .to(preloader, { opacity: 0, duration: 0.5, onStart: finishLoading }, "-=0.2")
      .add(heroIntro(), "-=0.5");
  }

  /* =========================================================
     SCROLL
     ========================================================= */
  const mm = gsap.matchMedia();

  // 02 · Ecossistema. Desktop: anel que se liga e depois liga tudo ao R.
  // Celular: a linha central cresce com a rolagem e conecta cada área; no fim, o fluxo sobe até a marca.
  if (ecoNet) {
    mm.add("(prefers-reduced-motion: no-preference) and (min-width: 901px)", () => {
      gsap.set([".eco__core", ".eco__node"], { opacity: 0 });
      ScrollTrigger.create({ trigger: ".eco", start: "top 65%", once: true, onEnter: () => ecoNet.play() });
    });
    mm.add("(prefers-reduced-motion: no-preference) and (max-width: 900px)", () => {
      const box = $(".eco"), list = $(".eco__nodes", box), ping = $(".eco__ping", box);
      box.classList.remove("is-live");
      gsap.fromTo([".eco__core", ".eco__head"], { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.9, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: box, start: "top 82%", once: true } });
      gsap.fromTo(list, { "--grow": 0 }, { "--grow": 1, ease: "none", scrollTrigger: { trigger: list, start: "top 70%", end: "bottom 70%", scrub: 0.5 } });
      $$(".eco__node, .eco__end", list).forEach((row) => {
        const end = row.classList.contains("eco__end");
        const tl = gsap.timeline({ paused: true })
          .fromTo(row, { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 0.6, ease: "expo.out" }, 0)
          .fromTo(row.querySelector(end ? ".eco__end-dot" : ".eco__n"), { scale: 0 }, { scale: 1, duration: 0.45, ease: "back.out(2.2)" }, 0)
          .fromTo(row, { "--link": 0 }, { "--link": 1, duration: 0.35, ease: "power2.out" }, 0.12);
        if (end) tl.fromTo(ping, { scale: 1, opacity: 0.9 }, { scale: 2.2, opacity: 0, duration: 1.1, ease: "expo.out" }, 0.1);
        ScrollTrigger.create({
          trigger: row, start: "center 70%",
          onEnter: () => { row.classList.add("is-on"); tl.play(); if (end) box.classList.add("is-live"); },
          onLeaveBack: () => { row.classList.remove("is-on"); tl.reverse(); if (end) box.classList.remove("is-live"); },
        });
      });
      return () => box.classList.add("is-live");
    });
  }

  ScrollTrigger.batch("[data-reveal]", {
    start: "top 88%",
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08, ease: "expo.out" }),
  });

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.to(".hero__inner", { yPercent: -12, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "25% top", end: "80% top", scrub: true } });
    gsap.to(".cover__toc, .cover__top", { opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "10% top", end: "40% top", scrub: true } });
    gsap.fromTo(".apply__a", { xPercent: -16, yPercent: 10 }, { xPercent: 4, yPercent: -4, ease: "none", scrollTrigger: { trigger: ".apply", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.fromTo(".apply__b", { xPercent: 18, yPercent: -10 }, { xPercent: -2, yPercent: 6, ease: "none", scrollTrigger: { trigger: ".apply", start: "top bottom", end: "bottom top", scrub: true } });

    // Serviços: cada linha entra com um leve deslize
    $$(".svc").forEach((row) => gsap.from(row, { x: -24, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: row, start: "top 90%", once: true } }));

    gsap.from(".compare__row", { x: -16, opacity: 0, duration: 0.8, stagger: 0.06, ease: "expo.out", scrollTrigger: { trigger: ".compare", start: "top 85%", once: true } });

    // Painel: barras crescem
    gsap.from(".bars span", { scaleY: 0, duration: 1.2, stagger: 0.05, ease: "expo.out", scrollTrigger: { trigger: ".dash", start: "top 75%", once: true } });
  });

  gsap.to(".apply__title .line > span", {
    y: 0, duration: reduce ? 0 : 1.3, stagger: 0.1, ease: "expo.out",
    scrollTrigger: { trigger: ".apply__title", start: "top 85%", once: true },
  });

  // Frase do problema acende palavra por palavra
  $$("[data-split-words]").forEach((el) => {
    const wrap = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.append(" ");
            else { const s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.append(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrap(n);
      });
    };
    wrap(el);
    if (reduce) return;
    gsap.fromTo($$(".w", el), { opacity: 0.14 }, {
      opacity: 1, stagger: 0.06, ease: "none",
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 55%", scrub: true },
    });
  });

  // Contadores
  const fmt = (v, d) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
  $$("[data-count]").forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    if (reduce) { el.textContent = fmt(end, dec); return; }
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 2, ease: "expo.out", onUpdate: () => (el.textContent = fmt(o.v, dec)) }),
    });
  });

  // Processo: linha de progresso
  gsap.to(".steps__line span", { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".steps", start: "top 75%", end: "bottom 45%", scrub: true } });

  // Logo do rodapé
  if (!reduce) {
    const fw = $(".footer__word");
    gsap.timeline({ scrollTrigger: { trigger: fw, start: "top 92%", once: true } })
      .from($(".logo__icon", fw), { xPercent: -30, opacity: 0, duration: 1.2, ease: "expo.out" })
      .fromTo($(".logo__word", fw), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "expo.inOut" }, 0.1);
  }

  /* ---------- FAQ com altura animada ---------- */
  $$(".faq__item").forEach((d) => {
    const ans = $(".faq__a", d);
    $("summary", d).addEventListener("click", (e) => {
      e.preventDefault();
      if (d.open) {
        gsap.to(ans, { height: 0, duration: reduce ? 0 : 0.4, ease: "power2.inOut", onComplete: () => { d.open = false; ans.style.height = ""; } });
      } else {
        d.open = true;
        gsap.fromTo(ans, { height: 0 }, { height: "auto", duration: reduce ? 0 : 0.6, ease: "expo.out", clearProps: "height", onComplete: () => ScrollTrigger.refresh() });
      }
    });
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
})();
