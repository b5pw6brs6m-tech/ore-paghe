import type { Entry, NewEntry, NewPayment, Payment, Role, Worker } from './types'

export type AppUser = {
  userId: string
  email: string
  fullName: string
  role: Role
}

export interface Api {
  /** 'cloud' = Supabase configurato · 'demo' = dati locali su questo dispositivo */
  readonly mode: 'cloud' | 'demo'

  getUser(): Promise<AppUser | null>
  /** Notifica cambi di sessione e aggiornamenti dati in tempo reale. Restituisce la funzione per annullare. */
  subscribe(cb: () => void): () => void

  signIn(login: string, password: string): Promise<void>
  signUpAdmin(email: string, password: string, fullName: string): Promise<{ needsConfirm: boolean }>
  signOut(): Promise<void>

  // --- Area admin ---
  listWorkers(): Promise<Worker[]>
  createWorker(name: string, hourlyRate: number): Promise<Worker>
  updateWorker(id: string, patch: Partial<Pick<Worker, 'name' | 'hourly_rate' | 'active'>>): Promise<void>
  deleteWorker(id: string): Promise<void>
  createWorkerAccount(workerId: string, login: string, password: string): Promise<void>

  // --- Area lavoratore ---
  myWorker(): Promise<Worker | null>

  // --- Condivise ---
  listEntries(workerId?: string): Promise<Entry[]>
  addEntry(e: NewEntry): Promise<Entry>
  deleteEntry(id: string): Promise<void>
  listPayments(workerId?: string): Promise<Payment[]>
  addPayment(p: NewPayment): Promise<Payment>
  deletePayment(id: string): Promise<void>
}

/** Normaliza "carlo" -> "carlo@ore.app"; las direcciones reales quedan tal cual.
 *  El dominio NO se cambia: los accesos ya creados dejarían de funcionar. */
export function normalizzaLogin(login: string): string {
  const v = login.trim().toLowerCase()
  if (!v) return v
  if (v.includes('@')) return v
  return `${v.replace(/[^a-z0-9._-]/g, '')}@ore.app`
}

export function codiceCasuale(len = 8): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  const buf = new Uint32Array(len)
  crypto.getRandomValues(buf)
  for (let i = 0; i < len; i++) out += alfabeto[buf[i] % alfabeto.length]
  return out
}
