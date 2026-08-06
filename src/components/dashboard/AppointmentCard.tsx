'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Appointment } from '@/types'
import { Clock, User, Smartphone, MessageCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { buildWaLink, tplReminderText } from '@/lib/wa-link'

const statusStyles: Record<string, string> = {
  confirmed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
  completed: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  no_show: 'bg-red-500/15 text-red-300 border-red-500/30',
}

const statusLabel: Record<string, string> = {
  confirmed: 'Confirmada',
  pending: 'Pendiente',
  cancelled: 'Cancelada',
  completed: 'Completada',
  no_show: 'No asistio',
}

export function AppointmentCard({ appt, businessName }: { appt: Appointment; businessName?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const depositPending = appt.deposit_status === 'pending'

  async function verifyDeposit(verified: boolean) {
    setLoading(true)
    const res = await fetch(`/api/appointments/${appt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: verified ? 'confirmed' : 'cancelled',
        deposit_status: verified ? 'verified' : 'rejected',
      }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(json.error ?? 'Error al actualizar'); return }
    toast.success(verified ? 'Pago verificado, cita confirmada' : 'Pago rechazado, cita cancelada')
    router.refresh()
  }

  const waLink = buildWaLink(
    appt.client_phone,
    tplReminderText({
      client_name: appt.client_name,
      business_name: businessName ?? '',
      service_name: appt.service?.name ?? '',
      staff_name: appt.staff?.name ?? '',
      date: format(new Date(appt.starts_at), "EEEE d 'de' MMMM", { locale: es }),
      time: format(new Date(appt.starts_at), 'HH:mm'),
    }),
  )

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 transition hover:border-primary/30">
      <div className="grid place-items-center size-12 rounded-lg bg-primary/15 text-primary text-sm font-semibold shrink-0">
        {format(new Date(appt.starts_at), 'HH:mm')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{appt.client_name}</p>
        <p className="text-sm text-muted-foreground truncate flex items-center gap-2">
          <Clock className="size-3" />
          {appt.service?.name ?? 'Servicio'}
          {appt.staff && (
            <>
              <span>&middot;</span>
              <User className="size-3" />
              {appt.staff.name}
            </>
          )}
        </p>
        {depositPending && (
          <p className="mt-1 flex items-center gap-1 text-xs text-amber-400">
            <Smartphone className="size-3" /> Yape: {appt.deposit_ref}
          </p>
        )}
      </div>

      {depositPending ? (
        <div className="flex gap-1.5 shrink-0">
          <Button size="sm" disabled={loading} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500" onClick={() => verifyDeposit(true)}>
            Confirmar
          </Button>
          <Button size="sm" disabled={loading} variant="outline" className="h-8 text-xs border-red-500/30 text-red-300 hover:bg-red-500/10" onClick={() => verifyDeposit(false)}>
            Rechazar
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          {appt.status === 'confirmed' && (
            <a href={waLink} target="_blank" rel="noopener noreferrer" title="Enviar recordatorio por WhatsApp">
              <Button size="icon" variant="outline" className="size-8 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10">
                <MessageCircle className="size-4" />
              </Button>
            </a>
          )}
          <span
            className={`text-xs px-2.5 py-1 rounded-full border ${
              statusStyles[appt.status] ?? statusStyles.pending
            }`}
          >
            {statusLabel[appt.status] ?? appt.status}
          </span>
        </div>
      )}
    </div>
  )
}
