'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Building2 } from 'lucide-react'
import type { OnboardingState } from './OnboardingWizard'

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).slice(2, 6)
}

interface Props {
  state: OnboardingState
  updateState: (p: Partial<OnboardingState>) => void
  onNext: () => void
}

export function StepBusiness({ state, updateState, onNext }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  async function save() {
    if (!name.trim()) { toast.error('El nombre es obligatorio'); return }
    if (state.businessId) { onNext(); return } // ya guardado
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Sesion expirada'); setLoading(false); return }
    const { data, error } = await supabase
      .from('businesses')
      .insert({ owner_id: user.id, name, slug: slugify(name), phone, address })
      .select()
      .single()
    setLoading(false)
    if (error) { toast.error(error.message); return }
    updateState({ businessId: data.id as string })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="grid place-items-center size-10 rounded-lg bg-primary/15 text-primary mb-4">
          <Building2 className="size-5" />
        </div>
        <h2 className="text-xl font-semibold">Datos del negocio</h2>
        <p className="text-sm text-muted-foreground mt-1">La informacion basica de tu barberia o peluqueria.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bname">Nombre del negocio *</Label>
          <Input id="bname" placeholder="Barberia El Clasico" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bphone">WhatsApp del negocio</Label>
          <Input id="bphone" placeholder="+51 987 654 321" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="baddress">Direccion</Label>
          <Input id="baddress" placeholder="Av. Larco 123, Miraflores, Lima" value={address} onChange={e => setAddress(e.target.value)} />
        </div>
      </div>
      <Button onClick={save} disabled={loading} className="w-full bg-primary hover:bg-primary/90">
        {loading ? <Loader2 className="size-4 animate-spin" /> : 'Continuar →'}
      </Button>
    </div>
  )
}
