'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2, Link2, Copy } from 'lucide-react'
import type { Business } from '@/types'

export function SettingsClient({ business, appUrl }: { business: Business; appUrl: string }) {
  const [name, setName] = useState(business.name)
  const [phone, setPhone] = useState(business.phone ?? '')
  const [address, setAddress] = useState(business.address ?? '')
  const [loading, setLoading] = useState(false)

  const bookingUrl = `${appUrl}/b/${business.slug}`

  async function save() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('businesses')
      .update({ name, phone: phone || null, address: address || null })
      .eq('id', business.id)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Configuracion guardada')
  }

  function copyLink() {
    navigator.clipboard.writeText(bookingUrl)
    toast.success('Link copiado')
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground text-sm mt-1">Ajustes de tu negocio en Turnio</p>
      </div>

      {/* Link de reservas */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="size-4 text-primary" />
          <h2 className="font-semibold">Tu link de reservas</h2>
        </div>
        <p className="text-sm text-muted-foreground">Comparte este link con tus clientes para que reserven online.</p>
        <div className="flex gap-2">
          <Input value={bookingUrl} readOnly className="text-sm font-mono bg-muted text-muted-foreground" />
          <Button variant="outline" size="icon" onClick={copyLink}><Copy className="size-4" /></Button>
        </div>
      </div>

      <Separator />

      {/* Info del negocio */}
      <div className="space-y-5">
        <h2 className="font-semibold">Informacion del negocio</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp del negocio</Label>
            <Input placeholder="+51 987 654 321" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Direccion</Label>
            <Input placeholder="Av. Larco 123, Miraflores" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
        </div>
        <Button onClick={save} disabled={loading} className="bg-primary hover:bg-primary/90">
          {loading ? <Loader2 className="size-4 animate-spin" /> : 'Guardar cambios'}
        </Button>
      </div>

      <Separator />

      {/* Slug (readonly) */}
      <div className="space-y-2">
        <Label>Identificador unico (slug)</Label>
        <Input value={business.slug} readOnly className="font-mono bg-muted text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Este identificador forma parte de tu URL y no puede cambiarse.</p>
      </div>
    </div>
  )
}
