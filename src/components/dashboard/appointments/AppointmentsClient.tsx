'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Search, MoreHorizontal, CheckCircle2, XCircle, UserX, CalendarX2, Plus } from 'lucide-react'
import type { Appointment, AppointmentStatus } from '@/types'
import { useRouter } from 'next/navigation'
import { NewAppointmentDialog } from './NewAppointmentDialog'

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  confirmed:  'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  pending:    'bg-amber-500/15 text-amber-300 border-amber-500/30',
  completed:  'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  cancelled:  'bg-red-500/15 text-red-300 border-red-500/30',
  no_show:    'bg-red-500/15 text-red-300 border-red-500/30',
}
const STATUS_LABEL: Record<AppointmentStatus, string> = {
  confirmed: 'Confirmada', pending: 'Pendiente',
  completed: 'Completada', cancelled: 'Cancelada', no_show: 'No asistio',
}

export function AppointmentsClient({ appointments: initial, businessId }: { appointments: Appointment[]; businessId: string }) {
  const router = useRouter()
  const [appointments, setAppointments] = useState(initial)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [newOpen, setNewOpen] = useState(false)

  const filtered = appointments
    .filter(a => statusFilter === 'all' || a.status === statusFilter)
    .filter(a => !search || a.client_name.toLowerCase().includes(search.toLowerCase()) || a.client_phone.includes(search))

  async function changeStatus(appt: Appointment, status: AppointmentStatus) {
    const supabase = createClient()
    const { error } = await supabase.from('appointments').update({ status }).eq('id', appt.id)
    if (error) { toast.error(error.message); return }
    toast.success(`Cita marcada como ${STATUS_LABEL[status].toLowerCase()}`)
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status } : a))
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Citas</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} de {appointments.length} citas</p>
        </div>
        <Button onClick={() => setNewOpen(true)} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="size-4" /> Nueva cita
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="confirmed">Confirmadas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
            <SelectItem value="no_show">No asistio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <div className="mx-auto grid place-items-center size-12 rounded-full bg-muted text-muted-foreground mb-4">
            <CalendarX2 className="size-5" />
          </div>
          <p className="font-medium">Sin citas</p>
          <p className="text-sm text-muted-foreground mt-1">No hay citas que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Servicio</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Barbero</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={a.id} className={`border-b border-border/60 hover:bg-muted/20 transition ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.client_name}</p>
                    <p className="text-xs text-muted-foreground">{a.client_phone}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{a.service?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{a.staff?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {format(new Date(a.starts_at), "d MMM · HH:mm", { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_STYLES[a.status]}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.status !== 'completed' && a.status !== 'cancelled' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => changeStatus(a, 'confirmed')}>
                            <CheckCircle2 className="size-3.5 mr-2 text-emerald-400" /> Confirmar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => changeStatus(a, 'completed')}>
                            <CheckCircle2 className="size-3.5 mr-2" /> Completar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => changeStatus(a, 'no_show')}>
                            <UserX className="size-3.5 mr-2 text-amber-400" /> No asistio
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => changeStatus(a, 'cancelled')} className="text-destructive">
                            <XCircle className="size-3.5 mr-2" /> Cancelar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <NewAppointmentDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        businessId={businessId}
        onCreated={() => router.refresh()}
      />
    </div>
  )
}
