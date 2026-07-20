'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Staff, Service, Schedule } from '@/types'

const DAYS = [
  { label: 'Lunes', value: 1 }, { label: 'Martes', value: 2 },
  { label: 'Miercoles', value: 3 }, { label: 'Jueves', value: 4 },
  { label: 'Viernes', value: 5 }, { label: 'Sabado', value: 6 },
  { label: 'Domingo', value: 0 },
]

interface Props {
  open: boolean
  onClose: () => void
  staff?: Staff | null
  businessId: string
  services: Service[]
  onSaved: () => void
}

export function StaffDialog({ open, onClose, staff, businessId, services, onSaved }: Props) {
  const editing = !!staff
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [schedule, setSchedule] = useState(
    DAYS.map(d => ({ day: d.value, active: d.value !== 0, start: '09:00', end: '18:00' }))
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (staff) {
      setName(staff.name); setBio(staff.bio ?? '')
      const supabase = createClient()
      // Load services
      supabase.from('staff_services').select('service_id').eq('staff_id', staff.id).then(({ data }) => {
        setSelectedServices((data ?? []).map((d: { service_id: string }) => d.service_id))
      })
      // Load schedules
      supabase.from('schedules').select('*').eq('staff_id', staff.id).then(({ data }) => {
        if (data && data.length > 0) {
          setSchedule(DAYS.map(d => {
            const found = (data as Schedule[]).find(s => s.day_of_week === d.value)
            return found
              ? { day: d.value, active: found.is_active, start: found.start_time, end: found.end_time }
              : { day: d.value, active: false, start: '09:00', end: '18:00' }
          }))
        }
      })
    } else {
      setName(''); setBio(''); setSelectedServices([])
      setSchedule(DAYS.map(d => ({ day: d.value, active: d.value !== 0, start: '09:00', end: '18:00' })))
    }
  }, [staff, open])

  function toggleService(id: string) {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleDay(day: number) {
    setSchedule(prev => prev.map(d => d.day === day ? { ...d, active: !d.active } : d))
  }

  function setTime(day: number, field: 'start' | 'end', val: string) {
    setSchedule(prev => prev.map(d => d.day === day ? { ...d, [field]: val } : d))
  }

  async function save() {
    if (!name.trim()) { toast.error('El nombre es obligatorio'); return }
    setLoading(true)
    const supabase = createClient()

    let staffId = staff?.id
    if (editing) {
      await supabase.from('staff').update({ name, bio: bio || null }).eq('id', staffId!)
    } else {
      const { data, error } = await supabase
        .from('staff').insert({ name, bio: bio || null, business_id: businessId }).select().single()
      if (error) { toast.error(error.message); setLoading(false); return }
      staffId = (data as Staff).id
    }

    // Sync services
    await supabase.from('staff_services').delete().eq('staff_id', staffId!)
    if (selectedServices.length > 0) {
      await supabase.from('staff_services').insert(
        selectedServices.map(sid => ({ staff_id: staffId!, service_id: sid }))
      )
    }

    // Sync schedule
    await supabase.from('schedules').delete().eq('staff_id', staffId!)
    const activeDays = schedule.filter(d => d.active)
    if (activeDays.length > 0) {
      await supabase.from('schedules').insert(
        activeDays.map(d => ({
          staff_id: staffId!, day_of_week: d.day,
          start_time: d.start, end_time: d.end,
        }))
      )
    }

    setLoading(false)
    toast.success(editing ? 'Barbero actualizado' : 'Barbero creado')
    onSaved(); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar barbero' : 'Nuevo barbero'}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="info" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1">Datos</TabsTrigger>
            <TabsTrigger value="services" className="flex-1">Servicios</TabsTrigger>
            <TabsTrigger value="schedule" className="flex-1">Horario</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input placeholder="Juan Gomez" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea placeholder="Especialista en degradados..." value={bio} onChange={e => setBio(e.target.value)} rows={2} />
            </div>
          </TabsContent>

          <TabsContent value="services" className="pt-4">
            <p className="text-sm text-muted-foreground mb-3">Selecciona los servicios que realiza este barbero.</p>
            <div className="space-y-2">
              {services.map(s => (
                <label key={s.id} className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/40 transition">
                  <Switch checked={selectedServices.includes(s.id)} onCheckedChange={() => toggleService(s.id)} />
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.duration_min} min · S/. {s.price ?? '—'}</p>
                  </div>
                </label>
              ))}
              {services.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay servicios. Crealos primero en la seccion Servicios.</p>}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="pt-4 space-y-2">
            {DAYS.map(({ label, value }) => {
              const day = schedule.find(d => d.day === value)!
              return (
                <div key={value} className={`flex items-center gap-3 rounded-xl border p-3 transition ${day.active ? 'border-border' : 'border-border/40 opacity-50'}`}>
                  <Switch checked={day.active} onCheckedChange={() => toggleDay(value)} />
                  <span className="w-20 text-sm font-medium">{label}</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <input type="time" value={day.start} disabled={!day.active} onChange={e => setTime(value, 'start', e.target.value)}
                      className="bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground disabled:opacity-40" />
                    <span className="text-muted-foreground text-xs">—</span>
                    <input type="time" value={day.end} disabled={!day.active} onChange={e => setTime(value, 'end', e.target.value)}
                      className="bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground disabled:opacity-40" />
                  </div>
                </div>
              )
            })}
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={save} disabled={loading} className="flex-1 bg-primary hover:bg-primary/90">
            {loading ? <Loader2 className="size-4 animate-spin" /> : editing ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
