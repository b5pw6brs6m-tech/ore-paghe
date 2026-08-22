import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useApp } from '../context/AppContext'
import { controllaAggiornamenti } from '../lib/aggiornamento'

/**
 * Trascinando verso il basso dall'alto della schermata, l'app ricarica i dati
 * e controlla se è uscita una versione nuova. È il gesto che tutti conoscono
 * dalle altre app, e serve perché una app installata sul telefono non si
 * aggiorna da sola mentre la si sta guardando.
 */

const SOGLIA = 70          // quanto bisogna tirare perché parta
const MASSIMO = 110        // oltre non scende più
const RESISTENZA = 0.5     // il dito corre il doppio dell'indicatore

export function TiraPerAggiornare({ children }: { children: ReactNode }) {
  const { refresh } = useApp()
  const [tiro, setTiro] = useState(0)
  const [aggiornando, setAggiornando] = useState(false)

  const partenza = useRef<number | null>(null)
  const tiroOra = useRef(0)
  const occupato = useRef(false)

  useEffect(() => {
    const inizia = (e: TouchEvent) => {
      if (occupato.current || window.scrollY > 0 || e.touches.length !== 1) {
        partenza.current = null
        return
      }
      partenza.current = e.touches[0].clientY
    }

    const trascina = (e: TouchEvent) => {
      if (partenza.current === null) return
      const dy = e.touches[0].clientY - partenza.current
      if (dy <= 0 || window.scrollY > 0) {
        partenza.current = null
        tiroOra.current = 0
        setTiro(0)
        return
      }
      e.preventDefault()                       // niente rimbalzo della pagina
      const q = Math.min(MASSIMO, dy * RESISTENZA)
      tiroOra.current = q
      setTiro(q)
    }

    const lascia = () => {
      if (partenza.current === null) return
      partenza.current = null
      const q = tiroOra.current

      if (q < SOGLIA) {
        tiroOra.current = 0
        setTiro(0)
        return
      }

      occupato.current = true
      setAggiornando(true)
      setTiro(SOGLIA)

      // Ricarica i dati e chiede se c'è una versione nuova dell'app.
      // Il minimo di attesa serve solo a far vedere che sta lavorando.
      Promise.all([
        controllaAggiornamenti(),
        new Promise(r => setTimeout(r, 700)),
      ]).finally(() => {
        refresh()
        occupato.current = false
        setAggiornando(false)
        tiroOra.current = 0
        setTiro(0)
      })
    }

    window.addEventListener('touchstart', inizia, { passive: true })
    window.addEventListener('touchmove', trascina, { passive: false })
    window.addEventListener('touchend', lascia, { passive: true })
    window.addEventListener('touchcancel', lascia, { passive: true })
    return () => {
      window.removeEventListener('touchstart', inizia)
      window.removeEventListener('touchmove', trascina)
      window.removeEventListener('touchend', lascia)
      window.removeEventListener('touchcancel', lascia)
    }
  }, [refresh])

  const pronto = tiro >= SOGLIA
  const visibile = tiro > 4 || aggiornando

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center safe-top"
        style={{
          transform: `translateY(${tiro}px)`,
          opacity: visibile ? 1 : 0,
          transition: partenza.current === null ? 'transform .3s cubic-bezier(.22,1,.36,1), opacity .2s' : 'none',
        }}
      >
        <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-ink-200">
          <svg
            viewBox="0 0 24 24" className="h-5 w-5 text-brand-600"
            fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
            style={{
              transform: aggiornando ? undefined : `rotate(${Math.min(180, (tiro / SOGLIA) * 180)}deg)`,
              animation: aggiornando ? 'spin 1s linear infinite' : undefined,
            }}
          >
            {aggiornando ? (
              <>
                <circle cx="12" cy="12" r="9" strokeOpacity=".2" />
                <path d="M21 12a9 9 0 0 0-9-9" />
              </>
            ) : (
              <>
                <path d="M12 5v13" />
                <path d="M6.5 12.5 12 18l5.5-5.5" opacity={pronto ? 1 : 0.45} />
              </>
            )}
          </svg>
        </div>
      </div>

      {children}
    </>
  )
}
