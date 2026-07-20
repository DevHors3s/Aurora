import Link from 'next/link'
import { Scissors } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen grid place-items-center bg-background overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_50%_at_50%_0%,rgba(124,58,237,0.15),transparent_70%)]" />
      <div className="w-full max-w-md px-6">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="grid place-items-center size-9 rounded-lg bg-primary/15 text-primary">
            <Scissors className="size-4" />
          </span>
          <span className="text-lg font-semibold">Aurora</span>
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-black/40">
          {children}
        </div>
      </div>
    </div>
  )
}
