import { Button, Card, Sheet, cx } from './ui'
import { IconTrash } from './icons'
import { calcolaOre, round2 } from '../lib/calc'
import { dataLunga, euro, maiuscola, oreLabel, quandoLabel } from '../lib/format'
import type { Entry, Worker } from '../lib/types'

/* ------------------------------------------------- dettaglio di una giornata */

/**
 * Il conto di una singola giornata, passo per passo: da che ora a che ora,
 * quanto di pausa, e come si arriva alle ore pagate. Serve al titolare per
 * controllare senza dover rifare i calcoli a mente.
 */
export function DettaglioGiornata({ entry, worker, onClose, onElimina, perIlLavoratore }: {
  entry: Entry | null
  worker: Worker
  onClose: () => void
  /** Solo il titolare può cancellare: al lavoratore non si passa. */
  onElimina?: () => void
  /** Cambia solo il modo di dire chi l'ha registrata. */
  perIlLavoratore?: boolean
}) {
  if (!entry) return null

  const conOrari = Boolean(entry.start_time && entry.end_time)
  const lorde = conOrari ? calcolaOre(entry.start_time!, entry.end_time!, 0) : entry.hours
  const guadagno = round2(entry.hours * entry.hourly_rate)
  const laHaMessaLui = Boolean(worker.user_id) && entry.created_by === worker.user_id
  const notturno = conOrari && entry.end_time! < entry.start_time!

  return (
    <Sheet open onClose={onClose} title={maiuscola(dataLunga(entry.work_date))}>
      <div className="space-y-4">
        <div className="rounded-3xl bg-gradient-to-br from-ink-900 to-ink-700 px-6 py-6 text-center text-white">
          <p className="text-[40px] font-extrabold leading-none tracking-tight">{oreLabel(entry.hours)}</p>
          <p className="mt-2 text-[16px] font-semibold text-emerald-300">{euro(guadagno)}</p>
        </div>

        {conOrari ? (
          <>
            <Card className="divide-y divide-ink-100 ring-1 ring-ink-200">
              <Voce etichetta="Entró a las" valore={entry.start_time!} forte />
              <Voce etichetta="Salió a las" valore={entry.end_time!} forte />
              <Voce etichetta="Descanso" valore={entry.break_minutes === 0 ? 'ninguno' : `${entry.break_minutes} min`} />
            </Card>

            {notturno && (
              <p className="rounded-2xl bg-brand-50 px-4 py-3 text-[13px] font-medium text-brand-700">
                Turno de noche: salió al día siguiente.
              </p>
            )}

            <div>
              <p className="mb-2 px-1 text-[13px] font-semibold text-ink-500">Cómo salen esas horas</p>
              <Card className="divide-y divide-ink-100 ring-1 ring-ink-200">
                <Voce etichetta="Desde que entró hasta que salió" valore={oreLabel(lorde)} />
                <Voce etichetta="Menos el descanso"
                      valore={entry.break_minutes === 0 ? '—' : `− ${oreLabel(entry.break_minutes / 60)}`} />
                <Voce etichetta="Horas que se pagan" valore={oreLabel(entry.hours)} forte />
              </Card>
            </div>
          </>
        ) : (
          <Card className="px-5 py-4 ring-1 ring-ink-200">
            <p className="text-[14px] text-ink-500">
              Esta jornada se apuntó solo con el total de horas, sin la hora de entrada y salida.
            </p>
          </Card>
        )}

        <div>
          <p className="mb-2 px-1 text-[13px] font-semibold text-ink-500">Cuánto se le paga</p>
          <Card className="divide-y divide-ink-100 ring-1 ring-ink-200">
            <Voce etichetta="Horas" valore={oreLabel(entry.hours)} />
            <Voce etichetta="Tarifa de ese día" valore={`${euro(entry.hourly_rate)}/h`} />
            <Voce etichetta="Total de la jornada" valore={euro(guadagno)} forte />
          </Card>
        </div>

        <p className="px-1 text-[12.5px] leading-relaxed text-ink-400">
          {perIlLavoratore
            ? (laHaMessaLui
                ? `La apuntaste tú ${quandoLabel(entry.created_at)}.`
                : `La añadió tu jefe ${quandoLabel(entry.created_at)}.`)
            : (laHaMessaLui
                ? `La apuntó ${worker.name.split(' ')[0]} ${quandoLabel(entry.created_at)}.`
                : `La añadiste tú ${quandoLabel(entry.created_at)}.`)}
        </p>

        {onElimina && (
          <Button variant="danger" full onClick={onElimina}>
            <IconTrash className="h-4 w-4" /> Eliminar esta jornada
          </Button>
        )}
      </div>
    </Sheet>
  )
}

function Voce({ etichetta, valore, forte }: { etichetta: string; valore: string; forte?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <span className={cx('text-[14px]', forte ? 'font-semibold text-ink-900' : 'text-ink-500')}>{etichetta}</span>
      <span className={cx('shrink-0 tabular-nums', forte ? 'text-[16px] font-extrabold text-ink-900' : 'text-[15px] font-semibold text-ink-700')}>
        {valore}
      </span>
    </div>
  )
}
