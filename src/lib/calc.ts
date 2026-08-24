import type { Entry, Payment, Summary } from './types'

/** Differenza in ore fra due orari "HH:MM", gestendo i turni che passano la mezzanotte. */
export function calcolaOre(start: string, end: string, breakMinutes = 0): number {
  const s = minutiDa(start)
  const e = minutiDa(end)
  if (s === null || e === null) return 0
  let diff = e - s
  if (diff < 0) diff += 24 * 60          // turno notturno: uscita il giorno dopo
  diff -= Math.max(0, breakMinutes)
  if (diff <= 0) return 0
  return Math.round((diff / 60) * 100) / 100
}

export function minutiDa(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((hhmm || '').trim())
  if (!m) return null
  const h = Number(m[1]), min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

export function guadagnoEntry(e: Entry): number {
  return Math.round(e.hours * e.hourly_rate * 100) / 100
}

export function riepilogo(entries: Entry[], payments: Payment[]): Summary {
  const totalHours = round2(entries.reduce((a, e) => a + e.hours, 0))
  const totalWork = round2(entries.reduce((a, e) => a + guadagnoEntry(e), 0))
  // Il bonus è denaro guadagnato in più, non un anticipo: aumenta il dovuto
  // e poi il pagamento lo copre. Senza questo, regalare 50 € risulterebbe
  // come aver pagato 50 € in anticipo.
  const totalBonus = round2(payments.reduce((a, p) => a + (p.bonus || 0), 0))
  const totalEarned = round2(totalWork + totalBonus)
  const totalPaid = round2(payments.reduce((a, p) => a + p.amount, 0))
  return {
    totalHours,
    totalWork,
    totalBonus,
    totalEarned,
    totalPaid,
    balance: round2(totalEarned - totalPaid),
    days: new Set(entries.map(e => e.work_date)).size,
  }
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Raggruppa le registrazioni per mese ("2026-08"), dalla più recente. */
export function perMese<T extends { work_date?: string; paid_on?: string }>(rows: T[]): Array<[string, T[]]> {
  const map = new Map<string, T[]>()
  for (const r of rows) {
    const d = (r.work_date ?? r.paid_on)!
    const ym = d.slice(0, 7)
    if (!map.has(ym)) map.set(ym, [])
    map.get(ym)!.push(r)
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
}
