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
  const [nome, setNome] = useState('')
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
        if (nome.trim().length < 2) throw new Error('Scrivi il tuo nome.')
        const { needsConfirm } = await db.signUpAdmin(login, password, nome)
        if (needsConfirm) {
          setAvviso('Account creato. Controlla la tua email per confermarlo, poi entra.')
          setModo('entra')
          return
        }
      }
      refresh()
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Qualcosa è andato storto.')
    } finally {
      setAttesa(false)
    }
  }

  async function provaCome(l: string) {
    setErrore(''); setAttesa(true)
    try {
      await db.signIn(l, 'demo')
      refresh()
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Errore')
    } finally { setAttesa(false) }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-brand-700 via-brand-600 to-brand-500">
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col px-5 safe-top safe-bottom">

        <header className="flex flex-col items-center pt-14 pb-8 text-center text-white">
          <div className="mb-4 rounded-[22px] bg-white/15 p-4 ring-1 ring-white/25 backdrop-blur">
            <IconClock className="h-9 w-9" />
          </div>
          <h1 className="text-[30px] font-extrabold tracking-tight">Ore &amp; Paghe</h1>
          <p className="mt-1.5 text-[15px] text-white/80">Le ore lavorate e quanto ti spetta, sempre in chiaro.</p>
        </header>

        <div className="animate-rise rounded-[28px] bg-white p-6 shadow-2xl">
          <div className="mb-5 flex rounded-2xl bg-ink-100 p-1">
            {([['entra', 'Entra'], ['registra', 'Nuovo titolare']] as const).map(([k, t]) => (
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
              <Field label="Il tuo nome">
                <input className={inputCls} value={nome} onChange={e => setNome(e.target.value)}
                       placeholder="Mario Rossi" autoComplete="name" />
              </Field>
            )}

            <Field label={modo === 'entra' ? 'Nome utente o email' : 'La tua email'}>
              <input className={inputCls} value={login} onChange={e => setLogin(e.target.value)}
                     placeholder={modo === 'entra' ? 'carlo' : 'mario@email.it'}
                     autoCapitalize="none" autoCorrect="off" spellCheck={false}
                     autoComplete={modo === 'entra' ? 'username' : 'email'} />
            </Field>

            <Field label="Password" hint={modo === 'registra' ? 'Almeno 6 caratteri.' : undefined}>
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
              {attesa ? <Spinner /> : modo === 'entra' ? 'Entra' : 'Crea il mio account'}
            </Button>
          </form>

          {modo === 'entra' && (
            <p className="mt-4 text-center text-[13px] leading-relaxed text-ink-400">
              Sei un lavoratore? Usa il nome utente e la password
              <br />che ti ha dato il titolare.
            </p>
          )}
        </div>

        {isDemo && (
          <div className="mt-5 animate-rise rounded-3xl bg-white/12 p-5 text-white ring-1 ring-white/20 backdrop-blur">
            <div className="mb-3 flex items-center gap-2">
              <IconInfo className="h-4 w-4" />
              <p className="text-[13px] font-bold uppercase tracking-wide">Modalità dimostrativa</p>
            </div>
            <p className="mb-4 text-[14px] leading-relaxed text-white/80">
              Il cloud non è ancora collegato: i dati restano su questo dispositivo.
              Entra con un profilo di prova per vedere come funziona.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="ghost" onClick={() => provaCome('demo@ore.app')} disabled={attesa}>Sono il titolare</Button>
              <Button variant="ghost" onClick={() => provaCome('carlo@ore.app')} disabled={attesa}>Sono Carlo</Button>
            </div>
          </div>
        )}

        <div className="flex-1" />
        <p className="py-6 text-center text-[12px] text-white/50">
          Aggiungi l’app alla schermata Home per usarla come una vera app.
        </p>
      </div>
    </div>
  )
}
