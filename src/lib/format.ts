const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre']
const GIORNI = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato']

export function euro(n: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n || 0)
}

/** 8.5 -> "8h 30m" */
export function oreLabel(h: number): string {
  const totalMin = Math.round((h || 0) * 60)
  const ore = Math.floor(totalMin / 60)
  const min = totalMin % 60
  if (min === 0) return `${ore}h`
  return `${ore}h ${String(min).padStart(2, '0')}m`
}

export function oreDecimali(h: number): string {
  return (h || 0).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/** "2026-08-22" -> "sab 22 ago" */
export function dataBreve(iso: string): string {
  const d = fromISO(iso)
  return `${GIORNI[d.getDay()].slice(0, 3)} ${d.getDate()} ${MESI[d.getMonth()].slice(0, 3)}`
}

/** "2026-08-22" -> "ven 21 agosto" */
export function dataMedia(iso: string): string {
  const d = fromISO(iso)
  return `${GIORNI[d.getDay()].slice(0, 3)} ${d.getDate()} ${MESI[d.getMonth()]}`
}

/** "2026-08-22" -> "sabato 22 agosto 2026" */
export function dataLunga(iso: string): string {
  const d = fromISO(iso)
  return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`
}

/** "2026-08" -> "Agosto 2026" */
export function meseLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const nome = MESI[m - 1]
  return `${nome[0].toUpperCase()}${nome.slice(1)} ${y}`
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO(): string {
  return toISO(new Date())
}

export function toISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function iniziali(nome: string): string {
  return nome.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?'
}
