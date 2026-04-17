import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Boxes, Calendar, ChefHat, Sparkles, Truck, type LucideIcon } from 'lucide-react';

import screenAgenda from '@/assets/landing/screen-agenda.jpg';
import screenChef from '@/assets/landing/screen-chef.jpg';
import screenRecipes from '@/assets/landing/screen-recipes.jpg';
import screenWarehouse from '@/assets/landing/screen-warehouse.jpg';

interface HeroSceneProps {
  className?: string;
}

interface HeroCard {
  title: string;
  badge: string;
  detail: string;
  src: string;
  alt: string;
  icon: LucideIcon;
  panelClassName: string;
  baseTransform: string;
  depth: number;
  shiftX: number;
  shiftY: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const heroCards: HeroCard[] = [
  {
    title: 'יומן הפקה',
    badge: 'אירועים',
    detail: 'הלקוח, השעות, הלוגיסטיקה והסטטוס של כל הפקה מסודרים במקום אחד.',
    src: screenAgenda,
    alt: 'מסך יומן הפקות ואירועים במערכת קסרולה',
    icon: Calendar,
    panelClassName: 'right-[8%] top-[12%] h-[44%] w-[70%] sm:w-[62%] md:w-[54%]',
    baseTransform: 'rotateX(3deg) rotateY(-10deg)',
    depth: 220,
    shiftX: 24,
    shiftY: -18,
  },
  {
    title: 'לוח שף',
    badge: 'מטבח',
    detail: 'המשימות של היום, מה מוכן ומה עוד צריך לזוז — בזמן אמת.',
    src: screenChef,
    alt: 'מסך לוח שף ומשימות מטבח במערכת קסרולה',
    icon: ChefHat,
    panelClassName: 'left-[4%] top-[10%] h-[30%] w-[48%] sm:w-[38%] md:w-[30%]',
    baseTransform: 'rotateX(-2deg) rotateY(14deg)',
    depth: 260,
    shiftX: -18,
    shiftY: -24,
  },
  {
    title: 'מלאי ורכש',
    badge: 'מחסן',
    detail: 'חוסרים, רמות מלאי ותכנון קנייה בלי לרדוף אחרי אקסלים וקבוצות וואטסאפ.',
    src: screenWarehouse,
    alt: 'מסך מחסן ומלאי במערכת קסרולה',
    icon: Boxes,
    panelClassName: 'left-[12%] bottom-[13%] h-[28%] w-[44%] sm:w-[34%] md:w-[31%]',
    baseTransform: 'rotateX(6deg) rotateY(12deg)',
    depth: 180,
    shiftX: -22,
    shiftY: 14,
  },
  {
    title: 'מתכונים ועלויות',
    badge: 'תפריטים',
    detail: 'כל רכיב, כל כמות וכל מחיר זמינים לצוות כשמרכיבים מגשים ומנות.',
    src: screenRecipes,
    alt: 'מסך מתכונים ועלויות במערכת קסרולה',
    icon: Sparkles,
    panelClassName: 'bottom-[10%] right-[6%] hidden h-[24%] w-[34%] sm:block md:w-[24%]',
    baseTransform: 'rotateX(-4deg) rotateY(-14deg)',
    depth: 150,
    shiftX: 16,
    shiftY: 20,
  },
];

const serviceSignals = [
  { icon: Calendar, label: 'אירועים מסונכרנים' },
  { icon: Truck, label: 'יציאות ושירות' },
  { icon: Boxes, label: 'מלאי ורזרבות' },
];

const getCardTransform = (
  card: HeroCard,
  pointer: { x: number; y: number },
  isActive: boolean,
  reducedMotion: boolean,
) => {
  const x = reducedMotion ? 0 : pointer.x * card.shiftX;
  const y = reducedMotion ? 0 : pointer.y * card.shiftY;
  const depth = card.depth + (isActive ? 36 : 0);
  return `translate3d(${x}px, ${y}px, ${depth}px) ${card.baseTransform}`;
};

export const HeroScene = ({ className }: HeroSceneProps) => {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [activeCard, setActiveCard] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const frameRef = useRef<number | null>(null);
  const nextPointerRef = useRef(pointer);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setReducedMotion(media.matches);

    updateMotionPreference();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', updateMotionPreference);
      return () => media.removeEventListener('change', updateMotionPreference);
    }

    media.addListener(updateMotionPreference);
    return () => media.removeListener(updateMotionPreference);
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const commitPointer = () => {
    if (frameRef.current !== null) return;

    frameRef.current = window.requestAnimationFrame(() => {
      setPointer(nextPointerRef.current);
      frameRef.current = null;
    });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
    const y = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);

