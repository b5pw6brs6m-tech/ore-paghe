const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const DIAS  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']

export function euro(n: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0)
}

/** 8.5 -> "8h 30m" */
export function oreLabel(h: number): string {
  const totalMin = Math.round((h || 0) * 60)
  const horas = Math.floor(totalMin / 60)
  const min = totalMin % 60
  if (min === 0) return `${horas}h`
  return `${horas}h ${String(min).padStart(2, '0')}m`
}

export function oreDecimali(h: number): string {
  return (h || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/** "2026-08-22" -> "sáb 22 ago" */
export function dataBreve(iso: string): string {
  const d = fromISO(iso)
  return `${DIAS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`
}

/** "2026-08-22" -> "sáb 22 de agosto" */
export function dataMedia(iso: string): string {
  const d = fromISO(iso)
  return `${DIAS[d.getDay()].slice(0, 3)} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

/** "2026-08-22" -> "sábado 22 de agosto de 2026" */
export function dataLunga(iso: string): string {
  const d = fromISO(iso)
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

/** "2026-08" -> "Agosto 2026" */
export function meseLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const nombre = MESES[m - 1]
  return `${nombre[0].toUpperCase()}${nombre.slice(1)} ${y}`
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

/** Alza solo la prima lettera: "sábado 22 de agosto" -> "Sábado 22 de agosto". */
export function maiuscola(t: string): string {
  return t ? t[0].toUpperCase() + t.slice(1) : t
}

export function iniziali(nombre: string): string {
  return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?'
}
