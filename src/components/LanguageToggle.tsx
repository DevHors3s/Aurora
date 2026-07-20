'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setLocale } from '@/lib/actions/locale'
import { Button } from '@/components/ui/button'

interface Props {
  currentLocale: string
  variant?: 'ghost' | 'outline'
}

export function LanguageToggle({ currentLocale, variant = 'ghost' }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function toggle() {
    const next = currentLocale === 'es' ? 'en' : 'es'
    startTransition(async () => {
      await setLocale(next)
      router.refresh()
    })
  }

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={toggle}
      disabled={pending}
      className="gap-1.5 font-medium"
      aria-label="Cambiar idioma / Switch language"
    >
      {currentLocale === 'es' ? (
        <><span className="text-base leading-none">🇺🇸</span> EN</>
      ) : (
        <><span className="text-base leading-none">🇵🇪</span> ES</>
      )}
    </Button>
  )
}
