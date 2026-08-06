// Helpers de WhatsApp seguros para usar desde componentes de cliente
// ('use client'). A proposito NO importa 'twilio' (paquete solo-servidor,
// ver src/lib/whatsapp.ts) para poder incluirse en el bundle del browser.

/**
 * Link "wa.me" con el mensaje pre-armado, para que el dueño lo mande con 1 clic
 * desde su propio WhatsApp. Es el canal que de verdad funciona hoy: no requiere
 * verificacion de negocio ante Meta ni cuesta por mensaje (a diferencia de la
 * WABA via Twilio, que sigue lista en src/lib/whatsapp.ts para cuando se active).
 */
export function buildWaLink(phone: string, message: string): string {
  const digits = normalizePeruPhone(phone)
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

/** Normaliza un telefono peruano (con o sin +51, con espacios/guiones) a solo digitos con codigo de pais. */
export function normalizePeruPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('51') && digits.length >= 11) return digits
  if (digits.length === 9) return `51${digits}`
  return digits
}

interface WaTemplateVars {
  client_name: string
  business_name: string
  service_name: string
  staff_name: string
  date: string
  time: string
}

/** Texto del recordatorio que el dueño manda con 1 clic desde el widget del dashboard. */
export function tplReminderText(v: WaTemplateVars): string {
  return `⏰ Hola ${v.client_name}, te recordamos tu cita en *${v.business_name}*\n\n📅 ${v.date} a las ${v.time}\n💈 Con ${v.staff_name}\n\n¡Te esperamos! 🙌`
}
