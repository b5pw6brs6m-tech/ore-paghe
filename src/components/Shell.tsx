import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cx } from './ui'

export type NavItem = { to: string; label: string; icon: ReactNode; end?: boolean }

export function Shell({ children, nav }: { children: ReactNode; nav: NavItem[] }) {
  return (
    <div className="min-h-full bg-ink-100">
      <div className="mx-auto min-h-screen max-w-[480px] bg-ink-100 pb-[92px]">
        {children}
      </div>
      <BottomNav items={nav} />
    </div>
  )
}

function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 safe-bottom">
      <div className="mx-auto max-w-[480px] px-4 pb-3">
        <div className="flex items-center justify-around rounded-[24px] border border-ink-200/70 bg-white/90 px-2 py-2 shadow-[0_8px_32px_-8px_rgba(15,23,42,.22)] backdrop-blur-xl">
          {items.map(it => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) => cx(
                'flex min-w-[72px] flex-col items-center gap-1 rounded-2xl px-3 py-2 transition',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-400 active:bg-ink-50',
              )}
            >
              {it.icon}
              <span className="text-[11px] font-semibold leading-none">{it.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}

/** Intestazione blu con saluto e azione a destra. */
export function Header({ occhiello, titolo, azione, children }: {
  occhiello?: string
  titolo: string
  azione?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="rounded-b-[32px] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-5 pb-7 pt-4 text-white safe-top">
      <div className="flex items-start justify-between gap-3 pt-3">
        <div className="min-w-0">
          {occhiello && <p className="text-[13px] font-medium text-white/70">{occhiello}</p>}
          <h1 className="truncate text-[26px] font-extrabold leading-tight tracking-tight">{titolo}</h1>
        </div>
        {azione}
      </div>
      {children}
    </header>
  )
}

export function saluto(): string {
  const h = new Date().getHours()
  if (h < 13) return 'Buenos días'
  if (h < 21) return 'Buenas tardes'
  return 'Buenas noches'
}

export function Sezione({ titolo, azione, children }: { titolo: string; azione?: ReactNode; children: ReactNode }) {
  return (
    <section className="px-5 pt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-ink-900">{titolo}</h2>
        {azione}
      </div>
      {children}
    </section>
  )
}
