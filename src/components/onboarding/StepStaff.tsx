'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Users, Plus, Trash2 } from 'lucide-react'
import { limitsForPlan } from '@/lib/plans'
import type { OnboardingState } from './OnboardingWizard'

interface StaffDraft { name: string }

// El negocio arranca en 'trial', que aplica los limites de Starter.
const MAX_STAFF = limitsForPlan('trial').maxStaff ?? Infinity

interface Props {
  state: OnboardingState
  updateState: (p: Partial<OnboardingState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepStaff({ state, updateState, onNext, onBack }: Props) {
  const [staffList, setStaffList] = useState<StaffDraft[]>([{ name: '' }])
  const [loading, setLoading] = useState(false)

  function add() {
    if (staffList.length >= MAX_STAFF) {
      toast.error(`Tu plan de prueba permite hasta ${MAX_STAFF} barberos. Podras subir de plan mas adelante.`)
      return
    }
    setStaffList(prev => [...prev, { name: '' }])
  }
  function remove(i: number) { setStaffList(prev => prev.filter((_, idx) => idx !== i)) }
  function update(i: number, val: string) {
    setStaffList(prev => prev.map((s, idx) => idx === i ? { name: val } : s))
  }

  async function save() {
    const valid = staffList.filter(s => s.name.trim())
    if (valid.length === 0) { toast.error('Agrega al menos un barbero'); return }
    setLoading(true)
    const supabase = createClient()

    const { data: staffData, error } = await supabase
      .from('staff')
      .insert(valid.map(s => ({ name: s.name, business_id: state.businessId })))
      .select('id')
    if (error) { toast.error(error.message); setLoading(false); return }

    const staffIds = (staffData ?? []).map((d: { id: string }) => d.id)

    // Assign all services to all staff
    if (staffIds.length > 0 && state.serviceIds.length > 0) {
      const pivot = staffIds.flatMap((sid: string) =>
        state.serviceIds.map((svcId: string) => ({ staff_id: sid, service_id: svcId }))
      )
      await supabase.from('staff_services').insert(pivot)
    }

    setLoading(false)
    updateState({ staffIds })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="grid place-items-center size-10 rounded-lg bg-primary/15 text-primary mb-4">
          <Users className="size-5" />
        </div>
        <h2 className="text-xl font-semibold">Tu equipo</h2>
        <p className="text-sm text-muted-foreground mt-1">Agrega los barberos o estilistas de tu local. Podras editar sus servicios despues.</p>
      </div>

      <div className="space-y-3">
        {staffList.map((s, i) => (
          <div key={i} className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              {i === 0 && <Label className="text-xs">Nombre</Label>}
              <Input
                placeholder={`Barbero ${i + 1}`}
                value={s.name}
                onChange={e => update(i, e.target.value)}
              />
            </div>
            {staffList.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive mb-0">
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={add} className="gap-2">
        <Plus className="size-4" /> Agregar barbero
      </Button>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1">← Volver</Button>
        <Button onClick={save} disabled={loading} className="flex-1 bg-primary hover:bg-primary/90">
          {loading ? <Loader2 className="size-4 animate-spin" /> : 'Continuar →'}
        </Button>
      </div>
    </div>
  )
}
