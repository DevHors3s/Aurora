import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const protectedPaths = [
    '/dashboard',
    '/agenda',
    '/appointments',
    '/staff',
    '/services',
    '/settings',
    '/onboarding',
    // Solo se llega aca con una sesion de recuperacion valida, establecida
    // por /auth/callback tras el link del email. Sin sesion, no debe verse el form.
    '/reset-password',
  ]
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p),
  )
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const authPaths = ['/login', '/register']
  const isAuthPath = authPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p),
  )
  if (isAuthPath && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|b/).*)'],
}
