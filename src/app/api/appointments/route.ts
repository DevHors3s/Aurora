import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: business } = await supabase
    .from('businesses').select('id').eq('owner_id', user.id).maybeSingle()
  if (!business) return NextResponse.json({ data: [] })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const status = searchParams.get('status')

  let query = supabase
    .from('appointments')
    .select('*, staff(*), service:services(*)')
    .eq('business_id', business.id)
    .order('starts_at', { ascending: true })

  if (from) query = query.gte('starts_at', from)
  if (to) query = query.lte('starts_at', to)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
