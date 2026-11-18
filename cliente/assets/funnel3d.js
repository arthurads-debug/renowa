// Funil 3D do período: do anúncio ao resultado (Three.js, carregado só quando aparece na tela).
// Cada camada tem o tamanho proporcional à etapa; as taxas de passagem ficam ao lado, em texto.
import { h, int, pct, safeDiv } from "./util.js";

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";
// azuis do mais escuro ao mais claro; a última etapa (o resultado final) sempre em laranja
const BLUES = ["#1E12EA", "#3A2EF5", "#4A3FFF", "#6A5CFF", "#7F74FF", "#8F86FF", "#A39CFF"];
const colorOf = (i, n) => (i === n - 1 ? "#FA4802" : BLUES[Math.min(i, BLUES.length - 1)]);
const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function funnelCard(stages) {
  const steps = stages.filter((s) => s.value > 0);
  if (steps.length < 2) return null;
  const stage = h("div", { class: "f3d__stage" });
  const labels = h("ol", { class: "f3d__labels" }, steps.map((s, i) => h("li", { style: { "--c": colorOf(i, steps.length) }, class: i === steps.length - 1 ? "is-last" : "" },
    h("span", { class: "f3d__name" }, s.label),
    h("strong", {}, int(s.value)),
    s.note ? h("small", {}, s.note) : i ? h("small", {}, `${pct(safeDiv(s.value, steps[i - 1].value), s.value / steps[i - 1].value < 0.01 ? 2 : 1)} de ${steps[i - 1].label.toLowerCase()}`) : h("small", {}, "topo do funil"))));
  const box = h("section", { class: "card f3d" },
    h("header", { class: "card__head" }, h("div", {}, h("h2", { class: "card__title" }, "Do anúncio ao resultado"), h("p", { class: "card__sub" }, "Cada etapa mostra quantas pessoas seguiram para a próxima · gire com o mouse ou o dedo"))),
    h("div", { class: "f3d__body" }, stage, labels));

  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    mount(stage, steps).catch(() => stage.classList.add("is-flat"));
  }, { threshold: 0.2 });
  requestAnimationFrame(() => io.observe(stage));
  return box;
}

async function mount(stage, steps) {
  const THREE = await import(THREE_URL);
  const W = () => stage.clientWidth, H = () => stage.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.setSize(W(), H());
  stage.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, W() / H(), 0.1, 100);
  camera.position.set(0, 2.4, 9.8);
  camera.lookAt(0, -0.2, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1b1550, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xfa4802, 1.2); rim.position.set(-5, -2, -4); scene.add(rim);

  // raio de cada camada ∝ raiz da proporção (áreas comparáveis, sem sumir nas etapas pequenas)
  const max = steps[0].value;
  const rad = steps.map((s) => 0.7 + 1.45 * Math.cbrt(s.value / max));
  for (let i = 1; i < rad.length; i++) rad[i] = Math.min(rad[i], rad[i - 1] * 0.94); // sempre afunilando
  rad.push(rad[rad.length - 1] * 0.7);
  const group = new THREE.Group();
  const layerH = Math.min(0.86, 5 / steps.length), gap = Math.min(0.12, layerH * 0.14), total = steps.length * (layerH + gap);
  const layers = steps.map((s, i) => {
    const geo = new THREE.CylinderGeometry(rad[i], rad[i + 1], layerH, 64, 1, false);
    const col = new THREE.Color(colorOf(i, steps.length));
    const mat = new THREE.MeshPhysicalMaterial({ color: col, emissive: col, emissiveIntensity: 0.28, roughness: 0.3, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.25, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = total / 2 - i * (layerH + gap) - layerH / 2;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rad[i] + 0.02, 0.018, 8, 96), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = layerH / 2;
    mesh.add(ring);
    mesh.scale.set(0.001, 0.001, 0.001);
    group.add(mesh);
    return mesh;
  });
  scene.add(group);

  // partículas descendo: o "fluxo" de pessoas pelo funil
  const N = 120, pts = new Float32Array(N * 3), speed = new Float32Array(N);
  for (let i = 0; i < N; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 1.8; pts[i * 3] = Math.cos(a) * r; pts[i * 3 + 1] = Math.random() * total - total / 2; pts[i * 3 + 2] = Math.sin(a) * r; speed[i] = 0.4 + Math.random() * 0.8; }
  const pgeo = new THREE.BufferGeometry(); pgeo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
  const particles = new THREE.Points(pgeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.7 }));
  group.add(particles);

  // arrastar para girar
  let rotY = -0.5, velY = 0.004, dragging = false, lastX = 0;
  const el = renderer.domElement;
  el.style.touchAction = "pan-y";
  el.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; el.setPointerCapture(e.pointerId); });
  el.addEventListener("pointermove", (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; rotY += dx * 0.01; velY = dx * 0.0008; });
  el.addEventListener("pointerup", () => { dragging = false; });

  const t0 = performance.now();
  let visible = true, raf = 0;
  new IntersectionObserver((en) => { visible = en.some((x) => x.isIntersecting); if (visible && !raf) raf = requestAnimationFrame(tick); }).observe(stage);
  new ResizeObserver(() => { if (!W()) return; renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); }).observe(stage);

  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  function tick(now) {
    raf = 0;
    if (!stage.isConnected) return; // volta a girar quando o cartão reaparecer
    const t = (now - t0) / 1000;
    layers.forEach((m, i) => { const k = reduce() ? 1 : ease((t - i * 0.18) / 0.9); m.scale.set(k, k, k); });
    if (!dragging && !reduce()) { velY += (0.004 - velY) * 0.02; rotY += velY; }
    group.rotation.y = rotY;
    group.position.y = reduce() ? 0 : Math.sin(t * 0.8) * 0.06;
    const p = pgeo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      p[i * 3 + 1] -= speed[i] * 0.012;
      if (p[i * 3 + 1] < -total / 2) p[i * 3 + 1] = total / 2;
      const yy = (total / 2 - p[i * 3 + 1]) / total; // 0 topo → 1 base
      const idx = Math.min(steps.length - 1, Math.floor(yy * steps.length));
      const r = rad[idx] * 0.85, a = Math.atan2(p[i * 3 + 2], p[i * 3]);
      const cur = Math.hypot(p[i * 3], p[i * 3 + 2]);
      if (cur > r) { p[i * 3] = Math.cos(a) * r; p[i * 3 + 2] = Math.sin(a) * r; }
    }
    pgeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    if (visible) raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
}
