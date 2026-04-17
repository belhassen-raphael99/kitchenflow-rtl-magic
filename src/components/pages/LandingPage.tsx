import { ArrowLeft, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroScene } from '@/components/landing/HeroScene';
import { LandingFeatureGrid } from '@/components/landing/LandingFeatureGrid';
import { LandingShowcase } from '@/components/landing/LandingShowcase';
import { Button } from '@/components/ui/button';

export const LandingPage = () => {
  return (
    <div dir="rtl" className="min-h-screen overflow-x-hidden bg-landing-shell text-landing-ink">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-landing-shell/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">קסרולה</p>
              <p className="text-xs text-muted-foreground">פלטפורמת תפעול לקייטרינג מקצועי</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link to="/auth">התחברות</Link>
            </Button>
            <Button asChild variant="cta">
              <Link to="/auth?mode=signup">צור חשבון</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="px-4 pb-12 pt-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="relative min-h-[calc(100svh-7rem)] overflow-hidden rounded-[2.5rem] border border-landing-surface/85 shadow-landing">
              <HeroScene className="absolute inset-0" />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(115deg, hsl(var(--landing-shell) / 0.08) 12%, hsl(var(--landing-shell) / 0.72) 46%, hsl(var(--landing-shell) / 0.96) 100%)',
                }}
              />

              <div className="relative z-20 flex min-h-[calc(100svh-7rem)] items-end p-5 sm:p-8 lg:p-12">
                <div className="max-w-2xl rounded-[2rem] border border-landing-surface/90 bg-landing-surface/80 p-6 shadow-landing backdrop-blur-xl sm:p-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                    חוויה אינטראקטיבית לקייטרינג מקצועי
                  </div>

                  <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-7xl">
                    פלטפורמה אחת
                    <span className="block text-primary">לכל מה שקורה בקייטרינג.</span>
                  </h1>

                  <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
                    מהתכנון הראשוני, דרך ההכנות במטבח, ועד היציאה לשירות באירוע — קסרולה מחברת בין הצוות, המלאי והביצוע בזמן אמת.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button asChild size="lg" variant="cta">
                      <Link to="/auth?mode=signup">
                        התחל עכשיו
                        <ArrowLeft className="h-4 w-4" />
                      </Link>
                    </Button>

                    <Button asChild size="lg" variant="outline">
                      <Link to="/auth">התחבר למערכת</Link>
                    </Button>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {[
                      'ניהול אירועים והפקות',
                      'לוח מטבח אינטראקטיבי',
                      'מלאי, רכש ומשלוחים',
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-sm font-medium text-landing-ink shadow-soft"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LandingFeatureGrid />
        <LandingShowcase />

        <section className="border-t border-border/60 py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div
              className="overflow-hidden rounded-[2.25rem] border border-landing-surface/85 p-8 shadow-landing md:p-12"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, hsl(var(--landing-surface)) 0%, hsl(var(--landing-warm-soft)) 100%)',
              }}
            >
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-medium text-primary">מוכנים לעבוד מסודר יותר?</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-landing-ink sm:text-4xl lg:text-5xl">
                    תנו לצוות שלכם לראות הכול במקום אחד — ולהוציא כל אירוע בראש שקט.
                  </h2>
                  <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
                    התחברות, יצירת חשבון וניהול ההפקות מתחילים כאן — עם חוויית עבודה שנבנתה לקצב של קייטרינג אמיתי.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" variant="cta">
                    <Link to="/auth?mode=signup">צור חשבון</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/auth">כבר יש לי חשבון</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ChefHat className="h-4 w-4" />
            </div>
            <span>קסרולה — מערכת ניהול לקייטרינג</span>
          </div>
          <div>© {new Date().getFullYear()} כל הזכויות שמורות.</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
