//frontend\routes\security.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Lock,
  KeyRound,
  ShieldCheck,
  Server,
  Users,
  FileCheck,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { ContentPageSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Sécurité — LeadCortex" },
      {
        name: "description",
        content:
          "Comment LeadCortex protège vos données : chiffrement, gestion des clés BYOK, isolation des workspaces, hébergement et divulgation responsable.",
      },
      { property: "og:title", content: "Sécurité — LeadCortex" },
    ],
  }),
  pendingComponent: () => <ContentPageSkeleton />,
  component: Page,
});

const pillars = [
  {
    icon: Lock,
    title: "Chiffrement de bout en bout",
    desc: "Toutes les données transitent en TLS 1.2+ et sont chiffrées au repos (AES-256), y compris les sauvegardes.",
  },
  {
    icon: KeyRound,
    title: "Clés IA isolées",
    desc: "Une clé BYOK est chiffrée individuellement, jamais journalisée en clair, et révocable en un clic depuis les réglages.",
  },
  {
    icon: Users,
    title: "Isolation par workspace",
    desc: "Les données de chaque workspace sont cloisonnées logiquement. Aucun accès croisé n'est possible entre deux comptes clients, ni entre deux workspaces d'une même équipe.",
  },
  {
    icon: Server,
    title: "Hébergement UE",
    desc: "Infrastructure hébergée au sein de l'Union européenne, avec sauvegardes chiffrées et redondance géographique.",
  },
  {
    icon: Eye,
    title: "Accès au moindre privilège",
    desc: "Les accès internes aux données de production sont restreints, nominatifs et journalisés. Aucun accès permanent par défaut.",
  },
  {
    icon: FileCheck,
    title: "Conformité RGPD",
    desc: "Un accord de traitement des données (DPA) est fourni à tout client professionnel, sans démarche supplémentaire.",
  },
];

function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <section className="mx-auto max-w-7xl px-6 pt-20 pb-12 md:pt-28">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">Sécurité</p>
          <h1 className="mt-4 font-display text-6xl md:text-7xl leading-[0.95] tracking-tight">
            Vos données restent
            <br />
            <span className="italic">les vôtres.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-[54ch]">
            LeadCortex manipule des données commerciales sensibles pour des équipes qui n'ont pas
            toujours d'équipe sécurité dédiée. C'est précisément pour ça que la nôtre doit être
            irréprochable.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-4">
          {pillars.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border p-6">
              <p.icon className="size-5 text-primary" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">{p.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 border-t border-border/60">
        <h2 className="font-display text-3xl md:text-4xl italic tracking-tight mb-6">
          Le choix des modèles, vu sous l'angle sécurité.
        </h2>
        <div className="space-y-5 text-[15px] leading-relaxed text-foreground/90">
          <p>
            Le choix du mode « clés personnelles » (BYOK) n'est pas qu'une question de prix : c'est
            aussi une réduction de surface d'attaque. LeadCortex ne détient jamais de clé IA
            partagée à haut privilège qui, si elle fuitait, exposerait l'ensemble des clients.
            Chaque clé est scellée à un seul workspace, chiffrée individuellement, et peut être
            révoquée instantanément sans impacter aucun autre compte.
          </p>
          <p>
            Vous pouvez attribuer une clé différente à l'IA de recherche et à l'IA de travail, ou
            utiliser les modèles inclus sans aucune clé. Le contenu envoyé au modèle (par exemple un
            profil à scorer) est transmis pour la durée de la requête et n'est pas conservé côté
            LeadCortex au-delà de ce qui est nécessaire à l'exécution de la fonctionnalité demandée.
          </p>
          <p>
            Pour les équipes, chaque membre accède uniquement aux données du workspace auquel il a
            été invité, avec le rôle qui lui a été attribué (édition ou lecture seule). Les actions
            sensibles sont journalisées.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 border-t border-border/60">
        <div className="flex items-start gap-4">
          <AlertTriangle className="size-6 text-primary shrink-0 mt-1" />
          <div>
            <h2 className="font-display text-2xl md:text-3xl italic tracking-tight">
              Signaler une vulnérabilité.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-foreground/90">
              Si vous identifiez une faille de sécurité, écrivez directement à{" "}
              <a
                href="mailto:security@leadcortex.io"
                className="text-primary underline underline-offset-2"
              >
                security@leadcortex.io
              </a>{" "}
              avec le détail nécessaire à sa reproduction. Nous accusons réception sous 48h et nous
              engageons à ne poursuivre aucune action contre un signalement fait de bonne foi, dans
              le respect d'un délai raisonnable de correction avant toute divulgation publique.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-2xl border border-border bg-surface/40 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <ShieldCheck className="size-8 text-primary shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Besoin d'un document pour votre revue fournisseur ?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                L'accord de traitement des données (DPA) couvre l'essentiel des questions d'une
                revue sécurité standard.
              </p>
            </div>
          </div>
          <Link
            to="/legal/dpa"
            className="inline-flex items-center justify-center rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-all shrink-0"
          >
            Consulter le DPA
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
