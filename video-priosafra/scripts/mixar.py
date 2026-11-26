"""Mixa a narração com os efeitos sonoros e confere que nenhum efeito fica mais alto que a voz.

Regras de volume:
  1. cada efeito é normalizado para pico de -26 dBFS (bem abaixo da voz, que fica em torno de -3 dBFS de pico);
  2. a trilha de efeitos passa por sidechain: quando a voz fala, os efeitos abaixam ainda mais;
  3. no fim, mede janela a janela (200 ms) e falha se algum efeito passar da voz.
uso: python3 scripts/mixar.py   → audio/mix-final.wav + relatório
"""
import json, math, os, struct, subprocess, sys

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FF = "/opt/homebrew/bin/ffmpeg"
DUR = 157.0
ATRASO = 0.8  # a voz entra em 0,8 s

# Tempos de AUTORIA (iguais aos das animações em proj/*.js); convertidos para o tempo real por unwarp.
A = [0, 14, 28, 47, 63, 82, 101, 119, 132, 152, 168, 180]
N = [0, 12.9, 25.98, 39.16, 53.14, 68.78, 83.85, 98.11, 110.3, 126.67, 139.38, 157]
def real(a):
    for i in range(len(A) - 1):
        if a < A[i + 1] or i == len(A) - 2:
            return N[i] + (a - A[i]) * (N[i + 1] - N[i]) / (A[i + 1] - A[i])

# (efeito, tempo de autoria, ganho extra em dB)
CUES = [
    ("traco", 0.4, 0), ("traco", 2.6, -2), ("traco", 4.6, -1), ("traco", 8.9, 0),
    ("whoosh", 14, 0), ("pop", 14.4, -3), ("pop", 15.1, -4), ("pop", 15.8, -4), ("traco", 19.4, -3),
    ("whoosh", 28, 0), ("traco", 28.2, -1), ("whoosh", 33, -4), ("pop", 35.4, -4), ("pop", 36.5, -5), ("pop", 37.6, -5), ("pop", 38.7, -5), ("whoosh", 41, -2),
    ("whoosh", 47, 0), ("traco", 47.4, -2), ("traco", 48.5, -3), ("traco", 49.6, -3), ("traco", 50.7, -3), ("pop", 54.2, -5), ("pop", 55.5, -5), ("pop", 56.8, -5), ("contador", 58.8, -2),
    ("whoosh", 63, 0), ("traco", 63.2, -1), ("pop", 71.2, -2), ("whoosh", 75, -2),
    ("whoosh", 82, 0), ("digitacao", 83.6, -6), ("pop", 84.6, -4), ("pop", 86.6, -4), ("digitacao", 87.4, -6), ("pop", 88.4, -4), ("pop", 90.0, -4), ("traco", 94.0, -2), ("notificacao", 95.1, 0),
    ("whoosh", 101, 0), ("traco", 103.0, -3), ("traco", 105.0, -2), ("pop", 106.4, -5), ("pop", 107.0, -5), ("pop", 107.6, -5),
    ("whoosh", 119, 0), ("traco", 119.6, -3), ("pop", 120.0, -4), ("pop", 121.7, -4), ("pop", 123.4, -4), ("pop", 125.1, -4), ("pop", 126.8, -4), ("pop", 128.5, -4),
    ("whoosh", 132, 0), ("traco", 132.6, -2), ("contador", 135.0, -2), ("notificacao", 143.4, -2), ("notificacao", 145.8, -2),
    ("whoosh", 152, 0), ("pop", 152.4, -4), ("pop", 153.0, -4), ("pop", 153.6, -4), ("pop", 154.2, -4), ("pop", 154.8, -4), ("contador", 155.8, -3), ("whoosh", 160.0, -2), ("revelacao", 161.8, 0), ("contador", 163.3, -3),
    ("whoosh", 168, 0), ("traco", 170.2, -2), ("revelacao", 171.0, -2), ("whoosh", 172.7, -3), ("pop", 173.0, -5), ("traco", 174.3, -3), ("final", 174.7, 0),
]
ALVO_PICO = -29.0  # dBFS de cada efeito antes do ganho extra

