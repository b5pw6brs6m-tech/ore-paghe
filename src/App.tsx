import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Button, Caricamento, Errore, Field, Spinner, Vuoto, inputCls } from './components/ui'
import { Shell, type NavItem } from './components/Shell'
import { IconCheck, IconClock, IconKey, IconUsers, IconWallet } from './components/icons'
import { useApp, useCarica } from './context/AppContext'
import { db } from './lib/db'
import type { Worker } from './lib/types'

import Login from './pages/Login'
import AdminLavoratori from './pages/admin/Lavoratori'
import AdminLavoratore from './pages/admin/Lavoratore'
import AdminPagamenti from './pages/admin/Pagamenti'
import WorkerHome from './pages/worker/Home'
import WorkerOre from './pages/worker/Ore'
import WorkerPagamenti from './pages/worker/Pagamenti'
import Registra from './pages/worker/Registra'

export default function App() {
  const { user, loading } = useApp()

  if (loading) return <Caricamento testo="Un momento…" />
  // Arrivo dal link di recupero ricevuto per email: prima si sceglie la nuova password.
  if (db.inRecupero()) return <NuovaPassword />
  if (!user) return <Login />
  return user.role === 'admin' ? <AreaAdmin /> : <AreaLavoratore />
}

/* ----------------------------------------------------------------- admin */

const NAV_ADMIN: NavItem[] = [
  { to: '/', label: 'Trabajadores', icon: <IconUsers className="h-[22px] w-[22px]" />, end: true },
  { to: '/pagamenti', label: 'Pagos', icon: <IconWallet className="h-[22px] w-[22px]" /> },
]

function AreaAdmin() {
  const { pathname } = useLocation()
  const dettaglio = pathname.startsWith('/lavoratore/')

  const contenuto = (
    <Routes>
      <Route path="/" element={<AdminLavoratori />} />
      <Route path="/lavoratore/:id" element={<AdminLavoratore />} />
      <Route path="/pagamenti" element={<AdminPagamenti />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )

  // Nella scheda del singolo lavoratore la barra in basso sparisce: si torna con la freccia.
  if (dettaglio) {
    return (
      <div className="min-h-full bg-ink-100">
        <div className="mx-auto min-h-screen max-w-[480px] pb-10">{contenuto}</div>
      </div>
    )
  }
  return <Shell nav={NAV_ADMIN}>{contenuto}</Shell>
}

/* ------------------------------------------------------------ lavoratore */

const NAV_WORKER: NavItem[] = [
  { to: '/', label: 'Resumen', icon: <IconWallet className="h-[22px] w-[22px]" />, end: true },
  { to: '/ore', label: 'Mis horas', icon: <IconClock className="h-[22px] w-[22px]" /> },
  { to: '/pagamenti', label: 'Pagos', icon: <IconUsers className="h-[22px] w-[22px]" /> },
]

function AreaLavoratore() {
  const { pathname } = useLocation()
  const { signOut } = useApp()
  const { dati: worker, caricando } = useCarica<Worker | null>(() => db.myWorker(), [], null)

  // Segnala al titolare che il lavoratore ha aperto l'app, anche se poi non
  // registra niente. Non più di una volta ogni due minuti.
  const ultimoSegnale = useRef(0)
  useEffect(() => {
    const segnala = () => {
      if (document.hidden) return
      const ora = Date.now()
      if (ora - ultimoSegnale.current < 120_000) return
      ultimoSegnale.current = ora
      void db.segnaPresenza().catch(() => {})
    }
    segnala()
    document.addEventListener('visibilitychange', segnala)
    return () => document.removeEventListener('visibilitychange', segnala)
  }, [])

  if (caricando) return <Caricamento />

  if (!worker) {
    return (
      <div className="min-h-full bg-ink-100 p-5 pt-24">
        <Vuoto
          icona={<IconClock className="h-6 w-6" />}
          titolo="Cuenta todavía sin vincular"
          testo="Pídele al jefe que te vuelva a crear el acceso: tu perfil no está asociado a ningún trabajador."
          azione={<Button variant="soft" onClick={() => void signOut()}>Salir</Button>}
        />
      </div>
    )
  }

  if (pathname === '/registra') return <Registra worker={worker} />

  return (
    <Shell nav={NAV_WORKER}>
      <Routes>
        <Route path="/" element={<WorkerHome worker={worker} />} />
        <Route path="/ore" element={<WorkerOre worker={worker} />} />
        <Route path="/pagamenti" element={<WorkerPagamenti worker={worker} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}

/* ------------------------------------------------------- nuova password */

function NuovaPassword() {
  const { refresh, signOut } = useApp()
  const [password, setPassword] = useState('')
  const [ripeti, setRipeti] = useState('')
  const [errore, setErrore] = useState('')
  const [attesa, setAttesa] = useState(false)

  async function salva() {
    setErrore(''); setAttesa(true)
    try {
      if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.')
      if (password !== ripeti) throw new Error('Las dos contraseñas no coinciden.')
      await db.cambiaPassword(password)
      refresh()
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'No he podido cambiarla.')
    } finally { setAttesa(false) }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-brand-700 via-brand-600 to-brand-500">
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col justify-center px-5 safe-top safe-bottom">
        <div className="animate-rise rounded-[28px] bg-white p-6 shadow-2xl">
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="mb-3 rounded-2xl bg-brand-50 p-3 text-brand-600">
              <IconKey className="h-6 w-6" />
            </div>
            <h1 className="text-[20px] font-extrabold text-ink-900">Pon una contraseña nueva</h1>
            <p className="mt-1 text-[14px] text-ink-500">Apúntala en un sitio seguro.</p>
          </div>

          <div className="space-y-4">
            <Field label="Contraseña nueva" hint="Al menos 6 caracteres.">
              <input className={inputCls} type="password" value={password}
                     onChange={e => setPassword(e.target.value)} autoComplete="new-password" placeholder="••••••" />
            </Field>
            <Field label="Repítela">
              <input className={inputCls} type="password" value={ripeti}
                     onChange={e => setRipeti(e.target.value)} autoComplete="new-password" placeholder="••••••" />
            </Field>
            <Errore>{errore}</Errore>
            <Button size="lg" full onClick={salva} disabled={attesa || !password || !ripeti}>
              {attesa ? <Spinner /> : <><IconCheck className="h-5 w-5" /> Guardar la contraseña</>}
            </Button>
            <Button variant="ghost" full onClick={() => void signOut()}>Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
