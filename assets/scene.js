/* =========================================================
   RENOWA · CENA 3D DO HERO
   Vórtice de tubos de luz azul (com pulsos de luz laranja) (como a direção de referência)
   e o R da marca extrudado no centro. Tudo procedural.
   ========================================================= */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.querySelector(".hero__canvas");
const hero = document.querySelector(".hero");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

if (!canvas || !supportsWebGL()) document.documentElement.classList.add("no-webgl");
else init();

/* ---------- Material dos tubos: azul profundo, borda luminosa e brilho especular ---------- */
function tubeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color("#05023a") },
      uBlue: { value: new THREE.Color("#1E12EA") },
      uGlow: { value: new THREE.Color("#6A60FF") },
      uPulse: { value: new THREE.Color("#FA4802") },
      uSpec: { value: new THREE.Color("#C9C6FF") },
      uNear: { value: 3.0 },
      uFar: { value: 19.0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying float vDepth; varying vec2 vUv;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = -mv.xyz; vDepth = -mv.z; vUv = uv;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uNear, uFar;
      uniform vec3 uDeep, uBlue, uGlow, uSpec, uPulse;
      varying vec3 vN; varying vec3 vV; varying float vDepth; varying vec2 vUv;
      void main() {
        vec3 N = normalize(vN), V = normalize(vV);
        vec3 L = normalize(vec3(-0.35, 0.75, 0.6));
        float ndv = max(dot(N, V), 0.0);
        float diff = max(dot(N, L), 0.0);
        float fres = pow(1.0 - ndv, 2.2);
        float spec = pow(max(dot(N, normalize(L + V)), 0.0), 70.0);
        float spec2 = pow(max(dot(N, normalize(vec3(0.6, -0.4, 0.7) + V)), 0.0), 30.0);
        // pulso de luz laranja que corre ao longo do tubo (detalhe da marca)
        float pulse = smoothstep(0.92, 1.0, sin(vUv.x * 18.0 - uTime * 1.6) * 0.5 + 0.5) * 0.35;
        vec3 col = uDeep + uBlue * (0.25 + diff * 0.85) + uGlow * fres * 1.1 + uSpec * (spec * 1.1 + spec2 * 0.25) + uPulse * pulse * 1.6;
        float fog = smoothstep(uFar, uNear, vDepth);
        gl_FragColor = vec4(col * fog, 1.0);
      }`,
  });
}

/* ---------- Curvas do vórtice ---------- */
function vortexCurves(count) {
  const curves = [];
  for (let i = 0; i < count; i++) {
    const k = i / (count - 1);
    const r0 = 1.35 + k * 2.6;
    const phase = i * 0.52 + (i % 3) * 0.4;
    const turns = 1.15 + (i % 4) * 0.12;
    const pts = [];
    for (let s = 0; s <= 48; s++) {
      const t = s / 48;
      const a = phase + t * Math.PI * 2 * turns;
      const r = r0 * (0.55 + 0.9 * t * t);
      pts.push(new THREE.Vector3(Math.cos(a) * r * 1.32, Math.sin(a) * r * 0.82, -12 + t * 14.5 - k * 0.6));
    }
    curves.push({ curve: new THREE.CatmullRomCurve3(pts), radius: 0.045 + ((i * 37) % 11) / 11 * 0.14 + k * 0.05 });
  }
  return curves;
}

/* ---------- O R da Renowa (mesmos vértices da logo) ---------- */
function rShapes() {
  const S = 1 / 1060;
  const mk = (pts) => {
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => (i ? s.lineTo((x - 530) * S, (362 - y) * S) : s.moveTo((x - 530) * S, (362 - y) * S)));
    s.closePath();
    return s;
  };
  return [
    mk([[412, 0], [837, 0], [717.6, 210], [547, 210], [255, 723], [1, 723]]),
    mk([[717.6, 210], [970, 210], [1059, 367], [978, 509], [765, 509], [887, 723], [667, 723], [467, 369], [807, 369]]),
  ];
}

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping ?? THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  camera.position.set(0, 0, 9);

  /* Vórtice */
  const vortex = new THREE.Group();
  scene.add(vortex);
  const mat = tubeMaterial();
  const mobile = window.innerWidth < 760;
  vortexCurves(mobile ? 14 : 22).forEach(({ curve, radius }) => {
    const g = new THREE.TubeGeometry(curve, mobile ? 140 : 220, radius, mobile ? 10 : 14, false);
    vortex.add(new THREE.Mesh(g, mat));
  });

  /* R no centro */
  const rGroup = new THREE.Group();
  const geo = new THREE.ExtrudeGeometry(rShapes(), { depth: 0.16, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.012, bevelSegments: 4, curveSegments: 1 });
  geo.translate(0, 0, -0.08);
  const rMat = new THREE.MeshPhysicalMaterial({ color: 0xedf1f9, metalness: 0.15, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.9 });
  const rMesh = new THREE.Mesh(geo, rMat);
  rGroup.add(rMesh);
  rGroup.scale.setScalar(mobile ? 1.15 : 1.5);
  scene.add(rGroup);

  scene.add(new THREE.AmbientLight(0x2a20ff, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-2, 3, 5); scene.add(key);
  const rim = new THREE.PointLight(0x4a3fff, 40, 12); rim.position.set(2.5, -1.5, 2); scene.add(rim);
  const rim2 = new THREE.PointLight(0x1e12ea, 30, 12); rim2.position.set(-3, 1, -1); scene.add(rim2);

  /* Layout: o olho do vórtice à direita no desktop, ao centro-alto no celular */
  let eye = new THREE.Vector2();
  const resize = () => {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const narrow = w < 900;
    eye.set(narrow ? 0.5 : 3.1, narrow ? 2.7 : 1.85);
    vortex.position.set(eye.x, eye.y, 0);
    rGroup.position.set(eye.x, eye.y, 0.4);
    rGroup.scale.setScalar(1.1);
    rGroup.visible = !narrow; // no celular o texto ocupa o topo; o vórtice sozinho basta
  };
  resize();
  window.addEventListener("resize", resize);

  /* Entrada */
  let intro = reduce ? 1 : 0;
  const startIntro = () => {
    if (reduce || !window.gsap) { intro = 1; return; }
    const o = { v: 0 };
    gsap.to(o, { v: 1, duration: 2.6, ease: "expo.out", onUpdate: () => (intro = o.v) });
  };
  if (document.body.classList.contains("is-loading")) window.addEventListener("site:ready", startIntro, { once: true });
  else startIntro();

  /* Mouse e scroll */
  const mouse = new THREE.Vector2(), smooth = new THREE.Vector2();
  window.addEventListener("pointermove", (e) => {
    mouse.set(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
  }, { passive: true });
  let scrollP = 0;
  const readScroll = () => (scrollP = Math.min(1, Math.max(0, window.scrollY / hero.offsetHeight)));
  window.addEventListener("scroll", readScroll, { passive: true });

  /* Só desenha quando o hero está visível */
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);

  const clock = new THREE.Clock();
  const render = () => {
    const t = clock.getElapsedTime();
    smooth.lerp(mouse, 0.05);
    mat.uniforms.uTime.value = t;

    const ease = 1 - Math.pow(1 - intro, 3);
    vortex.rotation.z = (reduce ? 0 : t * 0.05) + scrollP * 1.1 - (1 - ease) * 1.4;
    vortex.scale.setScalar(0.6 + ease * 0.4 + scrollP * 0.5);

    rGroup.rotation.y = (reduce ? -0.25 : Math.sin(t * 0.5) * 0.28) + smooth.x * 0.7 + scrollP * 2.2 - (1 - ease) * 2.5;
    rGroup.rotation.x = (reduce ? 0 : Math.sin(t * 0.37) * 0.08) + smooth.y * 0.45;
    rGroup.position.z = 0.4 + scrollP * 3 - (1 - ease) * 6;

    camera.position.x = smooth.x * 0.8;
    camera.position.y = -smooth.y * 0.5;
    camera.position.z = 9 - scrollP * 4;
    camera.lookAt(eye.x * 0.35, eye.y * 0.35, 0);

    renderer.render(scene, camera);
  };

  if (reduce) {
    render();
    window.addEventListener("resize", render);
    return;
  }
  renderer.setAnimationLoop(() => { if (visible) render(); });
}
