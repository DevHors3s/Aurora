import Link from 'next/link'
import { ArrowRight, MessageCircle, Calendar, Zap, CheckCircle2, Scissors, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getLocale, getTranslations } from 'next-intl/server'
import { LanguageToggle } from '@/components/LanguageToggle'

export default async function Home() {
  const locale = await getLocale()
  const t = await getTranslations()

  const featureIcons = [MessageCircle, Calendar, Zap, CheckCircle2, Star, Scissors]
  const featureKeys = ['whatsapp', 'calendar', 'link', 'crud', 'slots', 'onboarding'] as const

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid place-items-center size-8 rounded-lg bg-primary/15 text-primary">
              <Scissors className="size-4" />
            </span>
            Turnio
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">{t('nav.features')}</a>
            <a href="#pricing" className="hover:text-foreground transition">{t('nav.pricing')}</a>
            <a href="#testimonials" className="hover:text-foreground transition">{t('nav.testimonials')}</a>
          </nav>
          <div className="flex items-center gap-1">
            <LanguageToggle currentLocale={locale} />
            <Link href="/login"><Button variant="ghost" size="sm">{t('nav.login')}</Button></Link>
            <Link href="/register"><Button size="sm" className="bg-primary hover:bg-primary/90">{t('nav.register')}</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(124,58,237,0.2),transparent_70%)]" />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/5">
            {t('hero.badge')}
          </Badge>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.08]">
            {t('hero.title_1')}
            <br />
            <span className="bg-gradient-to-r from-primary via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
              {t('hero.title_2')}
            </span>
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2 px-8">
                {t('hero.cta_primary')} <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">{t('hero.cta_secondary')}</Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{t('hero.tagline')}</p>
        </div>
      </section>

      {/* Social proof */}
      <div className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-5 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          {(['item_1', 'item_2', 'item_3', 'item_4'] as const).map(k => (
            <span key={k} className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary shrink-0" /> {t(`proof.${k}`)}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold">{t('features.title')}</h2>
          <p className="mt-3 text-muted-foreground">{t('features.subtitle')}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureKeys.map((key, i) => {
            const Icon = featureIcons[i]
            return (
              <div key={key} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition">
                <div className="grid place-items-center size-10 rounded-lg bg-primary/15 text-primary mb-4">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-semibold mb-1">{t(`features.items.${key}_title`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`features.items.${key}_body`)}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-card/50 border-y border-border py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-semibold text-center mb-12">{t('testimonials.title')}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {([0, 1, 2] as const).map(i => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, s) => <Star key={s} className="size-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-muted-foreground italic">"{t(`testimonials.items.${i}.text`)}"</p>
                <div>
                  <p className="font-semibold text-sm">{t(`testimonials.items.${i}.name`)}</p>
                  <p className="text-xs text-muted-foreground">{t(`testimonials.items.${i}.business`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold">{t('pricing.title')}</h2>
          <p className="mt-3 text-muted-foreground">{t('pricing.subtitle')}</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 items-start">
          {([0, 1, 2] as const).map(i => {
            const highlight = i === 1
            const features = t.raw(`pricing.plans.${i}.features`) as string[]
            return (
              <div key={i} className={`rounded-2xl border p-6 space-y-6 relative ${highlight ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-white border-0">{t('pricing.popular')}</Badge>
                  </div>
                )}
                <div>
                  <p className="font-semibold">{t(`pricing.plans.${i}.name`)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(`pricing.plans.${i}.description`)}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">S/. {[49, 99, 199][i]}</span>
                    <span className="text-muted-foreground text-sm">{t('pricing.per_month')}</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-primary shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block">
                  <Button className={`w-full ${highlight ? 'bg-primary hover:bg-primary/90' : ''}`} variant={highlight ? 'default' : 'outline'}>
                    {t(`pricing.plans.${i}.cta`)}
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden border-t border-border py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_50%_at_50%_100%,rgba(124,58,237,0.15),transparent_70%)]" />
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold">{t('cta.title')}</h2>
          <p className="mt-3 text-muted-foreground">{t('cta.subtitle')}</p>
          <Link href="/register" className="mt-8 inline-flex">
            <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2 px-10">
              {t('cta.button')} <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center size-6 rounded bg-primary/15 text-primary"><Scissors className="size-3" /></span>
            <span className="font-medium text-foreground">Turnio</span>
            <span>— {t('footer.tagline')}</span>
          </div>
          <p>© {new Date().getFullYear()} Turnio. {t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  )
}
