import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Webhook stub: aqui llegaran respuestas/eventos de WhatsApp via Twilio.
  // Documentacion: https://www.twilio.com/docs/whatsapp/api
  const body = await req.text()
  console.log('[twilio webhook]', body)
  return NextResponse.json({ ok: true })
}
