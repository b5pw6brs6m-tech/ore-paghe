"""
Genera le icone PNG di "Al Día" senza dipendenze esterne.

Il segno: un orologio bianco pieno con le lancette ritagliate, e in basso a
destra un bollino verde con la spunta — "la giornata è registrata, siamo in pari".
Tutto disegnato con distanze matematiche, così i bordi restano morbidi.
"""
import math, struct, zlib, pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / 'public'
OUT.mkdir(exist_ok=True)

INDACO  = (67, 56, 202)     # #4338ca
VIOLA   = (124, 58, 237)    # #7c3aed
VERDE   = (16, 185, 129)    # #10b981
BIANCO  = (255, 255, 255)

def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def copertura(d):
    """Da distanza con segno a quantità di colore: bordi sfumati su un pixel."""
    return max(0.0, min(1.0, 0.5 - d))

def dist_segmento(px, py, ax, ay, bx, by):
    vx, vy, wx, wy = bx - ax, by - ay, px - ax, py - ay
    L = vx * vx + vy * vy
    t = 0.0 if L == 0 else max(0.0, min(1.0, (wx * vx + wy * vy) / L))
    return math.hypot(px - (ax + t * vx), py - (ay + t * vy))

def icona(s: int) -> bytes:
    # tutto in frazioni del lato, così l'icona è identica a ogni misura
    cx, cy   = 0.455 * s, 0.435 * s      # centro del quadrante
    r_disco  = 0.300 * s
    sp_lanc  = 0.052 * s                 # spessore lancette
    bx, by   = 0.735 * s, 0.735 * s      # centro del bollino
    r_boll   = 0.185 * s
    r_anello = r_boll + 0.038 * s        # alone bianco che stacca il bollino
    sp_spunt = 0.040 * s

    righe = []
    for y in range(s):
        riga = bytearray()
        for x in range(s):
            px, py = x + 0.5, y + 0.5

            # sfondo: sfumatura in diagonale
            col = mix(INDACO, VIOLA, px / s * 0.55 + py / s * 0.45)

            # quadrante bianco pieno, con le lancette ritagliate
            a_disco = copertura(math.hypot(px - cx, py - cy) - r_disco)
            if a_disco > 0:
                d_ora = dist_segmento(px, py, cx, cy, cx, cy - r_disco * 0.56) - sp_lanc / 2
                d_min = dist_segmento(px, py, cx, cy, cx + r_disco * 0.70, cy + r_disco * 0.22) - sp_lanc / 2
                a_lanc = max(copertura(d_ora), copertura(d_min))
                col = mix(col, BIANCO, a_disco * (1 - a_lanc))

            # bollino verde con la spunta
            a_anello = copertura(math.hypot(px - bx, py - by) - r_anello)
            if a_anello > 0:
                col = mix(col, BIANCO, a_anello)
                a_boll = copertura(math.hypot(px - bx, py - by) - r_boll)
                if a_boll > 0:
                    col = mix(col, VERDE, a_boll)
                    d1 = dist_segmento(px, py, bx - 0.075 * s, by + 0.002 * s, bx - 0.022 * s, by + 0.055 * s)
                    d2 = dist_segmento(px, py, bx - 0.022 * s, by + 0.055 * s, bx + 0.082 * s, by - 0.062 * s)
                    a_spunta = copertura(min(d1, d2) - sp_spunt / 2)
                    col = mix(col, BIANCO, a_boll * a_spunta)

            riga += bytes((col[0], col[1], col[2], 255))
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
