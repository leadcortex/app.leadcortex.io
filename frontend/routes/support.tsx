// frontend/routes/support.tsx

import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle, BookOpen } from "@/components/icons";
import { SiteNav, SiteFooter } from "@/components/layout/site-nav";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ContentPageSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Centre d'aide — LeadCortex" },
      {
        name: "description",
        content: "Questions fréquentes sur LeadCortex et contact du support.",
      },
    ],
  }),
  pendingComponent: () => <ContentPageSkeleton />,
  component: Page,
});

const contactOptions = [
  {
    icon: Mail,
    title: "Écrire au support",
    desc: "Une vraie personne vous répond.",
    action: "support@leadcortex.io",
    href: "mailto:support@leadcortex.io",
  },
  {
    icon: MessageCircle,
    title: "Chat dans l'application",
    desc: "La bulle en bas à droite de l'app.",
    action: "Ouvrir l'application",
    href: "/login",
  },
  {
    icon: BookOpen,
    title: "Consulter la documentation",
    desc: "Un guide par fonctionnalité.",
    action: "Voir la documentation",
    href: "/docs",
  },
];

const faqs = [
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Vous recevez des crédits offerts, sans carte bancaire. Les workflows, l'API et les volumes WhatsApp/Instagram élevés demandent un plan payant.",
  },
  {
    q: "Comment fonctionne le prix dégressif ?",
    a: "Votre mensualité baisse chaque mois où vous restez, automatiquement. Le détail est sur la page Tarifs.",
  },
  {
    q: "Dois-je fournir mes propres clés IA ?",
    a: "Non. Les modèles sont inclus sur tous les plans. Brancher vos clés est une option, elle aussi disponible sur tous les plans.",
  },
  {
    q: "Puis-je travailler en équipe ?",
    a: "Oui, à partir de Founder. Tout le monde partage les mêmes prospects, listes, séquences et workflows.",
  },
  {
    q: "Les crédits non utilisés sont-ils reportés ?",
    a: "Non. Ils se renouvellent à chaque cycle de facturation.",
  },
  {
    q: "Comment changer de plan ou résilier ?",
    a: "Depuis Réglages → Facturation, à tout moment. Après résiliation, vos données sont conservées 30 jours puis supprimées.",
  },
  {
    q: "Mes données servent-elles à entraîner une IA ?",
    a: "Non, jamais. Le détail est dans la politique de confidentialité et le DPA.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Carte bancaire (Visa, Mastercard), PayPal, Apple Pay et Google Pay.",
  },
];

function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <section className="mx-auto max-w-7xl px-6 pt-20 pb-12 md:pt-28">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">
            Centre d'aide
          </p>
          <h1 className="mt-4 font-display text-6xl md:text-7xl leading-[0.95] tracking-tight">
            On répond vraiment.
            <br />
            <span className="italic">Pas de bot en boucle.</span>
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-4">
          {contactOptions.map((c) => (
            <a
              key={c.title}
              href={c.href}
              className="group rounded-2xl border border-border p-6 hover:bg-surface hover:border-foreground/20 transition-all"
            >
              <c.icon className="size-5 text-primary" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">{c.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
              <p className="mt-4 text-sm font-medium text-primary group-hover:underline underline-offset-2">
                {c.action}
              </p>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24">
        <h2 className="font-display text-3xl md:text-4xl italic tracking-tight mb-8">
          Questions fréquentes.
        </h2>
        <Accordion type="single" collapsible className="rounded-2xl border border-border px-6">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className={i === faqs.length - 1 ? "border-b-0" : ""}
            >
              <AccordionTrigger className="text-base py-5">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-6 text-sm text-muted-foreground">
          Pas la réponse que vous cherchiez ? Direction la{" "}
          <Link to="/docs" className="text-primary underline underline-offset-2">
            documentation complète
          </Link>{" "}
          ou écrivez directement à{" "}
          <a
            href="mailto:support@leadcortex.io"
            className="text-primary underline underline-offset-2"
          >
            support@leadcortex.io
          </a>
          .
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
