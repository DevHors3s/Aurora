'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Calendar, ClipboardList, Users, Scissors, Settings, LogOut, Menu,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard',    label: 'Inicio',        icon: Home },
  { href: '/agenda',       label: 'Agenda',         icon: Calendar },
  { href: '/appointments', label: 'Citas',          icon: ClipboardList },
  { href: '/staff',        label: 'Barberos',       icon: Users },
  { href: '/services',     label: 'Servicios',      icon: Scissors },
  { href: '/settings',     label: 'Configuracion',  icon: Settings },
]

function NavContent({
  businessName, userEmail, onNav,
}: { businessName: string; userEmail: string; onNav?: () => void }) {
  const pathname = usePathname()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-border">
        <span className="grid place-items-center size-8 rounded-lg bg-primary/15 text-primary">
          <Scissors className="size-4" />
        </span>
        <span className="font-semibold">Aurora</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="grid place-items-center size-9 rounded-full bg-primary/15 text-primary text-sm font-semibold shrink-0">
            {businessName.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{businessName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
        <Button
          variant="ghost" size="sm" onClick={logout}
          className="w-full justify-start gap-2 mt-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" /> Cerrar sesion
        </Button>
      </div>
    </div>
  )
}

export function Sidebar({ businessName, userEmail }: { businessName: string; userEmail: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 border-r border-border bg-sidebar">
        <NavContent businessName={businessName} userEmail={userEmail} />
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14 bg-sidebar border-b border-border">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center size-7 rounded-lg bg-primary/15 text-primary">
            <Scissors className="size-3.5" />
          </span>
          <span className="font-semibold text-sm">Aurora</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="size-9">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-0 bg-sidebar border-border">
            <NavContent businessName={businessName} userEmail={userEmail} onNav={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
