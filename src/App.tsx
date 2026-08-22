import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Button, Caricamento, Vuoto } from './components/ui'
import { Shell, type NavItem } from './components/Shell'
import { IconClock, IconUsers, IconWallet } from './components/icons'
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
