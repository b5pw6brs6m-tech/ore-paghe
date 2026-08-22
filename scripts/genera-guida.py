"""
Costruisce la guida visuale per installare "Al Día" sul telefono.
I telefoni sono disegnati in SVG: niente immagini esterne, così il PDF
resta leggero e nitido a qualsiasi zoom.
"""
import base64, pathlib

RADICE = pathlib.Path(__file__).resolve().parent.parent
ICONA = base64.b64encode((RADICE / 'public' / 'icon-192.png').read_bytes()).decode()
FUORI = RADICE / 'guia'
FUORI.mkdir(exist_ok=True)

INDACO, GRIGIO, SCURO = '#4f46e5', '#64748b', '#0f172a'
ROSSO = '#ef4444'

def cerchio(cx, cy, r=15):
    """Il segnale rosso su cosa toccare."""
    return (f'<circle cx="{cx}" cy="{cy}" r="{r+8}" fill="{ROSSO}" opacity=".13"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{ROSSO}" stroke-width="3"/>')

def riquadro(x, y, w, h, r=9):
    """Segnale per i bersagli larghi, dove un cerchio coprirebbe il testo."""
    return (f'<rect x="{x-4}" y="{y-4}" width="{w+8}" height="{h+8}" rx="{r+4}" '
            f'fill="none" stroke="{ROSSO}" stroke-width="3"/>')

def telefono(contenuto, barra_scura=False):
    testa = f'<rect x="70" y="12" width="60" height="13" rx="6.5" fill="{SCURO}"/>'
    return f'''<svg viewBox="0 0 200 400" class="tel">
  <rect x="3" y="3" width="194" height="394" rx="30" fill="{SCURO}"/>
  <rect x="9" y="9" width="182" height="382" rx="25" fill="{"#1e293b" if barra_scura else "#ffffff"}"/>
  {testa}
  {contenuto}
</svg>'''

def righe(x, y, larghezze, colore='#e2e8f0', h=7, passo=13):
    return ''.join(f'<rect x="{x}" y="{y+i*passo}" width="{w}" height="{h}" rx="3.5" fill="{colore}"/>'
                   for i, w in enumerate(larghezze))

# ---------------------------------------------------------------- i telefoni

def p_whatsapp():
    return telefono(f'''
  <rect x="9" y="25" width="182" height="34" fill="#075e54"/>
  <circle cx="30" cy="42" r="9" fill="#ffffff" opacity=".9"/>
  <rect x="45" y="36" width="60" height="7" rx="3.5" fill="#ffffff" opacity=".9"/>
  <rect x="45" y="47" width="38" height="5" rx="2.5" fill="#ffffff" opacity=".5"/>
  <rect x="9" y="59" width="182" height="332" fill="#e5ddd5"/>
  <rect x="20" y="72" width="130" height="46" rx="10" fill="#ffffff"/>
  {righe(29, 82, [104, 88], '#cbd5e1', 6, 11)}
  <rect x="20" y="126" width="150" height="40" rx="10" fill="#ffffff"/>
  <rect x="29" y="136" width="132" height="7" rx="3.5" fill="#2563eb"/>
  <rect x="29" y="149" width="84" height="7" rx="3.5" fill="#2563eb"/>
  {cerchio(95, 146, 26)}
  <rect x="20" y="182" width="120" height="34" rx="10" fill="#ffffff"/>
  {righe(29, 192, [96, 70], '#cbd5e1', 6, 11)}''')

