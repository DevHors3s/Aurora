import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Scissors } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(40%_40%_at_50%_40%,rgba(124,58,237,0.12),transparent_70%)]" />
      <div className="grid place-items-center size-14 rounded-2xl bg-primary/15 text-primary mb-6">
        <Scissors className="size-6" />
      </div>
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="mt-3 text-xl font-medium">Pagina no encontrada</p>
      <p className="mt-2 text-muted-foreground max-w-sm">
        La pagina que buscas no existe o fue movida.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/dashboard">
          <Button className="bg-primary hover:bg-primary/90">Ir al dashboard</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Inicio</Button>
        </Link>
      </div>
    </div>
  )
}