    nextPointerRef.current = { x, y };
    commitPointer();
  };

  const handlePointerLeave = () => {
    nextPointerRef.current = { x: 0, y: 0 };
    commitPointer();
  };

  const activeInfo = heroCards[activeCard];

  const sceneTransform = reducedMotion
    ? 'translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)'
    : `translate3d(0, 0, 0) rotateX(${(-pointer.y * 8).toFixed(2)}deg) rotateY(${(
        pointer.x * 12
      ).toFixed(2)}deg)`;

  const spotlightStyle = useMemo<CSSProperties>(
    () => ({
      backgroundImage: `radial-gradient(circle at ${50 + pointer.x * 24}% ${30 + pointer.y * 18}%, hsl(var(--landing-glow) / 0.95), transparent 24%), radial-gradient(circle at 20% 76%, hsl(var(--landing-sage-soft) / 0.9), transparent 28%), linear-gradient(180deg, hsl(var(--landing-shell)) 0%, hsl(var(--landing-surface)) 100%)`,
    }),
    [pointer.x, pointer.y],
  );

  return (
    <div className={[className, 'relative h-full w-full overflow-hidden bg-landing-shell'].filter(Boolean).join(' ')}>
      <div className="absolute inset-0" style={spotlightStyle} />
      <div className="landing-grid absolute inset-0 opacity-70" />
      <div className="absolute -left-16 top-10 h-48 w-48 rounded-full bg-landing-warm-soft/80 blur-3xl" />
      <div className="absolute -right-8 top-24 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-8 left-1/2 h-32 w-[72%] -translate-x-1/2 rounded-[999px] bg-landing-surface-strong/90 blur-3xl" />

      <div
        className="relative h-full w-full [perspective:2200px]"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div className="absolute right-5 top-5 z-30 hidden max-w-[18rem] rounded-[1.75rem] border border-landing-surface/90 bg-landing-surface/85 p-4 shadow-landing backdrop-blur-xl md:block">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <activeInfo.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">{activeInfo.badge}</p>
              <p className="text-base font-semibold text-landing-ink">{activeInfo.title}</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{activeInfo.detail}</p>
          <p className="mt-3 text-xs font-medium text-primary">זוזו עם הסמן כדי להרגיש את השכבות בתנועה</p>
        </div>

        <div className="absolute bottom-5 left-5 z-30 hidden gap-3 md:grid">
          {serviceSignals.map((signal) => (
            <div
              key={signal.label}
              className="flex items-center gap-3 rounded-full border border-border/70 bg-card/80 px-4 py-2 shadow-soft backdrop-blur-xl"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <signal.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-landing-ink">{signal.label}</span>
            </div>
          ))}
        </div>

        <div className="absolute inset-[8%] rounded-[2.75rem] border border-landing-surface/85 bg-background/30 shadow-landing [transform:translate3d(0,0,50px)]" />
        <div className="absolute inset-[12%] rounded-[2.75rem] border border-landing-surface/80 bg-card/50 [transform:translate3d(0,0,90px)]" />

        <div
          className="absolute inset-0 [transform-style:preserve-3d] transition-transform duration-300 ease-out"
          style={{ transform: sceneTransform }}
        >
          {heroCards.map((card, index) => (
            <button
              key={card.title}
              type="button"
              onMouseEnter={() => setActiveCard(index)}
              onFocus={() => setActiveCard(index)}
              aria-label={card.title}
              className={`absolute cursor-default overflow-hidden rounded-[1.75rem] border border-landing-surface/90 bg-landing-surface/95 text-right shadow-landing-float transition duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${card.panelClassName}`}
              style={{ transform: getCardTransform(card, pointer, activeCard === index, reducedMotion) }}
            >
              <img src={card.src} alt={card.alt} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-landing-ink/85 via-landing-ink/45 to-transparent p-4 text-primary-foreground">
                <span className="mb-2 inline-flex rounded-full border border-primary-foreground/20 bg-primary-foreground/15 px-3 py-1 text-[11px] font-medium tracking-[0.22em]">
                  {card.badge}
                </span>
                <p className="text-base font-semibold">{card.title}</p>
              </div>
            </button>
          ))}

          <div
            className="absolute left-[8%] top-[18%] hidden h-24 w-24 items-center justify-center rounded-full border border-landing-surface/90 bg-landing-surface/85 shadow-landing-float md:flex"
            style={{
              transform: reducedMotion
                ? 'translate3d(0, 0, 120px)'
                : `translate3d(${pointer.x * -24}px, ${pointer.y * -18}px, 120px)`,
            }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/10 bg-primary/5 text-primary">
              <Sparkles className="h-7 w-7" />
            </div>
          </div>

          <div
            className="absolute bottom-[16%] right-[18%] hidden h-20 w-20 items-center justify-center rounded-full border border-landing-surface/90 bg-landing-surface/90 shadow-landing-float lg:flex"
            style={{
              transform: reducedMotion
                ? 'translate3d(0, 0, 140px)'
                : `translate3d(${pointer.x * 18}px, ${pointer.y * -12}px, 140px)`,
            }}
          >
            <ChefHat className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
};