def p_dentro_whatsapp():
    return telefono(f'''
  <rect x="9" y="25" width="182" height="30" fill="#111827"/>
  <text x="26" y="45" font-size="13" fill="#ffffff" font-family="Helvetica">✕</text>
  <rect x="52" y="35" width="90" height="7" rx="3.5" fill="#ffffff" opacity=".55"/>
  <rect x="9" y="55" width="182" height="300" fill="#ffffff"/>
  {righe(28, 78, [140, 120, 148, 96], '#e2e8f0')}
  <rect x="28" y="146" width="144" height="52" rx="10" fill="#eef2ff"/>
  {righe(40, 160, [110, 78], '#c7d2fe', 6, 12)}
  <rect x="9" y="355" width="182" height="36" fill="#f1f5f9"/>
  <text x="34" y="378" font-size="15" fill="#94a3b8" font-family="Helvetica">‹</text>
  <text x="66" y="378" font-size="15" fill="#94a3b8" font-family="Helvetica">›</text>
  <circle cx="127" cy="373" r="9" fill="none" stroke="{INDACO}" stroke-width="2.2"/>
  <path d="M131 369 L125.5 371.5 L123 377 L128.5 374.5 Z" fill="{INDACO}"/>
  <text x="158" y="378" font-size="15" fill="#94a3b8" font-family="Helvetica">⤴</text>
  {cerchio(127, 373, 17)}
  <rect x="60" y="316" width="128" height="30" rx="8" fill="{SCURO}"/>
  <text x="70" y="336" font-size="11" fill="#ffffff" font-family="Helvetica">Abrir en Safari</text>''')

def p_safari():
    return telefono(f'''
  <rect x="9" y="25" width="182" height="30" fill="#f8fafc"/>
  <rect x="40" y="33" width="120" height="14" rx="7" fill="#e2e8f0"/>
  <rect x="9" y="55" width="182" height="300" fill="#ffffff"/>
  <rect x="66" y="86" width="68" height="68" rx="18" fill="{INDACO}"/>
  <image href="data:image/png;base64,{ICONA}" x="66" y="86" width="68" height="68"/>
  <rect x="72" y="170" width="56" height="9" rx="4.5" fill="{SCURO}"/>
  {righe(40, 194, [120, 96], '#e2e8f0', 6, 12)}
  <rect x="9" y="355" width="182" height="36" fill="#f1f5f9"/>
  <text x="30" y="378" font-size="16" fill="#94a3b8" font-family="Helvetica">‹</text>
  <text x="58" y="378" font-size="16" fill="#94a3b8" font-family="Helvetica">›</text>
  <rect x="92" y="364" width="15" height="17" rx="3" fill="none" stroke="{INDACO}" stroke-width="2.5"/>
  <path d="M99.5 376 L99.5 361 M95 365 L99.5 360.5 L104 365" stroke="{INDACO}" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <text x="132" y="378" font-size="15" fill="#94a3b8" font-family="Helvetica">▤</text>
  <text x="162" y="378" font-size="15" fill="#94a3b8" font-family="Helvetica">⧉</text>
  {cerchio(99, 372, 18)}''')

def p_foglio():
    return telefono(f'''
  <rect x="9" y="25" width="182" height="150" fill="#cbd5e1"/>
  <rect x="9" y="150" width="182" height="241" rx="20" fill="#f8fafc"/>
  <rect x="86" y="160" width="28" height="4" rx="2" fill="#cbd5e1"/>
  <rect x="24" y="178" width="152" height="34" rx="9" fill="#ffffff"/>
  {righe(58, 189, [96], '#e2e8f0', 8, 0)}
  <rect x="24" y="220" width="152" height="34" rx="9" fill="#ffffff"/>
  {righe(58, 231, [80], '#e2e8f0', 8, 0)}
  <rect x="24" y="262" width="152" height="38" rx="9" fill="{INDACO}"/>
  <rect x="36" y="272" width="18" height="18" rx="4" fill="none" stroke="#ffffff" stroke-width="2"/>
  <path d="M45 276 L45 286 M40 281 L50 281" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <text x="62" y="286" font-size="9.5" fill="#ffffff" font-family="Helvetica">Añadir a pantalla</text>
  <text x="62" y="296" font-size="9.5" fill="#ffffff" font-family="Helvetica">de inicio</text>
  {riquadro(24, 262, 152, 38)}
  <rect x="24" y="310" width="152" height="30" rx="9" fill="#ffffff"/>
  {righe(58, 320, [70], '#e2e8f0', 8, 0)}''')

