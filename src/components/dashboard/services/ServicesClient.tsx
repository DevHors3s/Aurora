'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ServiceDialog } from './ServiceDialog'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Pencil, Trash2, ToggleLeft, Scissors } from 'lucide-react'
import type { Service } from '@/types'
import { useRouter } from 'next/navigation'

export function ServicesClient({ services: initial, businessId }: { services: Service[]; businessId: string }) {
  const router = useRouter()
  const [services, setServices] = useState(initial)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [, startTransition] = useTransition()

  function refresh() {
    startTransition(() => router.refresh())
    const supabase = createClient()
    supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at')
      .then(({ data }) => setServices((data as Service[]) ?? []))
  }

  async function toggleActive(s: Service) {
    const supabase = createClient()
    await supabase.from('services').update({ is_active: !s.is_active }).eq('id', s.id)
    toast.success(s.is_active ? 'Servicio desactivado' : 'Servicio activado')
    refresh()
  }

  async function remove(s: Service) {
    if (!confirm(`¿Eliminar "${s.name}"?`)) return
    const supabase = createClient()
    await supabase.from('services').delete().eq('id', s.id)
    toast.success('Servicio eliminado')
    refresh()
  }

  function openCreate() { setEditing(null); setDialogOpen(true) }
  function openEdit(s: Service) { setEditing(s); setDialogOpen(true) }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Servicios</h1>
          <p className="text-muted-foreground text-sm mt-1">{services.length} servicio{services.length !== 1 ? 's' : ''} registrado{services.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="size-4" /> Nuevo servicio
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <div className="mx-auto grid place-items-center size-12 rounded-full bg-muted text-muted-foreground mb-4">
            <Scissors className="size-5" />
          </div>
          <p className="font-medium">Sin servicios aun</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Agrega los servicios que ofreces tu negocio.</p>
          <Button onClick={openCreate} variant="outline" className="gap-2">
            <Plus className="size-4" /> Agregar servicio
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => (
            <div key={s.id} className={`rounded-2xl border bg-card p-5 flex flex-col gap-3 transition ${s.is_active ? 'border-border' : 'border-border/40 opacity-60'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  {s.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 -mr-1 -mt-1">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(s)}><Pencil className="size-3.5 mr-2" /> Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleActive(s)}><ToggleLeft className="size-3.5 mr-2" /> {s.is_active ? 'Desactivar' : 'Activar'}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => remove(s)} className="text-destructive"><Trash2 className="size-3.5 mr-2" /> Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <Badge variant="secondary" className="text-xs">{s.duration_min} min</Badge>
                {s.price != null && <Badge variant="outline" className="text-xs">S/. {s.price}</Badge>}
                <Badge variant={s.is_active ? 'default' : 'secondary'} className={`text-xs ml-auto ${s.is_active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20' : ''}`}>
                  {s.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <ServiceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        service={editing}
        businessId={businessId}
        onSaved={refresh}
      />
    </>
  )
}
