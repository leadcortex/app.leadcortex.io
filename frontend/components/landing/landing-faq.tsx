// frontend/components/landing/landing-faq.tsx

import { useState } from "react";
import { Button } from "./landing-button";
import { Minus, Plus } from "./landing-icons";

const faqs = [
  [
    "En quoi LeadCortex diffère d'Apollo ou Clay ?",
    "Apollo et Clay vendent surtout de la donnée. Dans LeadCortex, une IA cherche les prospects et l'autre leur écrit, dans le même outil.",
  ],
  [
    "Le prix baisse vraiment ?",
    "Oui, un peu chaque mois où vous restez, sans rien demander. Le calcul est sur la page Tarifs.",
  ],
  [
    "Dois-je fournir mes propres clés IA ?",
    "Non, les modèles sont inclus. Vous pouvez brancher vos clés si vous préférez, sur tous les plans.",
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
      <h2 className="text-center">
        Questions <em>fréquentes</em>.
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
