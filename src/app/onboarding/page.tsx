import { Scissors } from 'lucide-react'
import Link from 'next/link'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

export default function OnboardingPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_50%_at_50%_0%,rgba(124,58,237,0.15),transparent_70%)]" />
      <div className="flex items-center justify-center gap-2 pt-8 pb-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid place-items-center size-8 rounded-lg bg-primary/15 text-primary">
            <Scissors className="size-4" />
          </span>
          <span className="font-semibold">Aurora</span>
        </Link>
      </div>
      <OnboardingWizard />
    </div>
  )
}
