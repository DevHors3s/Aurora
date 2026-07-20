'use client'

import { useState } from 'react'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Appointment } from '@/types'
import { cn } from '@/lib/utils'

const STATUS_COLOR: Record<string, string> = {
  confirmed: 'bg-emerald-500/20 border-l-emerald-500 text-emerald-200',
  pending:   'bg-amber-500/20 border-l-amber-500 text-amber-200',
  completed: 'bg-zinc-500/20 border-l-zinc-500 text-zinc-300',
  cancelled: 'bg-red-500/20 border-l-red-400 text-red-300',
  no_show:   'bg-red-500/20 border-l-red-400 text-red-300',
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8h–20h

function minutesSinceMidnight(iso: string) {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

export function WeekCalendar({ appointments }: { appointments: Appointment[] }) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const slotHeight = 60 // px per hour

  return (
    <div>
      {/* Nav */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">
          {format(weekStart, "d 'de' MMMM", { locale: es })} — {format(days[6], "d 'de' MMMM yyyy", { locale: es })}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="size-8" onClick={() => setWeekStart(d => addDays(d, -7))}><ChevronLeft className="size-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Hoy</Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => setWeekStart(d => addDays(d, 7))}><ChevronRight className="size-4" /></Button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-border overflow-auto">
        <div className="flex min-w-[640px]">
          {/* Hour labels */}
          <div className="w-14 shrink-0 border-r border-border">
            <div className="h-10 border-b border-border" />
            {HOURS.map(h => (
              <div key={h} style={{ height: slotHeight }} className="border-b border-border/50 px-2 pt-1">
                <span className="text-[10px] text-muted-foreground">{String(h).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>
          {/* Days */}
          {days.map(day => {
            const isToday = isSameDay(day, new Date())
            const dayAppts = appointments.filter(a => isSameDay(new Date(a.starts_at), day))
            return (
              <div key={day.toISOString()} className="flex-1 min-w-0 border-r border-border last:border-r-0">
                {/* Day header */}
                <div className={cn('h-10 border-b border-border flex flex-col items-center justify-center', isToday && 'bg-primary/10')}>
                  <span className="text-[10px] uppercase text-muted-foreground">{format(day, 'EEE', { locale: es })}</span>
                  <span className={cn('text-sm font-semibold leading-tight', isToday && 'text-primary')}>{format(day, 'd')}</span>
                </div>
                {/* Slots */}
                <div className="relative" style={{ height: HOURS.length * slotHeight }}>
                  {HOURS.map(h => (
                    <div key={h} style={{ top: (h - 8) * slotHeight, height: slotHeight }}
                      className="absolute inset-x-0 border-b border-border/30" />
                  ))}
                  {dayAppts.map(a => {
                    const startMin = minutesSinceMidnight(a.starts_at)
                    const endMin = minutesSinceMidnight(a.ends_at)
                    const top = (startMin - 8 * 60) * (slotHeight / 60)
                    const height = Math.max((endMin - startMin) * (slotHeight / 60), 20)
                    return (
                      <div
                        key={a.id}
                        style={{ top, height }}
                        className={cn(
                          'absolute inset-x-1 rounded-md border-l-2 px-1.5 py-0.5 text-[10px] overflow-hidden cursor-default',
                          STATUS_COLOR[a.status] ?? STATUS_COLOR.confirmed
                        )}
                        title={`${a.client_name} — ${a.service?.name}`}
                      >
                        <p className="font-semibold truncate">{a.client_name}</p>
                        <p className="truncate opacity-75">{a.service?.name}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
