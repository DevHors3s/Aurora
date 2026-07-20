'use server'

import { cookies } from 'next/headers'

export async function setLocale(locale: string) {
  const valid = ['es', 'en']
  if (!valid.includes(locale)) return
  const cookieStore = await cookies()
  cookieStore.set('locale', locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  })
}