def run(args):
    subprocess.run([FF, "-v", "error", "-y"] + args, check=True)

def pico(path):
    out = subprocess.run([FF, "-i", path, "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(out.split("max_volume:")[1].split(" dB")[0])

picos = {k: pico(f"audio/sfx-{k}.mp3") for k in {c[0] for c in CUES}}
inputs, filt = [], []
for i, (k, a, extra) in enumerate(CUES):
    t = real(a)
    g = ALVO_PICO - picos[k] + extra
    inputs += ["-i", f"audio/sfx-{k}.mp3"]
    dur = "atrim=0:1.4," if k == "digitacao" else ""
    filt.append(f"[{i}:a]{dur}aresample=48000,aformat=channel_layouts=stereo,volume={g:.2f}dB,afade=t=out:st={1.1 if k=='digitacao' else 1.6}:d=0.3,adelay={int(t*1000)}|{int(t*1000)}[s{i}]")
n = len(CUES)
filt.append("".join(f"[s{i}]" for i in range(n)) + f"amix=inputs={n}:normalize=0:dropout_transition=0,apad,atrim=0:{DUR}[sfx]")
# efeitos sozinhos (para medir)
run(inputs + ["-filter_complex", ";".join(filt), "-map", "[sfx]", "-ar", "48000", "audio/sfx-trilha.wav"])
# voz no lugar (0,8 s de atraso), efeitos com sidechain pela voz, mixagem e normalização
run(["-i", "audio/narracao.mp3", "-i", "audio/sfx-trilha.wav", "-filter_complex",
     f"[0:a]aresample=48000,aformat=channel_layouts=stereo,adelay={int(ATRASO*1000)}|{int(ATRASO*1000)},apad,atrim=0:{DUR},asplit=3[v][key][vm];"
     "[1:a][key]sidechaincompress=threshold=0.02:ratio=8:attack=5:release=300[sd];"
     "[sd]asplit=2[sd1][sd2];"
     f"[v][sd1]amix=inputs=2:normalize=0,afade=t=out:st={DUR-2.5}:d=2.5,loudnorm=I=-16:TP=-1.5:LRA=11[out];"
     "[vm]anull[vo]",
     "-map", "[out]", "-ar", "48000", "audio/mix-final.wav",
     "-map", "[sd2]", "-ar", "48000", "audio/sfx-abaixado.wav",
     "-map", "[vo]", "-ar", "48000", "audio/voz-no-lugar.wav"])

def janelas(path, win=0.2):
    d = subprocess.check_output([FF, "-v", "error", "-i", path, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"])
    x = struct.unpack("<%dh" % (len(d) // 2), d)
    w = int(8000 * win)
    return [max(abs(v) for v in x[i:i + w]) if x[i:i + w] else 0 for i in range(0, len(x), w)]

db = lambda v: 20 * math.log10(max(v, 1) / 32768)
voz, sfx = janelas("audio/voz-no-lugar.wav"), janelas("audio/sfx-abaixado.wav")
pico_voz = max(voz)
pior, onde = -99, 0
# nível da fala percebido: maior pico da voz em ±0,6 s (o ouvido não "esquece" a voz num respiro entre palavras)
env = [max(voz[max(0, i - 3):i + 4]) for i in range(len(voz))]
tipica = sorted(voz)[int(len(voz) * 0.75)]
for i, (v, s) in enumerate(zip(env, sfx)):
    if s < 5: continue
    ref = v if v > 300 else tipica  # nas pausas maiores, compara com o volume típico da fala
    diff = db(s) - db(ref)
    if diff > pior: pior, onde = diff, i * 0.2
print(f"pico da voz: {db(pico_voz):.1f} dBFS · pico dos efeitos: {db(max(sfx)):.1f} dBFS")
print(f"pior momento: efeito {pior:+.1f} dB em relação à voz, em {onde:.1f} s")
if pior > -6:
    sys.exit("ERRO: algum efeito ficou perto demais ou acima da voz")
print("ok: nenhum efeito passa da voz (folga mínima de %.1f dB)" % -pior)
