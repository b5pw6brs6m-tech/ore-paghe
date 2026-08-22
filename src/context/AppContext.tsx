import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { db } from '../lib/db'
import type { AppUser } from '../lib/api'

type Ctx = {
  user: AppUser | null
  loading: boolean
  /** Cambia a ogni aggiornamento dei dati: le pagine lo usano per ricaricare. */
  tick: number
  refresh: () => void
  signOut: () => Promise<void>
}

const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const montato = useRef(true)

  const ricaricaUtente = useCallback(async () => {
    try {
      const u = await db.getUser()
      if (montato.current) setUser(u)
    } catch {
      if (montato.current) setUser(null)
    } finally {
      if (montato.current) setLoading(false)
    }
  }, [])

  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    montato.current = true
    void ricaricaUtente()
    const off = db.subscribe(() => {
      void ricaricaUtente()
      setTick(t => t + 1)
    })
    return () => { montato.current = false; off() }
  }, [ricaricaUtente])

  const signOut = useCallback(async () => {
    await db.signOut()
    setUser(null)
    setTick(t => t + 1)
  }, [])

  const value = useMemo(() => ({ user, loading, tick, refresh, signOut }), [user, loading, tick, refresh, signOut])
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp(): Ctx {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp va usato dentro <AppProvider>')
  return c
}

/**
 * Carica dati asincroni e li ricarica a ogni `tick` (o quando cambiano le dipendenze).
 * La rotella compare solo al primo caricamento o cambiando contesto: durante gli
 * aggiornamenti in tempo reale i dati già a schermo restano visibili, senza sfarfallii.
 */
export function useCarica<T>(fn: () => Promise<T>, deps: unknown[], iniziale: T): { dati: T; caricando: boolean; ricarica: () => void } {
  const [dati, setDati] = useState<T>(iniziale)
  const [caricando, setCaricando] = useState(true)
  const [n, setN] = useState(0)
  const { tick } = useApp()
  const fnRef = useRef(fn)
  fnRef.current = fn

  const firma = JSON.stringify(deps)
  const firmaPrec = useRef(firma)
  const maiCaricato = useRef(true)

  useEffect(() => {
    let vivo = true
    const cambioContesto = firmaPrec.current !== firma
    firmaPrec.current = firma
    if (maiCaricato.current || cambioContesto) setCaricando(true)

    fnRef.current()
      .then(r => { if (vivo) { setDati(r); maiCaricato.current = false } })
      .catch(() => { /* la UI mostra lo stato vuoto */ })
      .finally(() => { if (vivo) setCaricando(false) })
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma, tick, n])

  return { dati, caricando, ricarica: () => setN(x => x + 1) }
}
