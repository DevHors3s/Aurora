import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

const VALID_LOCALES = ['es', 'en'] as const
export type Locale = (typeof VALID_LOCALES)[number]

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const raw = cookieStore.get('locale')?.value
  const locale: Locale = VALID_LOCALES.includes(raw as Locale) ? (raw as Locale) : 'es'
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
