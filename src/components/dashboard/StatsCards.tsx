import { CalendarCheck, Clock, CheckCircle2, Wallet } from 'lucide-react'

interface Stats {
  total: number
  pending: number
  completed: number
  revenue: number
}

export function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    { label: 'Citas hoy', value: stats.total, icon: CalendarCheck, tint: 'text-primary' },
    { label: 'Pendientes', value: stats.pending, icon: Clock, tint: 'text-amber-400' },
    { label: 'Completadas', value: stats.completed, icon: CheckCircle2, tint: 'text-emerald-400' },
    { label: 'Ingresos est. (S/.)', value: stats.revenue.toFixed(2), icon: Wallet, tint: 'text-fuchsia-400' },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <c.icon className={`size-4 ${c.tint}`} />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{c.value}</p>
        </div>
      ))}
    </div>
  )
}
