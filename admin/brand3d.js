// "R" da Renowa em 3D (Three.js): o símbolo da marca extrudado, girando devagar,
// com brilho azul, um detalhe laranja e partículas. Carrega só quando aparece na tela.
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";
const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Os dois polígonos do símbolo (mesmo desenho do logo, viewBox 1060 × 724)
const PARTS = [
  [[412, 0], [837, 0], [717.6, 210], [547, 210], [255, 723], [1, 723]],
  [[717.6, 210], [970, 210], [1059, 367], [978, 509], [765, 509], [887, 723], [667, 723], [467, 369], [807, 369]],
];

export function mountBrand3D(el, { intensity = 1, interactive = true } = {}) {
  if (!el || el._brand3d) return;
  el._brand3d = true;
  const io = new IntersectionObserver((en) => {
    if (!en.some((e) => e.isIntersecting)) return;
    io.disconnect();
    start(el, intensity, interactive).catch(() => el.classList.add("is-flat"));
  }, { threshold: 0.05 });
  io.observe(el);
}

async function start(el, intensity, interactive) {
  const THREE = await import(THREE_URL);
  const W = () => el.clientWidth || 1, H = () => el.clientHeight || 1;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.setSize(W(), H());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  el.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, W() / H(), 0.1, 100);
  camera.position.set(0, 0, 9);

  scene.add(new THREE.AmbientLight(0x8a86ff, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3, 4, 6); scene.add(key);
  const rim = new THREE.PointLight(0xfa4802, 30 * intensity, 12); rim.position.set(-3, -2, 2); scene.add(rim);
  const fill = new THREE.PointLight(0x4a3fff, 40 * intensity, 14); fill.position.set(3, 1, 3); scene.add(fill);

  // símbolo extrudado
  const s = 1 / 260; // 1060 px → ~4 unidades
  const geos = PARTS.map((pts) => {
    const shape = new THREE.Shape();
    pts.forEach(([x, y], i) => (i ? shape.lineTo(x * s, -y * s) : shape.moveTo(x * s, -y * s)));
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.045, bevelSegments: 4 });
  });
  const mat = new THREE.MeshPhysicalMaterial({ color: 0x1e12ea, emissive: 0x1e12ea, emissiveIntensity: 0.35, metalness: 0.35, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15 });
  const logo = new THREE.Group();
  geos.forEach((g) => logo.add(new THREE.Mesh(g, mat)));
  // contorno fino iluminado
  geos.forEach((g) => logo.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 25), new THREE.LineBasicMaterial({ color: 0x9d97ff, transparent: true, opacity: 0.35 }))));
  const box = new THREE.Box3().setFromObject(logo);
  const c = box.getCenter(new THREE.Vector3());
  logo.children.forEach((m) => m.position.sub(c));
  const pivot = new THREE.Group();
  pivot.add(logo);
  scene.add(pivot);

  // anel de partículas
  const N = 260, pos = new Float32Array(N * 3), seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, r = 2.9 + Math.sin(i * 12.9898) * 0.35;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = Math.sin(i * 78.233) * 0.5; pos[i * 3 + 2] = Math.sin(a) * r;
    seeds[i] = (i * 0.618) % 1;
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const ring = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xbfc4ff, size: 0.035, transparent: true, opacity: 0.8 }));
  ring.rotation.x = 0.35;
  scene.add(ring);
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfa4802 }));
  scene.add(spark);

  // mouse: inclina de leve na direção do cursor
  let tx = 0, ty = 0, mx = 0, my = 0;
  if (interactive) {
    const host = el.closest("[data-3d-host]") || el;
    host.addEventListener("pointermove", (e) => {
      const r = host.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 0.6;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 0.4;
    });
    host.addEventListener("pointerleave", () => { tx = 0; ty = 0; });
  }

  // afasta a câmera quando a área é estreita, para o símbolo (e o anel) caberem inteiros
  const fit = () => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.position.z = Math.max(9, 9.4 / camera.aspect); camera.updateProjectionMatrix(); };
  fit();
  new ResizeObserver(fit).observe(el);
  let visible = true, raf = 0;
  new IntersectionObserver((en) => { visible = en.some((x) => x.isIntersecting); if (visible && !raf) raf = requestAnimationFrame(tick); }).observe(el);

  const t0 = performance.now();
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 4);
  function tick(now) {
    raf = 0;
    if (!el.isConnected) return;
    const t = (now - t0) / 1000;
    const still = reduce();
    const k = still ? 1 : ease(t / 1.6);
    pivot.scale.setScalar(0.6 + 0.4 * k);
    mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
    pivot.rotation.y = (still ? -0.35 : Math.sin(t * 0.45) * 0.55 - (1 - k) * 1.2) + mx;
    pivot.rotation.x = (still ? 0.1 : Math.sin(t * 0.3) * 0.12) + my;
    pivot.position.y = still ? 0 : Math.sin(t * 0.9) * 0.06;
    ring.rotation.y = still ? 0 : t * 0.12;
    const a = still ? 0.6 : t * 0.8;
    spark.position.set(Math.cos(a) * 2.9, Math.sin(a * 1.3) * 0.35, Math.sin(a) * 2.9).applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.35);
    rim.position.copy(spark.position).multiplyScalar(0.8);
    renderer.render(scene, camera);
    if (visible && !still) raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
}
