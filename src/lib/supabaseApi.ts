import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { normalizzaLogin, type Api, type AppUser } from './api'
import { round2 } from './calc'
import type { Entry, NewEntry, NewPayment, Payment, Worker } from './types'

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const cloudConfigurato = Boolean(URL && KEY)

export const supabase: SupabaseClient | null = cloudConfigurato
  ? createClient(URL!, KEY!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null

function sb(): SupabaseClient {
  if (!supabase) throw new Error('Supabase non configurato.')
  return supabase
}

function boom(error: { message: string } | null): void {
  if (!error) return
  const m = error.message || ''
  if (/invalid login credentials/i.test(m)) throw new Error('Credenziali non valide. Controlla nome utente e password.')
  if (/already registered|already been registered/i.test(m)) throw new Error('Questo nome utente è già usato. Scegline un altro.')
  if (/password should be at least/i.test(m)) throw new Error('La password deve avere almeno 6 caratteri.')
  if (/email address .* is invalid/i.test(m)) throw new Error('Nome utente non valido: usa solo lettere e numeri, oppure una email vera.')
  if (/rate limit|too many/i.test(m)) throw new Error('Troppi tentativi ravvicinati. Riprova fra qualche minuto.')
  throw new Error(m)
}

export const supabaseApi: Api = {
  mode: 'cloud',

  async getUser(): Promise<AppUser | null> {
    const { data } = await sb().auth.getUser()
    const u = data.user
    if (!u) return null
    const { data: prof } = await sb().from('profiles').select('full_name, role').eq('id', u.id).maybeSingle()
    return {
      userId: u.id,
      email: u.email ?? '',
      fullName: prof?.full_name || (u.user_metadata?.full_name as string) || u.email || '',
      role: (prof?.role as 'admin' | 'worker') ?? 'worker',
    }
  },

  subscribe(cb) {
    const { data: auth } = sb().auth.onAuthStateChange(() => cb())
    const channel = sb()
      .channel('dati-app')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_entries' }, cb)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, cb)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, cb)
      .subscribe()
    return () => {
      auth.subscription.unsubscribe()
      sb().removeChannel(channel)
    }
  },

  async signIn(login, password) {
    const { error } = await sb().auth.signInWithPassword({ email: normalizzaLogin(login), password })
    boom(error)
  },

  async signUpAdmin(email, password, fullName) {
    const { data, error } = await sb().auth.signUp({
      email: normalizzaLogin(email),
      password,
      options: { data: { full_name: fullName.trim(), role: 'admin' } },
    })
    boom(error)
    return { needsConfirm: !data.session }
  },

  async signOut() {
    await sb().auth.signOut()
  },

  async listWorkers() {
    const { data, error } = await sb().from('workers').select('*').order('name')
    boom(error)
    return (data ?? []) as Worker[]
  },

  async createWorker(name, hourlyRate) {
    const { data: u } = await sb().auth.getUser()
    if (!u.user) throw new Error('Sessione scaduta, rientra con le tue credenziali.')
    const { data, error } = await sb()
      .from('workers')
      .insert({ admin_id: u.user.id, name: name.trim(), hourly_rate: round2(hourlyRate) })
      .select()
      .single()
    boom(error)
    return data as Worker
  },

  async updateWorker(id, patch) {
    const { error } = await sb().from('workers').update(patch).eq('id', id)
    boom(error)
  },

  async deleteWorker(id) {
    const { error } = await sb().from('workers').delete().eq('id', id)
    boom(error)
  },

  /**
   * Crea l'account del lavoratore SENZA sloggare l'admin: la registrazione avviene
   * su un client Supabase separato che non salva la sessione. Il trigger sul database
   * collega il nuovo utente al lavoratore verificando il suo link_code segreto.
   */
  async createWorkerAccount(workerId, login, password) {
    const { data: w, error: e1 } = await sb()
      .from('workers').select('id, name, link_code').eq('id', workerId).single()
    boom(e1)

    const usaEDimentica = createClient(URL!, KEY!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    const { error } = await usaEDimentica.auth.signUp({
      email: normalizzaLogin(login),
      password,
      options: { data: { full_name: w!.name, role: 'worker', worker_id: w!.id, link_code: w!.link_code } },
    })
    boom(error)

    // Verifica che il collegamento sia andato a buon fine.
    const { data: check } = await sb().from('workers').select('user_id').eq('id', workerId).single()
    if (!check?.user_id) {
      throw new Error('Non sono riuscito a collegare l’accesso. Di solito il nome utente è già usato da un altro account: provane un altro. Se il problema resta, controlla di aver eseguito lo script SQL su Supabase.')
    }
  },

  async myWorker() {
    const { data: u } = await sb().auth.getUser()
    if (!u.user) return null
    const { data, error } = await sb().from('workers').select('*').eq('user_id', u.user.id).maybeSingle()
    boom(error)
    return (data as Worker) ?? null
  },

  async listEntries(workerId) {
    let q = sb().from('work_entries').select('*')
    if (workerId) q = q.eq('worker_id', workerId)
    const { data, error } = await q.order('work_date', { ascending: false }).order('created_at', { ascending: false })
    boom(error)
    return (data ?? []) as Entry[]
  },

  async addEntry(e: NewEntry) {
    const { data, error } = await sb()
      .from('work_entries')
      .insert({ ...e, hours: round2(e.hours) })
      .select()
      .single()
    boom(error)
    return data as Entry
  },

  async deleteEntry(id) {
    const { error } = await sb().from('work_entries').delete().eq('id', id)
    boom(error)
  },

  async listPayments(workerId) {
    let q = sb().from('payments').select('*')
    if (workerId) q = q.eq('worker_id', workerId)
    const { data, error } = await q.order('paid_on', { ascending: false }).order('created_at', { ascending: false })
    boom(error)
    return (data ?? []) as Payment[]
  },

  async addPayment(p: NewPayment) {
    const { data, error } = await sb()
      .from('payments')
      .insert({ ...p, amount: round2(p.amount) })
      .select()
      .single()
    boom(error)
    return data as Payment
  },

  async deletePayment(id) {
    const { error } = await sb().from('payments').delete().eq('id', id)
    boom(error)
  },
}
