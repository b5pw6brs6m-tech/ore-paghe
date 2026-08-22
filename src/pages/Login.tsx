import { useState } from 'react'
import { Button, Errore, Field, inputCls, Spinner } from '../components/ui'
import { IconClock, IconInfo } from '../components/icons'
import { db, isDemo } from '../lib/db'
import { useApp } from '../context/AppContext'

export default function Login() {
  const { refresh } = useApp()
  const [modo, setModo] = useState<'entra' | 'registra'>('entra')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [errore, setErrore] = useState('')
  const [avviso, setAvviso] = useState('')
  const [attesa, setAttesa] = useState(false)

  async function invia(e: React.FormEvent) {
    e.preventDefault()
    setErrore(''); setAvviso(''); setAttesa(true)
    try {
      if (modo === 'entra') {
        await db.signIn(login, password)
      } else {
        if (nombre.trim().length < 2) throw new Error('Escribe tu nombre.')
        const { needsConfirm } = await db.signUpAdmin(login, password, nombre)
        if (needsConfirm) {
          setAvviso('Cuenta creada. Confírmala desde tu correo y luego entra.')
          setModo('entra')
          return
        }
      }
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

        <header className="flex flex-col items-center pt-14 pb-8 text-center text-white">
          <div className="mb-4 rounded-[22px] bg-white/15 p-4 ring-1 ring-white/25 backdrop-blur">
            <IconClock className="h-9 w-9" />
          </div>
          <h1 className="text-[30px] font-extrabold tracking-tight">Horas y Pagos</h1>
          <p className="mt-1.5 text-[15px] text-white/80">Las horas trabajadas y lo que te toca cobrar, siempre claro.</p>
        </header>

        <div className="animate-rise rounded-[28px] bg-white p-6 shadow-2xl">
          <div className="mb-5 flex rounded-2xl bg-ink-100 p-1">
            {([['entra', 'Entrar'], ['registra', 'Soy el jefe']] as const).map(([k, t]) => (
              <button
                key={k}
                onClick={() => { setModo(k); setErrore(''); setAvviso('') }}
                className={`flex-1 rounded-xl py-2.5 text-[14px] font-semibold transition ${
                  modo === k ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <form onSubmit={invia} className="space-y-4">
            {modo === 'registra' && (
              <Field label="Tu nombre">
                <input className={inputCls} value={nombre} onChange={e => setNombre(e.target.value)}
                       placeholder="Miguel García" autoComplete="name" />
              </Field>
            )}

            <Field label={modo === 'entra' ? 'Usuario o correo' : 'Tu correo'}>
              <input className={inputCls} value={login} onChange={e => setLogin(e.target.value)}
                     placeholder={modo === 'entra' ? 'carlos' : 'miguel@correo.es'}
                     autoCapitalize="none" autoCorrect="off" spellCheck={false}
                     autoComplete={modo === 'entra' ? 'username' : 'email'} />
            </Field>

            <Field label="Contraseña" hint={modo === 'registra' ? 'Al menos 6 caracteres.' : undefined}>
              <input className={inputCls} type="password" value={password} onChange={e => setPassword(e.target.value)}
                     placeholder="••••••" autoComplete={modo === 'entra' ? 'current-password' : 'new-password'} />
            </Field>

            <Errore>{errore}</Errore>
            {avviso && (
              <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-[14px] font-medium text-emerald-700 ring-1 ring-emerald-100">
                {avviso}
              </p>
            )}

            <Button type="submit" size="lg" full disabled={attesa || !login || !password}>
              {attesa ? <Spinner /> : modo === 'entra' ? 'Entrar' : 'Crear mi cuenta'}
            </Button>
          </form>

          {modo === 'entra' && (
            <p className="mt-4 text-center text-[13px] leading-relaxed text-ink-400">
              ¿Eres trabajador? Usa el usuario y la contraseña
              <br />que te ha dado el jefe.
            </p>
          )}
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
