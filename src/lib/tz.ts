import { TZDate } from '@date-fns/tz'

/**
 * Dia de la semana (0=Domingo..6=Sabado) de una fecha calendario YYYY-MM-DD.
 * No depende de zona horaria: una fecha calendario tiene un unico dia de la
 * semana sin importar en que huso se interprete.
 */
export function dayOfWeekFromYMD(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/**
 * Convierte una fecha+hora "de pared" del negocio (YYYY-MM-DD, HH:mm) a un
 * instante real (Date UTC), interpretando esos numeros en la zona horaria
 * indicada (ej. 'America/Lima'). Evita el bug de usar la hora local del
 * servidor (que en Vercel es UTC) para horarios pensados en hora de Lima.
 */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const zoned = new TZDate(year, month - 1, day, hour, minute, 0, timeZone)
  return new Date(zoned.getTime())
}

/** Fecha (YYYY-MM-DD) de "hoy" segun la zona horaria del negocio. */
export function todayInZone(timeZone: string): string {
  const now = TZDate.tz(timeZone)
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
