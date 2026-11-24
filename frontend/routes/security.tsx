// frontend/routes/security.tsx

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
} from "@/components/icons";
import { SiteNav, SiteFooter } from "@/components/layout/site-nav";
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
    title: "Données chiffrées",
    desc: "En transit et au repos, sauvegardes comprises.",
  },
  {
    icon: KeyRound,
    title: "Clés IA protégées",
    desc: "Chiffrées une par une, révocables en un clic.",
  },
  { icon: Users, title: "Workspaces cloisonnés", desc: "Aucun accès croisé entre comptes." },
  { icon: Server, title: "Hébergé en Europe", desc: "Avec sauvegardes redondantes." },
  { icon: Eye, title: "Accès internes limités", desc: "Nominatifs et journalisés." },
  { icon: FileCheck, title: "RGPD", desc: "Un DPA fourni à chaque client professionnel." },
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
              avec les étapes pour la reproduire. Aucune poursuite contre un signalement de bonne
              foi.
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
              <p className="mt-1 text-sm text-muted-foreground">Le DPA répond à l'essentiel.</p>
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
