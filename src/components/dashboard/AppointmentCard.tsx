import type { Appointment } from '@/types'
import { Clock, User } from 'lucide-react'
import { format } from 'date-fns'

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

export function AppointmentCard({ appt }: { appt: Appointment }) {
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
      </div>
      <span
        className={`text-xs px-2.5 py-1 rounded-full border ${
          statusStyles[appt.status] ?? statusStyles.pending
        }`}
      >
        {statusLabel[appt.status] ?? appt.status}
      </span>
    </div>
  )
}
