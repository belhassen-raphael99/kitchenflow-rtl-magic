import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  ChefHat,
  Package,
  Sparkles,
  Truck,
  Boxes,
  Bell,
  BarChart3,
  ArrowLeft,
} from 'lucide-react';

import screenAgenda from '@/assets/landing/screen-agenda.jpg';
import screenRecipes from '@/assets/landing/screen-recipes.jpg';
import screenWarehouse from '@/assets/landing/screen-warehouse.jpg';
import screenChef from '@/assets/landing/screen-chef.jpg';

// Lazy-load the 3D scene so it never blocks first paint
const HeroScene = lazy(() =>
  import('@/components/landing/HeroScene').then((m) => ({ default: m.HeroScene })),
);

const features = [
  {
    icon: Calendar,
    title: 'ניהול אירועים',
    desc: 'יומן חכם, ייבוא הזמנות מ־PDF, פרטי לקוח ולוגיסטיקה במקום אחד.',
  },
  {
    icon: ChefHat,
    title: 'לוח בקרה לשף',
    desc: 'תכנית יומית, יצירה אוטומטית של משימות לפי מלאי ואירועים.',
  },
  {
    icon: Boxes,
    title: 'ניהול מלאי',
    desc: 'מעקב כמויות, התראות חוסר, תאריכי תפוגה ורשימות קניה אוטומטיות.',
  },
  {
    icon: Sparkles,
    title: 'מאגר מתכונים',
    desc: 'מתכונים מודולריים עם מרכיבים, עלויות, ומכפילי כמות חכמים.',
  },
  {
    icon: Package,
    title: 'רזרבה וייצור',
    desc: 'ניהול חיי מדף, תאריכי הקפאה, ולוח ייצור שבועי לפי מחלקה.',
  },
  {
    icon: Truck,
    title: 'משלוחים',
    desc: 'תעודות משלוח, אישור קבלה, וניהול לוגיסטיקה ביום האירוע.',
  },
  {
    icon: Bell,
    title: 'התראות חכמות',
    desc: 'מלאי קריטי, אירועים מתקרבים, מוצרים שעומדים לפוג — בזמן אמת.',
  },
  {
    icon: BarChart3,
    title: 'אנליטיקס',
    desc: 'דוחות, מדדי ביצוע, ותמונה רחבה של הפעילות העסקית.',
  },
];

const screens = [
  { src: screenAgenda, title: 'יומן אירועים', desc: 'תצוגה חודשית עם פרטי כל אירוע, לקוחות וצוות.' },
  { src: screenChef, title: 'לוח השף', desc: 'משימות יומיות לפי מחלקה, עם התקדמות בזמן אמת.' },
  { src: screenWarehouse, title: 'מחסן ומלאי', desc: 'מעקב כמויות, סטטוס קריטי והתראות אוטומטיות.' },
  { src: screenRecipes, title: 'מתכונים', desc: 'ספרייה מלאה עם מרכיבים, עלויות וזמני הכנה.' },
];

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#08070a] text-zinc-100 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[#08070a]/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_24px_rgba(255,138,26,0.55)]">
              <ChefHat className="w-4 h-4 text-black" />
            </div>
            <span className="text-lg font-semibold tracking-tight">קסרולה</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/auth">
              <Button
                variant="ghost"
                className="text-zinc-200 hover:text-white hover:bg-white/5"
              >
                התחברות
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-black font-semibold hover:from-amber-400 hover:to-orange-500 shadow-[0_0_24px_rgba(255,138,26,0.4)]">
                הרשמה
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 min-h-[100vh] flex items-center">
        {/* 3D background */}
        <Suspense fallback={null}>
          <HeroScene className="absolute inset-0 w-full h-full" />
        </Suspense>

        {/* Radial glow overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 40%, rgba(255,138,26,0.18) 0%, rgba(8,7,10,0) 55%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-300 text-xs mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(255,170,80,0.9)]" />
            פלטפורמת ניהול לקייטרינג מקצועי
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
              המטבח שלך,
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500">
              במלוא העוצמה.
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
            ניהול אירועים, מתכונים, מלאי ולוח שף — הכל במקום אחד, חכם, מהיר ומדויק.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth?mode=signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-black font-semibold hover:from-amber-400 hover:to-orange-500 shadow-[0_0_40px_rgba(255,138,26,0.45)] px-8 h-12 text-base"
              >
                התחל עכשיו
                <ArrowLeft className="mr-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button
                size="lg"
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/25 px-8 h-12 text-base"
              >
                צפה בדמו
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-b from-transparent to-[#08070a]" />
      </section>

      {/* Features */}
      <section className="relative py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
                כל מה שצריך,
              </span>{' '}
              <span className="text-amber-400">מערכת אחת.</span>
            </h2>
            <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
              שמונה כלים מקצועיים שמדברים אחד עם השני — בלי לעבור בין מערכות.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-6 hover:border-amber-500/30 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,138,26,0.12)]"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/15 group-hover:border-amber-400/40 transition-colors">
                  <f.icon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots */}
      <section className="relative py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
                תראה את הפלטפורמה
              </span>{' '}
              <span className="text-amber-400">בפעולה.</span>
            </h2>
            <p className="mt-4 text-zinc-400">ממשק מלוטש, מהיר ומותאם לעבודה אמיתית במטבח.</p>
          </div>

          <div className="space-y-24">
            {screens.map((s, i) => (
              <div
                key={s.title}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${
                  i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div className="relative group">
                  <div
                    className="absolute -inset-6 rounded-[2rem] opacity-50 blur-2xl transition-opacity group-hover:opacity-70"
                    style={{
                      background:
                        'radial-gradient(ellipse, rgba(255,138,26,0.35), transparent 70%)',
                    }}
                  />
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-900/50 shadow-2xl">
                    <img
                      src={s.src}
                      alt={s.title}
                      loading="lazy"
                      width={1280}
                      height={832}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                <div>
                  <div className="inline-block text-xs font-mono text-amber-400 mb-3 tracking-widest">
                    0{i + 1}
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4">{s.title}</h3>
                  <p className="text-zinc-400 text-lg leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="relative rounded-3xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.06] to-transparent p-12 overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{
                background:
                  'radial-gradient(circle at 50% 0%, rgba(255,138,26,0.25), transparent 60%)',
              }}
            />
            <h2 className="relative text-4xl md:text-5xl font-bold tracking-tight">
              מוכן להתחיל?
            </h2>
            <p className="relative mt-4 text-zinc-400 text-lg">
              הצטרף לצוות שכבר משדרג את ניהול המטבח שלו.
            </p>
            <div className="relative mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth?mode=signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-black font-semibold hover:from-amber-400 hover:to-orange-500 shadow-[0_0_40px_rgba(255,138,26,0.45)] px-8 h-12 text-base"
                >
                  צור חשבון
                </Button>
              </Link>
              <Link to="/auth">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/25 px-8 h-12 text-base"
                >
                  כבר יש לי חשבון
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-4 items-center justify-between text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <ChefHat className="w-3 h-3 text-black" />
            </div>
            <span>קסרולה — Kitchen Flow</span>
          </div>
          <div>© {new Date().getFullYear()} כל הזכויות שמורות.</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
