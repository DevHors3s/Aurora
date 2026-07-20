'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Service } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  service?: Service | null
  businessId: string
  onSaved: () => void
}

export function ServiceDialog({ open, onClose, service, businessId, onSaved }: Props) {
  const editing = !!service
  const [name, setName] = useState('')
  const [duration, setDuration] = useState(30)
  const [price, setPrice] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (service) {
      setName(service.name)
      setDuration(service.duration_min)
      setPrice(service.price ?? '')
      setDescription(service.description ?? '')
    } else {
      setName(''); setDuration(30); setPrice(''); setDescription('')
    }
  }, [service, open])

  async function save() {
    if (!name.trim()) { toast.error('El nombre es obligatorio'); return }
    setLoading(true)
    const supabase = createClient()
    const payload = {
      name,
      duration_min: duration,
      price: price === '' ? null : price,
      description: description || null,
      business_id: businessId,
    }
    const { error } = editing
      ? await supabase.from('services').update(payload).eq('id', service!.id)
      : await supabase.from('services').insert(payload)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success(editing ? 'Servicio actualizado' : 'Servicio creado')
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input placeholder="Corte clasico" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Duracion (min) *</Label>
              <Input type="number" min={5} value={duration} onChange={e => setDuration(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Precio (S/.)</Label>
              <Input type="number" min={0} step={0.5} placeholder="0.00" value={price} onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripcion</Label>
            <Textarea placeholder="Descripcion opcional..." value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={save} disabled={loading} className="flex-1 bg-primary hover:bg-primary/90">
              {loading ? <Loader2 className="size-4 animate-spin" /> : editing ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
