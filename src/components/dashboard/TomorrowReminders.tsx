'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MessageCircle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { buildWaLink, tplReminderText } from '@/lib/wa-link'

export interface TomorrowReminderRow {
  reminderId: string
  clientName: string
  clientPhone: string
  startsAt: string
  serviceName: string
  staffName: string
}

// Widget de recordatorios asistidos: WhatsApp automatico (WABA/Twilio) esta
// escrito y listo (ver src/lib/whatsapp.ts + cron), pero requiere verificacion
// de negocio ante Meta y cuesta por mensaje. Mientras tanto, esto le da al
// dueño el mismo resultado en 1 clic: abre WhatsApp con el mensaje ya armado.
export function TomorrowReminders({ rows, businessName }: { rows: TomorrowReminderRow[]; businessName: string }) {
  const router = useRouter()
  const [sent, setSent] = useState<Set<string>>(new Set())

  if (rows.length === 0) return null

  async function markSent(reminderId: string) {
    setSent(prev => new Set(prev).add(reminderId))
    const res = await fetch(`/api/reminders/${reminderId}`, { method: 'PATCH' })
    if (!res.ok) {
      setSent(prev => { const next = new Set(prev); next.delete(reminderId); return next })
      return
    }
    router.refresh()
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Recordatorios de mañana</h2>
      <div className="space-y-2">
        {rows.map((r) => {
          const isSent = sent.has(r.reminderId)
          const link = buildWaLink(r.clientPhone, tplReminderText({
            client_name: r.clientName,
            business_name: businessName,
            service_name: r.serviceName,
            staff_name: r.staffName,
            date: format(new Date(r.startsAt), "EEEE d 'de' MMMM", { locale: es }),
            time: format(new Date(r.startsAt), 'HH:mm'),
          }))
          return (
            <div key={r.reminderId} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-medium truncate">{r.clientName}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(r.startsAt), 'HH:mm')} &middot; {r.serviceName}
                </p>
              </div>
              <a href={link} target="_blank" rel="noopener noreferrer" onClick={() => markSent(r.reminderId)}>
                <Button
                  size="sm"
                  variant={isSent ? 'outline' : 'default'}
                  className={isSent ? 'text-xs' : 'text-xs bg-primary hover:bg-primary/90'}
                >
                  {isSent
                    ? <><CheckCircle2 className="size-3.5 mr-1.5" />Enviado</>
                    : <><MessageCircle className="size-3.5 mr-1.5" />Enviar</>}
                </Button>
              </a>
            </div>
          )
        })}
      </div>
    </section>
  )
}
