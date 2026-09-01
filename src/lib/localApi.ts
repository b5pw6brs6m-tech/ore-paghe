import { codiceCasuale, normalizzaLogin, type Api, type AppUser } from './api'
import { calcolaOre, round2 } from './calc'
import { todayISO, toISO } from './format'
import type { Entry, NewEntry, NewPayment, Payment, Worker } from './types'

/**
 * Adattatore "demo": tutti i dati restano su questo dispositivo (localStorage).
 * Serve per provare l'app senza configurare nulla. In produzione si usa Supabase.
 */

const KEY = 'horas-pagos-demo-v3'

type Account = { userId: string; login: string; password: string; fullName: string; role: 'admin' | 'worker' }
type Db = {
  accounts: Account[]
  workers: Worker[]
  entries: Entry[]
  payments: Payment[]
  sessionUserId: string | null
}

const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

function seed(): Db {
  const adminId = uid()
  const db: Db = {
    accounts: [{ userId: adminId, login: 'demo@ore.app', password: 'demo', fullName: 'Jefe (Demo)', role: 'admin' }],
    workers: [], entries: [], payments: [], sessionUserId: null,
  }

  const crea = (nome: string, tariffa: number, login: string) => {
    const workerUserId = uid()
    const w: Worker = {
      id: uid(), admin_id: adminId, user_id: workerUserId, name: nome,
      hourly_rate: tariffa, link_code: codiceCasuale(),
      access_login: login, access_password: 'demo', last_seen: null, active: true, created_at: now(),
    }
    db.workers.push(w)
    db.accounts.push({ userId: workerUserId, login, password: 'demo', fullName: nome, role: 'worker' })
    return w
  }

  const carlos = crea('Carlos Blanco', 12, 'demo-carlos@ore.app')
  const ana = crea('Ana Petrova', 14.5, 'demo-ana@ore.app')

  const giorniFa = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return toISO(d) }
  const turno = (w: Worker, n: number, start: string, end: string, pausa: number) => {
    // registrata la sera stessa del turno, come farebbe davvero il lavoratore
    const seraStessa = new Date()
    seraStessa.setDate(seraStessa.getDate() - n)
    seraStessa.setHours(19, 20, 0, 0)
    db.entries.push({
      id: uid(), worker_id: w.id, work_date: giorniFa(n), start_time: start, end_time: end,
      break_minutes: pausa, hours: calcolaOre(start, end, pausa), hourly_rate: w.hourly_rate,
      note: null, created_by: w.user_id ?? '', created_at: seraStessa.toISOString(),
    })
  }

  turno(carlos, 1, '08:00', '17:00', 60)
  turno(carlos, 2, '08:30', '18:00', 60)
  turno(carlos, 3, '08:00', '13:00', 0)
  turno(carlos, 6, '09:00', '17:30', 30)
  turno(carlos, 7, '08:00', '17:00', 60)
  turno(carlos, 8, '08:00', '16:00', 60)
  turno(ana, 1, '14:00', '20:00', 0)
  turno(ana, 4, '09:00', '15:30', 30)
  turno(ana, 5, '09:00', '18:00', 60)

  db.payments.push({
    id: uid(), worker_id: carlos.id, paid_on: giorniFa(5), amount: 220, bonus: 20,
    method: 'Efectivo', note: 'Adelanto de la semana pasada', created_at: now(),
  })

  return db
}

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch { /* dati corrotti: si riparte dal seed */ }
  const db = seed()
  localStorage.setItem(KEY, JSON.stringify(db))
  return db
}

let db: Db = load()
const listeners = new Set<() => void>()

function save() {
  localStorage.setItem(KEY, JSON.stringify(db))
  listeners.forEach(fn => fn())
}

function currentAccount(): Account | null {
  return db.accounts.find(a => a.userId === db.sessionUserId) ?? null
}

function requireAccount(): Account {
  const a = currentAccount()
  if (!a) throw new Error('La sesión ha caducado, vuelve a entrar.')
  return a
}

/** I lavoratori visibili all'utente corrente: tutti i suoi se admin, solo se stesso se lavoratore. */
function visibleWorkerIds(): string[] {
  const a = requireAccount()
  if (a.role === 'admin') return db.workers.filter(w => w.admin_id === a.userId).map(w => w.id)
  return db.workers.filter(w => w.user_id === a.userId).map(w => w.id)
}

const wait = () => new Promise<void>(r => setTimeout(r, 120))

