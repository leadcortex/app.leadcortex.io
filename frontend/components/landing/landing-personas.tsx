// frontend/components/landing/landing-personas.tsx

import { ArrowRight } from "./landing-icons";
import { SiteLink, routes } from "./landing-link";
import { eyebrow } from "./landing-styles";

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
        <p className={eyebrow}>Pour qui ?</p>
        <h2 className="mt-3 max-w-2xl">
          Seul, à deux ou <em>en équipe</em>.
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ps.map((p) => (
            <SiteLink
              key={p.t}
              to={routes.pricing}
              className="group overflow-hidden rounded-2xl border border-border bg-background transition duration-300 hover:-translate-y-1 hover:shadow-xl"
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
              <div className="flex items-center justify-between px-5 pt-5 font-medium tracking-tight">
                {p.t}
                <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
              </div>
              <p className="px-5 pb-5 pt-1.5 text-sm leading-relaxed text-muted-foreground">
                {p.d}
              </p>
            </SiteLink>
          ))}
        </div>
      </div>
    </section>
  );
}
