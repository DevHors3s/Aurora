import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAvailableSlots } from '@/lib/availability'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const staff_id = searchParams.get('staff_id')
  const service_id = searchParams.get('service_id')
  const date = searchParams.get('date')

  if (!staff_id || !service_id || !date) {
    return NextResponse.json(
      { error: 'staff_id, service_id and date are required' },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { data: service } = await supabase
    .from('services')
    .select('duration_min')
    .eq('id', service_id)
    .single()

  if (!service) {
    return NextResponse.json({ error: 'service not found' }, { status: 404 })
  }

  const slots = await getAvailableSlots({
    staff_id,
    service_duration_min: service.duration_min as number,
    date,
  })
  return NextResponse.json({ slots })
}
