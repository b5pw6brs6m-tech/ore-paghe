import { useEffect, type ReactNode } from 'react'
import { IconX } from './icons'
import { iniziali } from '../lib/format'

export const cx = (...v: Array<string | false | null | undefined>) => v.filter(Boolean).join(' ')

/* ---------------------------------------------------------------- Button */

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'soft' | 'ghost' | 'danger' | 'success'
  size?: 'md' | 'lg'
  disabled?: boolean
  full?: boolean
  className?: string
}

export function Button({ children, onClick, type = 'button', variant = 'primary', size = 'md', disabled, full, className }: ButtonProps) {
  const stile = {
    primary: 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 active:bg-brand-700',
    success: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 active:bg-emerald-700',
    soft:    'bg-brand-50 text-brand-700 active:bg-brand-100',
    ghost:   'bg-white text-ink-700 ring-1 ring-ink-200 active:bg-ink-50',
    danger:  'bg-rose-50 text-rose-600 active:bg-rose-100',
  }[variant]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-[transform,background-color] duration-150',
        'active:scale-[.97] disabled:opacity-40 disabled:pointer-events-none',
        size === 'lg' ? 'px-6 py-4 text-[17px]' : 'px-4 py-3 text-[15px]',
        full && 'w-full',
        stile,
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ Card */

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={cx(
        'w-full rounded-3xl bg-white shadow-[0_1px_3px_rgba(15,23,42,.06),0_8px_24px_-12px_rgba(15,23,42,.12)]',
        onClick && 'text-left transition-transform duration-150 active:scale-[.985]',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

/* ----------------------------------------------------------------- Field */

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-500">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] leading-snug text-ink-400">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'w-full rounded-2xl bg-ink-50 px-4 py-3.5 text-ink-900 ring-1 ring-ink-200 outline-none ' +
  'placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500 transition'

/* ----------------------------------------------------------------- Sheet */

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px] animate-pop" onClick={onClose} />
      <div className="relative w-full max-w-[480px] animate-rise rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px] max-h-[92vh] overflow-y-auto safe-bottom">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-[28px] border-b border-ink-100 bg-white/95 px-5 py-4 backdrop-blur">
          <h2 className="text-[17px] font-bold text-ink-900">{title}</h2>
          <button onClick={onClose} aria-label="Chiudi" className="rounded-full bg-ink-100 p-2 text-ink-500 active:scale-90 transition">
            <IconX className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Avatar */

const COLORI = [
  'from-indigo-500 to-violet-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500', 'from-sky-500 to-blue-500', 'from-fuchsia-500 to-purple-500',
]

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={cx('flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-bold text-white', COLORI[h % COLORI.length])}
    >
      {iniziali(name)}
    </div>
  )
}

/* --------------------------------------------------------------- Spinner */

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('animate-spin', className ?? 'h-5 w-5')} fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Caricamento({ testo = 'Caricamento…' }: { testo?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-400">
      <Spinner className="h-7 w-7 text-brand-500" />
      <p className="text-sm font-medium">{testo}</p>
    </div>
  )
}

/* ------------------------------------------------------------ EmptyState */

export function Vuoto({ icona, titolo, testo, azione }: { icona: ReactNode; titolo: string; testo: string; azione?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-ink-200 bg-white/60 px-6 py-12 text-center">
      <div className="rounded-2xl bg-ink-100 p-3 text-ink-400">{icona}</div>
      <div>
        <p className="font-bold text-ink-900">{titolo}</p>
        <p className="mt-1 text-sm text-ink-500">{testo}</p>
      </div>
      {azione}
    </div>
  )
}

/* --------------------------------------------------------------- Avvisi */

export function Errore({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p className="animate-pop rounded-2xl bg-rose-50 px-4 py-3 text-[14px] font-medium text-rose-700 ring-1 ring-rose-100">
      {children}
    </p>
  )
}
