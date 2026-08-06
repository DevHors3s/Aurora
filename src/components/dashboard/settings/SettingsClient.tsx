'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, Link2, Copy, Smartphone } from 'lucide-react'
import type { Business } from '@/types'

export function SettingsClient({ business, appUrl }: { business: Business; appUrl: string }) {
  const [name, setName] = useState(business.name)
  const [phone, setPhone] = useState(business.phone ?? '')
  const [address, setAddress] = useState(business.address ?? '')
  const [loading, setLoading] = useState(false)

  const [depositEnabled, setDepositEnabled] = useState(business.deposit_enabled)
  const [depositAmount, setDepositAmount] = useState(business.deposit_amount?.toString() ?? '')
  const [yapePhone, setYapePhone] = useState(business.yape_phone ?? '')
  const [yapeQrUrl, setYapeQrUrl] = useState(business.yape_qr_url ?? '')
  const [savingDeposit, setSavingDeposit] = useState(false)

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

  async function saveDeposit() {
    if (depositEnabled && !yapePhone.trim()) {
      toast.error('Ingresa el numero de Yape del negocio')
      return
    }
    setSavingDeposit(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('businesses')
      .update({
        deposit_enabled: depositEnabled,
        deposit_amount: depositAmount ? Number(depositAmount) : null,
        yape_phone: yapePhone || null,
        yape_qr_url: yapeQrUrl || null,
      })
      .eq('id', business.id)
    setSavingDeposit(false)
    if (error) { toast.error(error.message); return }
    toast.success('Adelanto por Yape actualizado')
  }

  function copyLink() {
    navigator.clipboard.writeText(bookingUrl)
    toast.success('Link copiado')
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground text-sm mt-1">Ajustes de tu negocio en Aurora</p>
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

      {/* Adelanto por Yape */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Smartphone className="size-4 text-primary" />
            <div>
              <h2 className="font-semibold">Adelanto por Yape</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Pide un adelanto para asegurar la cita. Tu confirmas el pago a mano viendo el codigo de operacion.
              </p>
            </div>
          </div>
          <Switch checked={depositEnabled} onCheckedChange={setDepositEnabled} />
        </div>

        {depositEnabled && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Monto del adelanto (S/.)</Label>
                <Input type="number" min="0" step="0.01" placeholder="10" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tu numero de Yape</Label>
                <Input placeholder="987 654 321" value={yapePhone} onChange={e => setYapePhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Link de tu QR de Yape (opcional)</Label>
              <Input placeholder="https://..." value={yapeQrUrl} onChange={e => setYapeQrUrl(e.target.value)} />
              <p className="text-xs text-muted-foreground">Sube tu QR a algun hosting de imagenes y pega el link aqui. Si lo dejas vacio, el cliente igual vera tu numero de Yape.</p>
            </div>
          </div>
        )}

        <Button onClick={saveDeposit} disabled={savingDeposit} className="bg-primary hover:bg-primary/90">
          {savingDeposit ? <Loader2 className="size-4 animate-spin" /> : 'Guardar adelanto'}
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
