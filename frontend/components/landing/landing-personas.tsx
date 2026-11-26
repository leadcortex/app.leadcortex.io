// frontend/components/landing/landing-personas.tsx

import { ArrowRight } from "./landing-icons";
import { SiteLink, routes } from "./landing-link";

const personaBlue = "/images/site/personas/blue.avif";
const personaBlueFull = "/images/site/personas/blue-full.avif";
const personaGreen = "/images/site/personas/green.avif";
const personaGreenFull = "/images/site/personas/green-full.avif";
const personaOrange = "/images/site/personas/orange.avif";
const personaOrangeFull = "/images/site/personas/orange-full.avif";
const personaPink = "/images/site/personas/pink.avif";
const personaPinkFull = "/images/site/personas/pink-full.avif";

export function LandingPersonas() {
  const ps = [
    {
      t: "Founders solo",
      d: "Plan Starter",
      img: personaBlue,
      full: personaBlueFull,
    },
    {
      t: "Duos",
      d: "Plan Founder",
      img: personaGreen,
      full: personaGreenFull,
    },
    {
      t: "Équipes commerciales",
      d: "Plan Studio",
      img: personaPink,
      full: personaPinkFull,
    },
    {
      t: "Équipes techniques",
      d: "Plan Studio · API",
      img: personaOrange,
      full: personaOrangeFull,
    },
  ];
  return (
    <section id="personas" className="bg-surface py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="max-w-2xl">
          Seul, à deux ou <em>en équipe</em>.
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ps.map((p) => (
            <SiteLink
              key={p.t}
              to={routes.pricing}
              className="group overflow-hidden rounded-xl border border-border bg-background transition-colors hover:border-foreground/20"
            >
              <div className="lc-swap">
                <img
                  src={p.img}
                  alt={p.t}
                  loading="lazy"
                  className="lc-swap-base aspect-[6/5] w-full object-cover"
                />
                <img
                  src={p.full}
                  alt=""
                  loading="lazy"
                  aria-hidden="true"
                  className="lc-swap-full aspect-[6/5] w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between px-6 pt-4 font-medium">
                {p.t}
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              </div>
              <p className="px-6 pb-4 pt-1 text-sm text-muted-foreground">
                {p.d}
              </p>
            </SiteLink>
          ))}
        </div>
      </div>
    </section>
  );
}
