import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAvailableSlots } from '@/lib/availability'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const staff_id = searchParams.get('staff_id')
  const service_id = searchParams.get('service_id')
  const business_id = searchParams.get('business_id')
  const date = searchParams.get('date')

  if (!staff_id || !service_id || !business_id || !date) {
    return NextResponse.json(
      { error: 'staff_id, service_id, business_id and date are required' },
      { status: 400 },
    )
  }

  const supabase = createAdminClient()
  const [{ data: service }, { data: business }] = await Promise.all([
    supabase
      .from('services')
      .select('duration_min')
      .eq('id', service_id)
      .eq('business_id', business_id)
      .maybeSingle(),
    supabase
      .from('businesses')
      .select('timezone')
      .eq('id', business_id)
      .maybeSingle(),
  ])

  if (!service) {
    return NextResponse.json({ error: 'service not found' }, { status: 404 })
  }
  if (!business) {
    return NextResponse.json({ error: 'business not found' }, { status: 404 })
  }

  const slots = await getAvailableSlots({
    staff_id,
    service_duration_min: service.duration_min as number,
    date,
    timeZone: (business.timezone as string) ?? 'America/Lima',
  })
  return NextResponse.json({ slots })
}