def p_conferma():
    return telefono(f'''
  <rect x="9" y="25" width="182" height="120" fill="#cbd5e1"/>
  <rect x="9" y="120" width="182" height="271" rx="20" fill="#f8fafc"/>
  <text x="26" y="146" font-size="10" fill="{GRIGIO}" font-family="Helvetica">Cancelar</text>
  <text x="72" y="146" font-size="10.5" fill="{SCURO}" font-family="Helvetica" font-weight="bold">Añadir a inicio</text>
  <text x="150" y="146" font-size="10.5" fill="{INDACO}" font-family="Helvetica" font-weight="bold">Añadir</text>
  {riquadro(146, 133, 40, 17, 6)}
  <rect x="26" y="168" width="148" height="60" rx="10" fill="#ffffff"/>
  <image href="data:image/png;base64,{ICONA}" x="36" y="180" width="36" height="36"/>
  <rect x="84" y="190" width="46" height="8" rx="4" fill="{SCURO}"/>
  <rect x="84" y="204" width="70" height="6" rx="3" fill="#e2e8f0"/>
  {righe(26, 244, [148, 110], '#e2e8f0', 6, 12)}''')

def p_fatto():
    return telefono(f'''
  <rect x="9" y="25" width="182" height="366" fill="url(#cielo)"/>
  <defs><linearGradient id="cielo" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#818cf8"/><stop offset="1" stop-color="#c084fc"/></linearGradient></defs>
  <text x="72" y="52" font-size="13" fill="#ffffff" font-family="Helvetica" font-weight="bold">9:41</text>
  <g opacity=".55">
    <rect x="28" y="80" width="40" height="40" rx="11" fill="#ffffff"/>
    <rect x="80" y="80" width="40" height="40" rx="11" fill="#ffffff"/>
    <rect x="132" y="80" width="40" height="40" rx="11" fill="#ffffff"/>
    <rect x="28" y="150" width="40" height="40" rx="11" fill="#ffffff"/>
    <rect x="132" y="150" width="40" height="40" rx="11" fill="#ffffff"/>
  </g>
  <image href="data:image/png;base64,{ICONA}" x="76" y="146" width="48" height="48"/>
  <text x="100" y="208" font-size="10" fill="#ffffff" font-family="Helvetica" text-anchor="middle"
        font-weight="bold">Al Día</text>
  {riquadro(70, 140, 60, 74, 14)}''')

# ------------------------------------------------------------------ i passi

IPHONE = [
    ('Abre WhatsApp y pulsa el enlace que te he mandado.', p_whatsapp()),
    ('Se abre una ventana dentro de WhatsApp. <b>Desde aquí no se puede instalar.</b> '
     'Pulsa el icono de abajo y elige <b>“Abrir en Safari”</b>.', p_dentro_whatsapp()),
    ('Ya estás en Safari. Abajo, pulsa el <b>cuadrado con la flecha hacia arriba</b>.', p_safari()),
    ('Baja por la lista y pulsa <b>“Añadir a pantalla de inicio”</b>.', p_foglio()),
    ('Arriba a la derecha, pulsa <b>“Añadir”</b>.', p_conferma()),
    ('¡Ya está! Tienes el icono de <b>Al Día</b> en el móvil, como cualquier otra app.', p_fatto()),
]

def p_menu_android():
    return telefono(f'''
  <rect x="9" y="25" width="182" height="34" fill="#f8fafc"/>
  <rect x="26" y="35" width="118" height="14" rx="7" fill="#e2e8f0"/>
  <circle cx="166" cy="38" r="2" fill="{SCURO}"/>
  <circle cx="166" cy="43" r="2" fill="{SCURO}"/>
  <circle cx="166" cy="48" r="2" fill="{SCURO}"/>
  {cerchio(166, 43, 14)}
  <rect x="9" y="59" width="182" height="332" fill="#ffffff"/>
  <rect x="66" y="100" width="68" height="68" rx="18" fill="{INDACO}"/>
  <image href="data:image/png;base64,{ICONA}" x="66" y="100" width="68" height="68"/>
  {righe(40, 196, [120, 96], '#e2e8f0', 6, 12)}''')

