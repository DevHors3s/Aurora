import twilio from 'twilio'

function isTwilioConfigured() {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid' &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_AUTH_TOKEN !== 'your_twilio_auth_token'
  )
}

export async function sendWhatsApp(to: string, body: string): Promise<void> {
  if (!isTwilioConfigured()) {
    console.log('[WhatsApp] Not configured — message skipped:', { to: to.slice(0, 6) + '***', body: body.slice(0, 60) })
    return
  }
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  const phone = to.replace(/\D/g, '')
  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:+${phone}`,
    body,
  })
}

interface TemplateVars {
  client_name: string
  business_name: string
  business_address?: string | null
  service_name: string
  staff_name: string
  date: string
  time: string
}

export function tplConfirmation(v: TemplateVars) {
  return `✅ *¡Reserva confirmada!*

Hola ${v.client_name}, tu cita en *${v.business_name}* está confirmada.

📋 Servicio: ${v.service_name}
💈 Con: ${v.staff_name}
📅 Fecha: ${v.date} a las ${v.time}${v.business_address ? `\n📍 ${v.business_address}` : ''}

Si necesitas cancelar, escríbenos aquí.`
}

export function tplReminder24h(v: TemplateVars) {
  return `⏰ *Recordatorio de cita*

Hola ${v.client_name}, te recordamos que mañana tienes una cita en *${v.business_name}*.

📅 ${v.date} a las ${v.time}
💈 Con ${v.staff_name}

¡Te esperamos! 🙌`
}

export function tplReminder1h(v: TemplateVars) {
  return `🔔 *Tu cita es en 1 hora*

Hola ${v.client_name}, tu cita en *${v.business_name}* es a las ${v.time}.

¡Nos vemos pronto! 💈`
}
