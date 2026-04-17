import { landingScreens } from '@/components/landing/content';

export const LandingShowcase = () => {
  return (
    <section className="border-t border-border/60 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="mb-3 text-sm font-medium text-primary">תראו את העבודה בפנים</p>
          <h2 className="text-3xl font-semibold tracking-tight text-landing-ink sm:text-4xl lg:text-5xl">
            מסכים שמרגישים כמו חדר בקרה לקייטרינג פעיל.
          </h2>
          <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
            לא עוד אקסלים, פתקים והודעות מפוזרות — אלא פלטפורמה אחת שמציגה לצוות מה צריך לקרות עכשיו.
          </p>
        </div>

        <div className="space-y-16 lg:space-y-20">
          {landingScreens.map((screen, index) => (
            <article
              key={screen.title}
              className={`grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] ${
                index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
              }`}
            >
              <figure className="relative">
                <div className="absolute -inset-4 rounded-[2rem] bg-landing-warm-soft/70 blur-3xl" />
                <div className="relative overflow-hidden rounded-[2rem] border border-landing-surface/85 bg-landing-surface shadow-landing">
                  <img
                    src={screen.src}
                    alt={screen.alt}
                    loading="lazy"
                    width={1280}
                    height={832}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </figure>

              <div className="max-w-xl space-y-4">
                <span className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                  {screen.eyebrow}
                </span>
                <h3 className="text-2xl font-semibold tracking-tight text-landing-ink sm:text-3xl lg:text-4xl">
                  {screen.title}
                </h3>
                <p className="text-base leading-8 text-muted-foreground sm:text-lg">{screen.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};