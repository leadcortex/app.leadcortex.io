//frontend\routes\support.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle, BookOpen } from "lucide-react";
import { SiteNav, SiteFooter } from "@/components/site-nav";
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
        content:
          "Questions fréquentes sur LeadCortex : facturation, prix dégressif, crédits, équipes IA, collaboration, et comment contacter l'équipe support.",
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
    desc: "Réponse sous 24h ouvrées, souvent bien plus vite.",
    action: "support@leadcortex.io",
    href: "mailto:support@leadcortex.io",
  },
  {
    icon: MessageCircle,
    title: "Chat dans l'application",
    desc: "Depuis l'app, la bulle en bas à droite atteint directement l'équipe.",
    action: "Ouvrir l'application",
    href: "/login",
  },
  {
    icon: BookOpen,
    title: "Consulter la documentation",
    desc: "Guides détaillés sur chaque fonctionnalité du produit.",
    action: "Voir la documentation",
    href: "/docs",
  },
];

const faqs = [
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "L'essai vous donne accès aux fonctionnalités principales avec un quota de crédits d'enrichissement réduit, sans carte bancaire requise. Certaines fonctionnalités à coût d'infrastructure élevé (éditeur de workflows, intégrations WhatsApp/Instagram illimitées, accès API) sont réservées aux plans payants. À l'issue de la période d'essai, vous choisissez un plan payant pour continuer, ou votre compte reste accessible en lecture seule.",
  },
  {
    q: "Comment fonctionne le prix dégressif ?",
    a: "Notre engagement est simple : plus vous restez, moins vous payez. Votre mensualité baisse automatiquement de 2 % par mois de fidélité, jusqu'à un plafond de -20 % atteint après 10 mois. Aucune action requise, aucune condition cachée. La réduction s'applique sur le tarif mensuel ou annuel selon votre cycle de facturation, et reste acquise tant que votre abonnement est actif. Vous pouvez simuler le prix à venir directement depuis Réglages → Facturation.",
  },
  {
    q: "Pourquoi le workflow n'est-il pas inclus dans l'essai ?",
    a: "L'éditeur de workflows est une fonctionnalité à coût d'infrastructure élevé : exécution continue en arrière-plan, files d'attente, stockage d'historique d'exécution, gestion d'événements. Ces coûts ne sont pas soutenables sur un essai gratuit illimité. Le workflow est donc inclus à partir du plan Founder, avec un quota d'exécutions mensuelles qui augmente avec le plan. Voir le détail sur la page tarifs.",
  },
  {
    q: "Qu'est-ce que le BYOK, et est-ce obligatoire ?",
    a: "BYOK signifie « bring your own key » : vous connectez vos propres clés API de fournisseurs de modèles IA (Anthropic, OpenAI, Google, Groq, DeepSeek, Mistral, Perplexity) plutôt que de payer une marge sur un usage revendu par LeadCortex. Ce n'est PAS obligatoire : les modèles inclus (Claude, ChatGPT, Gemini, Perplexity) fonctionnent par défaut sur tous les plans. Le BYOK est disponible sur les trois plans, y compris Starter. Bonus BYOK : le chat avec les agents devient illimité.",
  },
  {
    q: "Quelles sont les limites sur WhatsApp et Instagram ?",
    a: "Les intégrations WhatsApp et Instagram sont facturées par Meta au message envoyé. Pour cette raison, elles sont limitées à 20 messages/jour cumulés sur Starter, 200 messages/jour cumulés sur Founder, et sans restriction majeure sur Studio. Ces limites sont cumulatives entre les deux canaux.",
  },
  {
    q: "Quelles sont les limites des assistants IA sur les plans inférieurs ?",
    a: "Sur Starter, les assistants IA inclus (Claude, ChatGPT, Gemini) sont accessibles mais avec un usage modéré — adapté à une utilisation de découverte ou à un volume léger. À partir de Founder, l'usage des assistants est illimité en interne. Sur Studio, tous les fournisseurs sont accessibles sans restriction, y compris via BYOK. L'objectif n'est pas de frustrer mais de refléter la réalité des coûts d'infrastructure IA.",
  },
  {
    q: "Puis-je travailler en équipe sur le même workspace ?",
    a: "Oui. Starter est mono-utilisateur. Founder inclut 1 siège édition + 1 invité en lecture seule (idéal pour un duo fondateur). Studio inclut 5 sièges avec rôles différenciés édition/lecture, multi-workspaces et projets partagés. Dans tous les cas, les membres d'un workspace partagent les mêmes prospects, listes, séquences et workflows.",
  },
  {
    q: "Les crédits non utilisés sont-ils reportés au mois suivant ?",
    a: "Non, sauf mention contraire indiquée sur votre plan. Les crédits d'enrichissement se renouvellent en début de cycle de facturation et ne sont pas cumulables. Le détail de ce qui consomme un crédit est expliqué dans la documentation, section Comprendre les crédits d'enrichissement.",
  },
  {
    q: "Puis-je changer de plan à tout moment ?",
    a: "Oui, depuis Réglages → Facturation. Un changement à la hausse s'applique immédiatement avec un prorata ; un changement à la baisse prend effet au début du cycle suivant. Votre réduction fidélité est conservée lors d'un changement de plan — elle s'applique sur le nouveau tarif.",
  },
  {
    q: "Comment résilier mon abonnement ?",
    a: "Depuis Réglages → Facturation, sans justification à fournir. L'accès reste actif jusqu'à la fin de la période déjà payée. Vos données sont conservées 30 jours après résiliation avant suppression définitive. Si vous résiliez puis revenez plus tard, votre ancienneté de fidélité n'est pas conservée : le compteur redémarre.",
  },
  {
    q: "Mes données de prospection sont-elles utilisées pour entraîner un modèle IA ?",
    a: "Non. Vos données ne sont jamais utilisées pour entraîner des modèles, ni par LeadCortex ni par les fournisseurs IA que vous connectez en BYOK dans le cadre de l'usage du Service. Le détail est précisé dans la politique de confidentialité et le DPA.",
  },
  {
    q: "Le Service est-il conforme au RGPD ?",
    a: "Oui. LeadCortex documente son rôle de sous-traitant via un accord de traitement des données (DPA) fourni à tout client professionnel, et applique les mesures de sécurité détaillées sur la page Sécurité. Le choix de vos fournisseurs IA (modèles inclus ou BYOK) reste sous votre contrôle.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Nous acceptons Visa, Mastercard, Stripe, PayPal, Apple Pay et Google Pay. Tous les paiements sont traités par des prestataires certifiés PCI DSS. Les factures sont disponibles automatiquement dans Réglages → Facturation dès l'émission.",
  },
  {
    q: "J'ai un problème technique urgent, que faire ?",
    a: "Écrivez à support@leadcortex.io en précisant « urgent » dans l'objet, avec l'identifiant de votre workspace si possible. Les incidents affectant plusieurs comptes sont également suivis sur notre page de statut.",
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
          <p className="mt-6 text-lg text-muted-foreground max-w-[52ch]">
            Une question précise sur la facturation, un bug, ou un doute sur le fonctionnement d'une
            fonctionnalité : commencez par la FAQ ci-dessous, et si elle ne suffit pas, l'équipe est
            à un email.
          </p>
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
