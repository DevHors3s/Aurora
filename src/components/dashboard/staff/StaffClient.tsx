'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { StaffDialog } from './StaffDialog'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Staff, Service } from '@/types'

export function StaffClient({ staff: initial, services, businessId }: {
  staff: Staff[]
  services: Service[]
  businessId: string
}) {
  const router = useRouter()
  const [staff, setStaff] = useState(initial)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [, startTransition] = useTransition()

  function refresh() {
    startTransition(() => router.refresh())
    const supabase = createClient()
    supabase.from('staff').select('*').eq('business_id', businessId).order('created_at')
      .then(({ data }) => setStaff((data as Staff[]) ?? []))
  }

  async function remove(s: Staff) {
    if (!confirm(`¿Eliminar a "${s.name}"?`)) return
    const supabase = createClient()
    await supabase.from('staff').delete().eq('id', s.id)
    toast.success('Barbero eliminado')
    refresh()
  }

  function openCreate() { setEditing(null); setDialogOpen(true) }
  function openEdit(s: Staff) { setEditing(s); setDialogOpen(true) }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Barberos</h1>
          <p className="text-muted-foreground text-sm mt-1">{staff.length} miembro{staff.length !== 1 ? 's' : ''} en el equipo</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="size-4" /> Nuevo barbero
        </Button>
      </div>

      {staff.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <div className="mx-auto grid place-items-center size-12 rounded-full bg-muted text-muted-foreground mb-4">
            <Users className="size-5" />
          </div>
          <p className="font-medium">Sin barberos aun</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Agrega a tu equipo para gestionar citas por barbero.</p>
          <Button onClick={openCreate} variant="outline" className="gap-2">
            <Plus className="size-4" /> Agregar barbero
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(s => (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="size-11">
                    <AvatarFallback className="bg-primary/15 text-primary font-semibold">
                      {s.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    {s.bio && <p className="text-xs text-muted-foreground line-clamp-1">{s.bio}</p>}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 -mr-1 -mt-1">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(s)}><Pencil className="size-3.5 mr-2" /> Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => remove(s)} className="text-destructive"><Trash2 className="size-3.5 mr-2" /> Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Badge variant={s.is_active ? 'default' : 'secondary'} className={`w-fit text-xs ${s.is_active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20' : ''}`}>
                {s.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <StaffDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        staff={editing}
        businessId={businessId}
        services={services}
        onSaved={refresh}
      />
    </>
  )
}
