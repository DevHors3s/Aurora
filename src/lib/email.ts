import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface BookingEmailData {
  to: string
  clientName: string
  businessName: string
  businessAddress?: string
  serviceName: string
  staffName: string
  date: string
  time: string
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key') return

  return resend.emails.send({
    from: 'Aurora <noreply@aurora.pe>',
    to: data.to,
    subject: `Reserva confirmada en ${data.businessName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <div style="background:#7C3AED;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <h1 style="color:white;margin:0;font-size:24px">✅ Reserva confirmada</h1>
        </div>
        <p style="color:#374151">Hola <strong>${data.clientName}</strong>,</p>
        <p style="color:#374151">Tu cita en <strong>${data.businessName}</strong> está confirmada.</p>
        <div style="background:#F9FAFB;border-radius:8px;padding:16px;margin:24px 0">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="color:#6B7280;padding:6px 0">Servicio</td><td style="font-weight:600;color:#111827">${data.serviceName}</td></tr>
            <tr><td style="color:#6B7280;padding:6px 0">Barbero</td><td style="font-weight:600;color:#111827">${data.staffName}</td></tr>
            <tr><td style="color:#6B7280;padding:6px 0">Fecha</td><td style="font-weight:600;color:#111827">${data.date}</td></tr>
            <tr><td style="color:#6B7280;padding:6px 0">Hora</td><td style="font-weight:600;color:#111827">${data.time}</td></tr>
            ${data.businessAddress ? `<tr><td style="color:#6B7280;padding:6px 0">Direccion</td><td style="font-weight:600;color:#111827">${data.businessAddress}</td></tr>` : ''}
          </table>
        </div>
        <p style="color:#6B7280;font-size:14px">También recibirás un recordatorio por WhatsApp antes de tu cita.</p>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0"/>
        <p style="color:#9CA3AF;font-size:12px;text-align:center">Powered by <strong>Aurora</strong></p>
      </div>
    `,
  })
}
