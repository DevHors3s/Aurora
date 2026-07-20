'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Clock } from 'lucide-react'
import type { OnboardingState } from './OnboardingWizard'

const DAYS = [
  { label: 'Lunes', value: 1 },
  { label: 'Martes', value: 2 },
  { label: 'Miercoles', value: 3 },
  { label: 'Jueves', value: 4 },
  { label: 'Viernes', value: 5 },
  { label: 'Sabado', value: 6 },
  { label: 'Domingo', value: 0 },
]

interface DaySchedule { day: number; active: boolean; start: string; end: string }

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map(d => ({
  day: d.value,
  active: d.value !== 0,
  start: '09:00',
  end: '18:00',
}))

interface Props {
  state: OnboardingState
  updateState: (p: Partial<OnboardingState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepSchedule({ state, updateState, onNext, onBack }: Props) {
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE)
  const [loading, setLoading] = useState(false)

  function toggle(day: number) {
    setSchedule(prev => prev.map(d => d.day === day ? { ...d, active: !d.active } : d))
  }

  function setTime(day: number, field: 'start' | 'end', val: string) {
    setSchedule(prev => prev.map(d => d.day === day ? { ...d, [field]: val } : d))
  }

  async function save() {
    const active = schedule.filter(d => d.active)
    if (active.length === 0) { toast.error('Activa al menos un dia'); return }
    setLoading(true)
    const supabase = createClient()

    const rows = state.staffIds.flatMap((sid: string) =>
      active.map(d => ({
        staff_id: sid,
        day_of_week: d.day,
        start_time: d.start,
        end_time: d.end,
      }))
    )

    if (rows.length > 0) {
      const { error } = await supabase.from('schedules').insert(rows)
      if (error) { toast.error(error.message); setLoading(false); return }
    }

    setLoading(false)
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="grid place-items-center size-10 rounded-lg bg-primary/15 text-primary mb-4">
          <Clock className="size-5" />
        </div>
        <h2 className="text-xl font-semibold">Horario de atencion</h2>
        <p className="text-sm text-muted-foreground mt-1">Este horario se aplicara a todos tus barberos. Podras personalizarlo despues.</p>
      </div>

      <div className="space-y-2">
        {DAYS.map(({ label, value }) => {
          const day = schedule.find(d => d.day === value)!
          return (
            <div
              key={value}
              className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                day.active ? 'border-border' : 'border-border/40 opacity-50'
              }`}
            >
              <Switch checked={day.active} onCheckedChange={() => toggle(value)} />
              <span className="w-24 text-sm font-medium">{label}</span>
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="time"
                  value={day.start}
                  disabled={!day.active}
                  onChange={e => setTime(value, 'start', e.target.value)}
                  className="bg-background border border-border rounded-lg px-2 py-1 text-sm text-foreground disabled:opacity-40"
                />
                <span className="text-muted-foreground text-sm">—</span>
                <input
                  type="time"
                  value={day.end}
                  disabled={!day.active}
                  onChange={e => setTime(value, 'end', e.target.value)}
                  className="bg-background border border-border rounded-lg px-2 py-1 text-sm text-foreground disabled:opacity-40"
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1">← Volver</Button>
        <Button onClick={save} disabled={loading} className="flex-1 bg-primary hover:bg-primary/90">
          {loading ? <Loader2 className="size-4 animate-spin" /> : 'Finalizar →'}
        </Button>
      </div>
    </div>
  )
}