def p_installa_android():
    return telefono(f'''
  <rect x="9" y="25" width="182" height="34" fill="#f8fafc"/>
  <rect x="26" y="35" width="118" height="14" rx="7" fill="#e2e8f0"/>
  <rect x="9" y="59" width="182" height="332" fill="#e2e8f0" opacity=".5"/>
  <rect x="70" y="66" width="118" height="230" rx="10" fill="#ffffff"/>
  {righe(84, 84, [76, 90, 68], '#e2e8f0', 7, 22)}
  <rect x="76" y="150" width="106" height="30" rx="7" fill="{INDACO}"/>
  <text x="88" y="169" font-size="9.5" fill="#ffffff" font-family="Helvetica">Instalar aplicación</text>
  {riquadro(76, 150, 106, 30)}
  {righe(84, 196, [80, 92, 72], '#e2e8f0', 7, 22)}''')

ANDROID = [
    ('Abre WhatsApp y pulsa el enlace que te he mandado.', p_whatsapp()),
    ('Si se abre dentro de WhatsApp, pulsa los <b>tres puntitos (⋮)</b> de arriba a la derecha '
     'y elige <b>“Abrir en el navegador”</b>.', p_dentro_whatsapp()),
    ('Ya en Chrome, pulsa otra vez los <b>tres puntitos (⋮)</b> de arriba a la derecha.', p_menu_android()),
    ('Baja por la lista y pulsa <b>“Instalar aplicación”</b> (o “Añadir a pantalla de inicio”).',
     p_installa_android()),
    ('Confirma pulsando <b>“Instalar”</b>.', p_installa_android()),
    ('¡Ya está! Tienes el icono de <b>Al Día</b> en el móvil, como cualquier otra app.', p_fatto()),
]

# ------------------------------------------------------------------- pagina

def pagina(titolo, sottotitolo, passi):
    schede = ''.join(f'''
    <div class="paso">
      <div class="num">{i}</div>
      {svg}
      <p>{testo}</p>
    </div>''' for i, (testo, svg) in enumerate(passi, 1))

    return f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<style>
  @page {{ size: A4; margin: 12mm 10mm; }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; background: #ffffff; font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
          color: {SCURO}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  header {{ display: flex; align-items: center; gap: 14px; padding-bottom: 12px;
            border-bottom: 2px solid #e2e8f0; margin-bottom: 16px; }}
  header img {{ width: 52px; height: 52px; border-radius: 13px; }}
  h1 {{ font-size: 21px; margin: 0; letter-spacing: -.4px; }}
  header p {{ margin: 3px 0 0; font-size: 12.5px; color: {GRIGIO}; }}
  .rejilla {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px 12px; }}
  .paso {{ position: relative; border: 1.5px solid #e2e8f0; border-radius: 14px;
           padding: 22px 10px 10px; text-align: center; background: #fff; }}
  .num {{ position: absolute; top: -11px; left: 50%; transform: translateX(-50%);
          width: 24px; height: 24px; border-radius: 50%; background: {INDACO}; color: #fff;
          font-size: 13px; font-weight: 700; line-height: 24px; }}
  .tel {{ width: 100%; max-width: 116px; height: auto; display: block; margin: 0 auto 8px; }}
  .paso p {{ margin: 0; font-size: 10.2px; line-height: 1.42; color: #334155; }}
  .paso b {{ color: {SCURO}; }}
  footer {{ margin-top: 16px; background: #eef2ff; border-radius: 12px; padding: 11px 14px;
            font-size: 11px; color: #3730a3; line-height: 1.5; }}
  footer b {{ color: #312e81; }}
</style></head>
<body>
  <header>
    <img src="data:image/png;base64,{ICONA}" alt="">
    <div><h1>{titolo}</h1><p>{sottotitolo}</p></div>
  </header>
  <div class="rejilla">{schede}</div>
  <footer>
    <b>Después:</b> abre la app, escribe el <b>usuario</b> y la <b>contraseña</b> que te he mandado, y ya está.<br>
    Cada tarde, al terminar de trabajar, entra y apunta las horas que has hecho.
    Solo se puede el mismo día. Cualquier duda, me dices.
  </footer>
</body></html>'''

(FUORI / 'guia-iphone.html').write_text(
    pagina('Cómo poner la app en tu iPhone', 'Es un minuto. Sigue los pasos por orden.', IPHONE), encoding='utf-8')
(FUORI / 'guia-android.html').write_text(
    pagina('Cómo poner la app en tu Android', 'Es un minuto. Sigue los pasos por orden.', ANDROID), encoding='utf-8')
print('HTML generati in guia/')
