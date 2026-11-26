// frontend/components/landing/landing-pricing.tsx

import { ArrowRight, Check } from "./landing-icons";
import { SiteLink, routes } from "./landing-link";
import { btnDark, btnLight } from "./landing-styles";

const plans = [
  {
    name: "Starter",
    price: "19,99",
    tagline: "Pour valider votre premier canal de prospection.",
    points: ["Un utilisateur", "Modèles IA inclus", "Gmail et Outlook"],
    featured: false,
  },
  {
    name: "Founder",
    price: "39,99",
    tagline: "Pour les duos et les premiers objectifs commerciaux.",
    points: ["Un duo", "Séquences illimitées", "Workflows"],
    featured: true,
  },
  {
    name: "Studio",
    price: "70,99",
    tagline: "Pour les équipes commerciales qui grandissent.",
    points: ["Toute l'équipe, avec rôles", "Accès API", "Plusieurs workspaces"],
    featured: false,
  },
];

export function LandingPricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="max-w-3xl">
        Un prix qui <em>baisse</em> quand vous restez.
      </h2>
      <p className="mt-4 max-w-[60ch] leading-relaxed text-muted-foreground">
        Sans engagement, et moins cher si vous payez à l'année.
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`flex flex-col rounded-xl border bg-background p-6 ${p.featured ? "border-primary/40" : "border-border"}`}
          >
            <h3 className="text-2xl">{p.name}</h3>
            <p className="mt-2 min-h-10 text-sm leading-relaxed text-muted-foreground">
              {p.tagline}
            </p>
            <p className="mt-6 flex items-baseline gap-1.5">
              <span className="font-display text-5xl tabular-nums">{p.price} €</span>
              <span className="text-sm text-muted-foreground">/mois</span>
            </p>
            <ul className="mt-6 flex-1 space-y-2">
              {p.points.map((x) => (
                <li key={x} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} />
                  {x}
                </li>
              ))}
            </ul>
            <SiteLink to={routes.signup} className={`mt-8 ${p.featured ? btnDark : btnLight}`}>
              Commencer avec {p.name}
            </SiteLink>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <SiteLink to={routes.pricing} className="lc-feature-link">
          Voir tous les tarifs
          <ArrowRight size={17} />
        </SiteLink>
      </div>
    </section>
  );
}
