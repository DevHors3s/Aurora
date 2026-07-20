import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Scissors, MapPin } from 'lucide-react'
import { BookingFlow } from '@/components/booking/BookingFlow'
import type { Service } from '@/types'
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { LanguageToggle } from '@/components/LanguageToggle'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: business } = await supabase
    .from('businesses').select('name, address').eq('slug', slug).single()
  if (!business) return { title: 'Turnio — Reservas online' }
  return {
    title: `Reservar en ${business.name} | Turnio`,
    description: `Reserva tu cita en ${business.name}${business.address ? ` — ${business.address}` : ''}. Rapido, sin llamadas, con confirmacion por WhatsApp.`,
    openGraph: {
      title: `Reservar en ${business.name}`,
      description: `Reserva online en ${business.name}. Confirmacion automatica por WhatsApp.`,
      type: 'website',
    },
  }
}

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const locale = await getLocale()
  const t = await getTranslations('booking')

  const { data: business } = await supabase
    .from('businesses').select('*').eq('slug', slug).eq('is_active', true).single()
  if (!business) notFound()

  const { data: services } = await supabase
    .from('services').select('*').eq('business_id', business.id).eq('is_active', true).order('name')

  const activeServices = (services as Service[]) ?? []

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="mx-auto max-w-[480px] px-5 py-8">
        {/* Header negocio */}
        <div className="flex justify-end mb-2">
          <LanguageToggle currentLocale={locale} variant="outline" />
        </div>
        <div className="flex flex-col items-center text-center mb-8">
          <div className="grid place-items-center size-14 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] mb-3">
            <Scissors className="size-6" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900">{business.name}</h1>
          {business.address && (
            <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
              <MapPin className="size-3" /> {business.address}
            </p>
          )}
        </div>

        {/* Booking card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {activeServices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-500 text-sm">Este negocio aun no tiene servicios disponibles.</p>
            </div>
          ) : (
            <BookingFlow
              businessId={business.id as string}
              businessName={business.name as string}
              services={activeServices}
            />
          )}
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          {t('powered_by')} <span className="font-medium text-[#7C3AED]">Turnio</span>
        </p>
      </div>
    </div>
  )
}
