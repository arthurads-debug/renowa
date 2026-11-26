// Gera output/legendas.srt e output/legendas.vtt a partir do roteiro (proj/roteiro.js).
// Sem a narração gravada, cada frase ocupa um tempo proporcional ao tamanho dentro da sua cena.
// Com a narração: passe a transcrição palavra a palavra do ElevenLabs (JSON com words[{text,start,end}])
// como argumento e as legendas seguem a voz real:  node scripts/legendas.mjs transcricao.json
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { CENAS, NARRADA, ATRASO_VOZ, DURACAO } from "../proj/roteiro.js";
import { existsSync } from "node:fs";

const ts = (s, sep) => { const ms = Math.round(s * 1000); const h = Math.floor(ms / 3.6e6), m = Math.floor(ms / 6e4) % 60, sec = Math.floor(ms / 1000) % 60, r = ms % 1000; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}${sep}${String(r).padStart(3, "0")}`; };
const frases = (t) => t.match(/[^.!?:]+[.!?:]+/g)?.map((x) => x.trim()) || [t];
// quebra frases longas em pedaços de até ~70 caracteres
const pedacos = (f) => { if (f.length <= 74) return [f]; const w = f.split(" "); const out = []; let cur = ""; for (const x of w) { if ((cur + " " + x).trim().length > 70) { out.push(cur.trim()); cur = x; } else cur += " " + x; } if (cur.trim()) out.push(cur.trim()); return out; };

let cues = [];
const tr = process.argv[2] ? JSON.parse(readFileSync(process.argv[2], "utf8")) : null;
if (tr?.words) {
  // agrupa palavras reais em legendas de até ~70 caracteres ou na pontuação
  let cur = [];
  for (const w of tr.words.filter((x) => x.type !== "spacing")) {
    cur.push(w);
    const txt = cur.map((x) => x.text).join(" ");
    if (/[.!?:]$/.test(w.text) || txt.length > 66) { cues.push({ a: cur[0].start, b: w.end, t: txt }); cur = []; }
  }
  if (cur.length) cues.push({ a: cur[0].start, b: cur.at(-1).end, t: cur.map((x) => x.text).join(" ") });
} else {
  // tempos reais: cada cena começa quando a voz começa o assunto; frases encaixadas nas pausas medidas no áudio
  const pausas = existsSync(new URL("../audio/pausas.txt", import.meta.url)) ? readFileSync(new URL("../audio/pausas.txt", import.meta.url), "utf8").trim().split("\n").map((l) => +l.split(" ")[0] + ATRASO_VOZ) : [];
  const ini = CENAS.map((_, i) => (i === 0 ? ATRASO_VOZ : NARRADA[i] + 0.3));
  CENAS.forEach((c, i) => {
    const a = ini[i], b = (i + 1 < CENAS.length ? ini[i + 1] - 0.5 : Math.min(DURACAO - 2, 154.2));
    const parts = frases(c.narracao).flatMap(pedacos);
    const total = parts.reduce((s, p) => s + p.length, 0);
    let t = a, acc = 0;
    parts.forEach((p, k) => {
      acc += p.length;
      let end = a + (acc / total) * (b - a);
      if (k < parts.length - 1 && /[.!?:]$/.test(p)) { const near = pausas.filter((x) => x > t + 0.8 && x < b).sort((x, y) => Math.abs(x - end) - Math.abs(y - end))[0]; if (near && Math.abs(near - end) < 2.5) end = near - 0.25; }
      cues.push({ a: t, b: k === parts.length - 1 ? b : end, t: p });
      t = end + 0.05;
    });
  });
}
mkdirSync(new URL("../output/", import.meta.url), { recursive: true });
const srt = cues.map((c, i) => `${i + 1}\n${ts(c.a, ",")} --> ${ts(c.b, ",")}\n${c.t}\n`).join("\n");
const vtt = "WEBVTT\n\n" + cues.map((c) => `${ts(c.a, ".")} --> ${ts(c.b, ".")}\n${c.t}\n`).join("\n");
writeFileSync(new URL("../output/legendas.srt", import.meta.url), srt);
writeFileSync(new URL("../output/legendas.vtt", import.meta.url), vtt);
console.log(`${cues.length} legendas · ${tr ? "pela narração real" : "pelos tempos do roteiro"}`);
