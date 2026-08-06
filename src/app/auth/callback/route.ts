import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Route handler al que Supabase redirige tras confirmar el email o pedir
// restablecer la contrasena (flujo PKCE: el link trae un `?code=`).
// Sin esto, esos dos flujos nunca completaban: el link caia en /login sin
// sesion y el usuario quedaba varado.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`)
}
