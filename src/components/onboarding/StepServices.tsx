'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Scissors, Plus, Trash2 } from 'lucide-react'
import type { OnboardingState } from './OnboardingWizard'

const DEFAULT_SERVICES = [
  { name: 'Corte clasico', duration_min: 30, price: 25 },
  { name: 'Corte + Barba', duration_min: 45, price: 35 },
  { name: 'Barba', duration_min: 20, price: 15 },
  { name: 'Degradado', duration_min: 40, price: 30 },
]

interface ServiceDraft { name: string; duration_min: number; price: number }

interface Props {
  state: OnboardingState
  updateState: (p: Partial<OnboardingState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepServices({ state, updateState, onNext, onBack }: Props) {
  const [services, setServices] = useState<ServiceDraft[]>([
    { name: '', duration_min: 30, price: 0 },
  ])
  const [loading, setLoading] = useState(false)

  function addDefault(s: ServiceDraft) {
    setServices(prev => [...prev.filter(x => x.name), s])
  }

  function add() {
    setServices(prev => [...prev, { name: '', duration_min: 30, price: 0 }])
  }

  function remove(i: number) {
    setServices(prev => prev.filter((_, idx) => idx !== i))
  }

  function update(i: number, field: keyof ServiceDraft, val: string) {
    setServices(prev => prev.map((s, idx) => idx === i
      ? { ...s, [field]: field === 'name' ? val : Number(val) }
      : s
    ))
  }

  async function save() {
    const valid = services.filter(s => s.name.trim())
    if (valid.length === 0) { toast.error('Agrega al menos un servicio'); return }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('services')
      .insert(valid.map(s => ({ ...s, business_id: state.businessId })))
      .select('id')
    setLoading(false)
    if (error) { toast.error(error.message); return }
    updateState({ serviceIds: (data ?? []).map((d: { id: string }) => d.id) })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="grid place-items-center size-10 rounded-lg bg-primary/15 text-primary mb-4">
          <Scissors className="size-5" />
        </div>
        <h2 className="text-xl font-semibold">Tus servicios</h2>
        <p className="text-sm text-muted-foreground mt-1">Agrega los servicios que ofreces y su duracion en minutos.</p>
      </div>

      {/* Quick add */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Agregar rapido:</p>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_SERVICES.map(s => (
            <Badge
              key={s.name}
              variant="outline"
              className="cursor-pointer hover:border-primary hover:text-primary transition"
              onClick={() => addDefault(s)}
            >
              + {s.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Service rows */}
      <div className="space-y-3">
        {services.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-end">
            <div className="space-y-1">
              {i === 0 && <Label className="text-xs">Servicio</Label>}
              <Input placeholder="Corte clasico" value={s.name} onChange={e => update(i, 'name', e.target.value)} />
            </div>
            <div className="space-y-1">
              {i === 0 && <Label className="text-xs">Min.</Label>}
              <Input type="number" min={5} value={s.duration_min} onChange={e => update(i, 'duration_min', e.target.value)} />
            </div>
            <div className="space-y-1">
              {i === 0 && <Label className="text-xs">S/. precio</Label>}
              <Input type="number" min={0} value={s.price} onChange={e => update(i, 'price', e.target.value)} />
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive mt-auto">
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={add} className="gap-2">
        <Plus className="size-4" /> Agregar servicio
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
