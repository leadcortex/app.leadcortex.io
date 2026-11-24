// frontend/components/landing/landing-faq.tsx

import { useState } from "react";
import { Button } from "./landing-button";
import { Minus, Plus } from "./landing-icons";
import { eyebrow } from "./landing-styles";

const faqs = [
  [
    "En quoi LeadCortex diffère d'Apollo ou Clay ?",
    "Eux vendent des données. LeadCortex les utilise pour vous : une IA cherche, l'autre écrit.",
  ],
  [
    "Le prix baisse vraiment ?",
    "Oui, chaque mois où vous restez, automatiquement. Le détail est sur la page Tarifs.",
  ],
  [
    "Dois-je fournir mes propres clés IA ?",
    "Non. Les modèles sont inclus. Vos clés sont une option, sur tous les plans.",
  ],
  [
    "Y a-t-il un essai gratuit ?",
    "Oui, avec des crédits offerts et sans carte bancaire. Les workflows démarrent avec le plan Founder.",
  ],
];

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <p className={`${eyebrow} text-center`}>FAQ</p>
      <h2 className="mt-3 text-center">
        Les questions <em>qu'on nous pose</em>.
      </h2>
      <div className="mt-12 divide-y divide-border border-y border-border">
        {faqs.map(([q, a], i) => (
          <div key={q}>
            <Button
              variant="lcFaq"
              aria-expanded={open === i}
              aria-controls={`faq-answer-${i}`}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span>{q}</span>
              {open === i ? (
                <Minus className="h-5 w-5 shrink-0" />
              ) : (
                <Plus className="h-5 w-5 shrink-0" />
              )}
            </Button>
            <div
              id={`faq-answer-${i}`}
              className={`lc-faq-answer ${open === i ? "is-open" : ""}`}
              aria-hidden={open !== i}
            >
              <div>
                <p className="pb-6 leading-relaxed text-muted-foreground">{a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
