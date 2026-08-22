import { useState } from 'react'
import { Button, Errore, Field, inputCls, Spinner } from '../components/ui'
import { IconClock, IconInfo } from '../components/icons'
import { db, isDemo } from '../lib/db'
import { useApp } from '../context/AppContext'

/**
 * Non c'è registrazione: il titolare è uno solo e gli accessi dei lavoratori
 * li crea lui dall'app. Anche il database rifiuta ogni altra registrazione.
 */
export default function Login() {
  const { refresh } = useApp()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState('')
  const [attesa, setAttesa] = useState(false)

  async function invia(e: React.FormEvent) {
    e.preventDefault()
    setErrore(''); setAttesa(true)
    try {
      await db.signIn(login, password)
      refresh()
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Algo ha salido mal.')
    } finally {
      setAttesa(false)
    }
  }

  async function probarCon(l: string) {
    setErrore(''); setAttesa(true)
    try {
      await db.signIn(l, 'demo')
      refresh()
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Error')
    } finally { setAttesa(false) }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-brand-700 via-brand-600 to-brand-500">
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col px-5 safe-top safe-bottom">

        <header className="flex flex-col items-center pt-16 pb-8 text-center text-white">
          <div className="mb-4 rounded-[22px] bg-white/15 p-4 ring-1 ring-white/25 backdrop-blur">
            <IconClock className="h-9 w-9" />
          </div>
          <h1 className="text-[30px] font-extrabold tracking-tight">Horas y Pagos</h1>
          <p className="mt-1.5 text-[15px] text-white/80">Las horas trabajadas y lo que te toca cobrar, siempre claro.</p>
        </header>

        <div className="animate-rise rounded-[28px] bg-white p-6 shadow-2xl">
          <h2 className="mb-5 text-center text-[17px] font-bold text-ink-900">Entra con tus datos</h2>

          <form onSubmit={invia} className="space-y-4">
            <Field label="Usuario">
              <input className={inputCls} value={login} onChange={e => setLogin(e.target.value)}
                     placeholder="carlos"
                     autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" />
            </Field>

            <Field label="Contraseña">
              <input className={inputCls} type="password" value={password} onChange={e => setPassword(e.target.value)}
                     placeholder="••••••" autoComplete="current-password" />
            </Field>

            <Errore>{errore}</Errore>

            <Button type="submit" size="lg" full disabled={attesa || !login || !password}>
              {attesa ? <Spinner /> : 'Entrar'}
            </Button>
          </form>

          <p className="mt-5 border-t border-ink-100 pt-4 text-center text-[13px] leading-relaxed text-ink-400">
            Usa el usuario y la contraseña que te ha dado el jefe.
            <br />Aquí no se crean cuentas: las crea él.
          </p>
        </div>

        {isDemo && (
          <div className="mt-5 animate-rise rounded-3xl bg-white/12 p-5 text-white ring-1 ring-white/20 backdrop-blur">
            <div className="mb-3 flex items-center gap-2">
              <IconInfo className="h-4 w-4" />
              <p className="text-[13px] font-bold uppercase tracking-wide">Modo de prueba</p>
            </div>
            <p className="mb-4 text-[14px] leading-relaxed text-white/80">
              La base de datos aún no está conectada: los datos se quedan en este dispositivo.
              Entra con un perfil de prueba para ver cómo funciona.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="ghost" onClick={() => probarCon('demo@ore.app')} disabled={attesa}>Soy el jefe</Button>
              <Button variant="ghost" onClick={() => probarCon('demo-carlos@ore.app')} disabled={attesa}>Soy Carlos</Button>
            </div>
          </div>
        )}

        <div className="flex-1" />
        <p className="py-6 text-center text-[12px] text-white/50">
          Añade la app a la pantalla de inicio para usarla como una app normal.
        </p>
      </div>
    </div>
  )
}
