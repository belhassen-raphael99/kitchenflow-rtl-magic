import { landingFeatures } from '@/components/landing/content';

export const LandingFeatureGrid = () => {
  return (
    <section className="border-t border-border/60 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-3 text-sm font-medium text-primary">מהמכירה ועד השירות ביום האירוע</p>
          <h2 className="text-3xl font-semibold tracking-tight text-landing-ink sm:text-4xl lg:text-5xl">
            מערכת אחת שמחברת בין המשרד, המטבח, המחסן והיציאה לשטח.
          </h2>
          <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
            קסרולה נבנתה לקייטרינגים שצריכים סדר תפעולי, תמונה מלאה ויכולת להגיב מהר — בלי לעבור בין כמה מערכות.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {landingFeatures.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-[1.75rem] border border-border/70 bg-landing-surface/80 p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-landing"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition duration-300 group-hover:bg-primary/15">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-landing-ink">{feature.title}</h3>
              <p className="text-sm leading-7 text-muted-foreground">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};