export const localApi: Api = {
  mode: 'demo',

  async getUser(): Promise<AppUser | null> {
    const a = currentAccount()
    if (!a) return null
    return { userId: a.userId, email: a.login, fullName: a.fullName, role: a.role }
  },

  subscribe(cb) {
    listeners.add(cb)
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) { db = load(); cb() } }
    window.addEventListener('storage', onStorage)
    return () => { listeners.delete(cb); window.removeEventListener('storage', onStorage) }
  },

  async signIn(login, password) {
    await wait()
    const l = normalizzaLogin(login)
    const acc = db.accounts.find(a => a.login === l)
    if (!acc || acc.password !== password) throw new Error('Datos incorrectos. Revisa el usuario y la contraseña.')
    db.sessionUserId = acc.userId
    save()
  },

  async signUpAdmin(email, password, fullName) {
    await wait()
    // Un solo titolare: come nel database, dopo il primo la registrazione è chiusa.
    if (db.accounts.some(a => a.role === 'admin')) {
      throw new Error('Los accesos los crea el jefe desde la app.')
    }
    const l = normalizzaLogin(email)
    if (db.accounts.some(a => a.login === l)) throw new Error('Ya existe una cuenta con ese correo.')
    const acc: Account = { userId: uid(), login: l, password, fullName, role: 'admin' }
    db.accounts.push(acc)
    db.sessionUserId = acc.userId
    save()
    return { needsConfirm: false }
  },

  async signOut() {
    db.sessionUserId = null
    save()
  },

  async recuperaPassword() {
    throw new Error('En modo de prueba no se envían correos. Pídele las credenciales al jefe.')
  },

  async cambiaPassword(nuova) {
    const a = requireAccount()
    a.password = nuova
    save()
  },

  inRecupero() {
    return false
  },

  async verificaCredenziali(login, password) {
    await wait()
    const l = normalizzaLogin(login)
    return db.accounts.some(a => a.login === l && a.password === password)
  },

  async listWorkers() {
    const a = requireAccount()
    return db.workers
      .filter(w => (a.role === 'admin' ? w.admin_id === a.userId : w.user_id === a.userId))
      .sort((x, y) => x.name.localeCompare(y.name))
  },

  async createWorker(name, hourlyRate) {
    const a = requireAccount()
    if (a.role !== 'admin') throw new Error('Solo el jefe puede añadir trabajadores.')
    const w: Worker = {
      id: uid(), admin_id: a.userId, user_id: null, name: name.trim(),
      hourly_rate: round2(hourlyRate), link_code: codiceCasuale(),
      access_login: null, access_password: null, last_seen: null, active: true, created_at: now(),
    }
    db.workers.push(w)
    save()
    return w
  },

  async updateWorker(id, patch) {
    const w = db.workers.find(x => x.id === id)
    if (!w) throw new Error('Trabajador no encontrado.')
    Object.assign(w, patch)
    save()
  },

  async deleteWorker(id) {
    db.workers = db.workers.filter(w => w.id !== id)
    db.entries = db.entries.filter(e => e.worker_id !== id)
    db.payments = db.payments.filter(p => p.worker_id !== id)
    save()
  },

  async createWorkerAccount(workerId, login, password) {
    await wait()
    const a = requireAccount()
    if (a.role !== 'admin') throw new Error('Solo el jefe puede crear los accesos.')
    const w = db.workers.find(x => x.id === workerId && x.admin_id === a.userId)
    if (!w) throw new Error('Trabajador no encontrado.')
    const l = normalizzaLogin(login)
    if (db.accounts.some(acc => acc.login === l)) throw new Error('Ese usuario ya existe. Elige otro.')
    const userId = uid()
    db.accounts.push({ userId, login: l, password, fullName: w.name, role: 'worker' })
    w.user_id = userId
    w.access_login = l
    w.access_password = password
    save()
  },

  async segnaPresenza() {
    const a = requireAccount()
    const w = db.workers.find(x => x.user_id === a.userId)
    if (w) { w.last_seen = now(); save() }
  },

  async myWorker() {
    const a = requireAccount()
    return db.workers.find(w => w.user_id === a.userId) ?? null
  },

  async listEntries(workerId) {
    const ids = new Set(workerId ? [workerId] : visibleWorkerIds())
    if (workerId && !visibleWorkerIds().includes(workerId)) return []
    return db.entries
      .filter(e => ids.has(e.worker_id))
      .sort((x, y) => y.work_date.localeCompare(x.work_date) || y.created_at.localeCompare(x.created_at))
  },

  async addEntry(e: NewEntry) {
    await wait()
    const a = requireAccount()
    const w = db.workers.find(x => x.id === e.worker_id)
    if (!w) throw new Error('Trabajador no encontrado.')
    // Stessa regola del database: oggi oppure ieri, mai più indietro né nel futuro.
    if (a.role === 'worker') {
      const ieri = new Date(); ieri.setDate(ieri.getDate() - 1)
      if (e.work_date > todayISO() || e.work_date < toISO(ieri)) {
        throw new Error('Solo puedes registrar la jornada de hoy o la de ayer.')
      }
    }
    const row: Entry = {
      id: uid(), ...e, hours: round2(e.hours), hourly_rate: w.hourly_rate,
      created_by: a.userId, created_at: now(),
    }
    db.entries.push(row)
    save()
    return row
  },

  async deleteEntry(id) {
    const a = requireAccount()
    // Solo il titolare cancella: il lavoratore registra e consulta.
    if (a.role !== 'admin') throw new Error('Solo el jefe puede borrar una jornada.')
    db.entries = db.entries.filter(x => x.id !== id)
    save()
  },

  async listPayments(workerId) {
    const ids = new Set(workerId ? [workerId] : visibleWorkerIds())
    if (workerId && !visibleWorkerIds().includes(workerId)) return []
    return db.payments
      .filter(p => ids.has(p.worker_id))
      .sort((x, y) => y.paid_on.localeCompare(x.paid_on) || y.created_at.localeCompare(x.created_at))
  },

  async addPayment(p: NewPayment) {
    await wait()
    const a = requireAccount()
    if (a.role !== 'admin') throw new Error('Solo el jefe puede registrar los pagos.')
    const row: Payment = { id: uid(), ...p, amount: round2(p.amount), created_at: now() }
    db.payments.push(row)
    save()
    return row
  },

  async deletePayment(id) {
    db.payments = db.payments.filter(p => p.id !== id)
    save()
  },
}

/** Ripristina i dati dimostrativi originali. */
export function resetDemo() {
  db = seed()
  save()
}
