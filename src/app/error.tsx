'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
      <div className="grid place-items-center size-14 rounded-2xl bg-destructive/15 text-destructive mb-6">
        <AlertTriangle className="size-6" />
      </div>
      <h1 className="text-2xl font-semibold">Algo salio mal</h1>
      <p className="mt-2 text-muted-foreground max-w-sm">
        Ocurrio un error inesperado. Intenta de nuevo o contacta soporte si el problema persiste.
      </p>
      <Button onClick={reset} className="mt-8 bg-primary hover:bg-primary/90">Reintentar</Button>
    </div>
  )
}
