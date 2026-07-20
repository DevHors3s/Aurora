'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error(translateError(error.message))
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Bienvenido de vuelta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Inicia sesion en tu cuenta de Aurora</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contrasena</Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
              Olvidaste?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : 'Iniciar sesion'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No tienes cuenta?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Crea una
        </Link>
      </p>
    </>
  )
}

function translateError(msg: string) {
  if (msg.toLowerCase().includes('invalid')) return 'Credenciales incorrectas'
  if (msg.toLowerCase().includes('email')) return 'Email no valido'
  return msg
}
