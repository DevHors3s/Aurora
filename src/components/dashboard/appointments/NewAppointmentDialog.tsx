'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Service, Staff } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  businessId: string
  onCreated: () => void
}

export function NewAppointmentDialog({ open, onClose, businessId, onCreated }: Props) {
  const [services, setServices] = useState<Service[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [slots, setSlots] = useState<string[]>([])

  const [serviceId, setServiceId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    supabase.from('services').select('*').eq('business_id', businessId).eq('is_active', true)
      .then(({ data }) => setServices((data as Service[]) ?? []))
    supabase.from('staff').select('*').eq('business_id', businessId).eq('is_active', true)
      .then(({ data }) => setStaffList((data as Staff[]) ?? []))
  }, [open, businessId])

  useEffect(() => {
    if (!staffId || !serviceId || !date) return
    setSlots([])
    fetch(`/api/availability?staff_id=${staffId}&service_id=${serviceId}&date=${date}`)
      .then(r => r.json())
      .then(j => setSlots(j.slots ?? []))
  }, [staffId, serviceId, date])

  async function save() {
    if (!serviceId || !staffId || !date || !time || !clientName || !clientPhone) {
      toast.error('Completa todos los campos obligatorios'); return
    }
    setLoading(true)
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: businessId, service_id: serviceId, staff_id: staffId, date, time, client_name: clientName, client_phone: clientPhone }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(json.error); return }
    // Si hay notas, actualizar
    if (notes) {
      const supabase = createClient()
      await supabase.from('appointments').update({ notes }).eq('id', json.appointment.id)
    }
    toast.success('Cita creada')
    onCreated(); onClose()
    // Reset
    setServiceId(''); setStaffId(''); setDate(''); setTime('')
    setClientName(''); setClientPhone(''); setNotes('')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nueva cita manual</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Servicio *</Label>
              <Select value={serviceId} onValueChange={v => { setServiceId(v); setTime('') }}>
                <SelectTrigger><SelectValue placeholder="Elegir..." /></SelectTrigger>
                <SelectContent>
                  {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Barbero *</Label>
              <Select value={staffId} onValueChange={v => { setStaffId(v); setTime('') }}>
                <SelectTrigger><SelectValue placeholder="Elegir..." /></SelectTrigger>
                <SelectContent>
                  {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input type="date" value={date} onChange={e => { setDate(e.target.value); setTime('') }} min={new Date().toISOString().slice(0,10)} />
            </div>
            <div className="space-y-2">
              <Label>Hora *</Label>
              <Select value={time} onValueChange={setTime} disabled={slots.length === 0}>
                <SelectTrigger><SelectValue placeholder={slots.length === 0 ? 'Elige fecha' : 'Hora...'} /></SelectTrigger>
                <SelectContent>
                  {slots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nombre del cliente *</Label>
            <Input placeholder="Juan Perez" value={clientName} onChange={e => setClientName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp del cliente *</Label>
            <Input placeholder="+51 987 654 321" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notas internas</Label>
            <Textarea placeholder="Observaciones..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={save} disabled={loading} className="flex-1 bg-primary hover:bg-primary/90">
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'Crear cita'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
