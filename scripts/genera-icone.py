"""Genera le icone PNG della PWA senza dipendenze esterne."""
import math, struct, zlib, pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / 'public'
OUT.mkdir(exist_ok=True)

def lerp(a, b, t): return a + (b - a) * t
def smooth(d):                      # copertura antialiasing da distanza con segno
    return max(0.0, min(1.0, 0.5 - d))

def dist_seg(px, py, ax, ay, bx, by):
    vx, vy, wx, wy = bx - ax, by - ay, px - ax, py - ay
    L = vx * vx + vy * vy
    t = 0.0 if L == 0 else max(0.0, min(1.0, (wx * vx + wy * vy) / L))
    return math.hypot(px - (ax + t * vx), py - (ay + t * vy))

def icona(size: int) -> bytes:
    s = size
    cx = cy = s / 2
    R      = s * 0.30       # raggio del quadrante
    anello = s * 0.052      # spessore
    lanc   = s * 0.042      # spessore lancette

    # gradiente diagonale indaco
    c1 = (67, 56, 202)      # #4338ca
    c2 = (99, 102, 241)     # #6366f1

    righe = []
    for y in range(s):
        riga = bytearray()
        for x in range(s):
            px, py = x + 0.5, y + 0.5
            t = (px / s * 0.55 + py / s * 0.45)
            r = int(lerp(c1[0], c2[0], t))
            g = int(lerp(c1[1], c2[1], t))
            b = int(lerp(c1[2], c2[2], t))

            d_anello = abs(math.hypot(px - cx, py - cy) - R) - anello / 2
            d_ora    = dist_seg(px, py, cx, cy, cx, cy - R * 0.52) - lanc / 2
            d_min    = dist_seg(px, py, cx, cy, cx + R * 0.66, cy + R * 0.20) - lanc / 2
            a = max(smooth(d_anello), smooth(d_ora), smooth(d_min))

            if a > 0:
                r = int(lerp(r, 255, a)); g = int(lerp(g, 255, a)); b = int(lerp(b, 255, a))
            riga += bytes((r, g, b, 255))
        righe.append(bytes(riga))

    raw = b''.join(b'\x00' + r for r in righe)

    def chunk(tipo, dati):
        c = struct.pack('>I', len(dati)) + tipo + dati
        return c + struct.pack('>I', zlib.crc32(tipo + dati) & 0xFFFFFFFF)

    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('>IIBBBBB', s, s, 8, 6, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, 9))
            + chunk(b'IEND', b''))

for nome, dim in [('icon-192.png', 192), ('icon-512.png', 512), ('apple-touch-icon.png', 180)]:
    (OUT / nome).write_bytes(icona(dim))
    print('creata', nome, dim)
