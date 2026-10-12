//frontend\routes\app.deals.$id.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge, Kpi } from "@/components/ui-primitives";
import { useAppStore } from "@/lib/store";
import {
  ArrowLeft,
  Building2,
  User,
  Calendar,
  DollarSign,
  Edit,
  MoreHorizontal,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  FileText,
  Send,
  Phone,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DealDetailSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/app/deals/$id")({
  head: () => ({
    meta: [{ title: "Opportunité — LeadCortex" }],
  }),
  pendingComponent: () => <DealDetailSkeleton />,
  component: DealsDetailPage,
});

function DealsDetailPage() {
  const { id } = Route.useParams();
  const { deals, advanceDealStage, addActivity } = useAppStore();
  const deal = deals.find((d) => d.id === id);

  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "notes" | "emails">(
    "overview",
  );

  if (!deal) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="size-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-2xl italic">Opportunité introuvable</h2>
        <p className="text-muted-foreground text-sm mt-2">
          Cette opportunité n'existe pas ou a été supprimée.
        </p>
        <Link
          to="/app/deals"
          className="inline-flex items-center gap-2 mt-6 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-4" /> Retour au pipeline
        </Link>
      </div>
    );
  }

  const isWon = deal.stage === "won";
  const isLost = deal.stage === "lost";
  const canAdvance = !isWon && !isLost;

  return (
    <div className="p-8 max-w-6xl">
      {}
      <Link
        to="/app/deals"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-4" /> Retour au pipeline
      </Link>

      {}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl italic">{deal.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-4" /> {deal.company}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="size-4" /> {deal.contact}
            </span>
            <span className="flex items-center gap-1.5">
              <DollarSign className="size-4" /> {deal.amount.toLocaleString("fr-FR")} €
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canAdvance && (
            <button
              onClick={() => {
                advanceDealStage(deal.id);
                addActivity("Étape avancée", deal.name);
                toast.success(`${deal.name} → étape suivante`);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all"
            >
              Avancer <ArrowRight className="size-4" />
            </button>
          )}
          <button className="p-2 rounded-lg border border-border hover:bg-surface transition-colors">
            <Edit className="size-4" />
          </button>
          <button className="p-2 rounded-lg border border-border hover:bg-surface transition-colors">
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Badge
          tone={
            deal.stage === "won"
              ? "success"
              : deal.stage === "negotiation"
                ? "primary"
                : deal.stage === "lost"
                  ? "destructive"
                  : "muted"
          }
        >
          {deal.stage}
        </Badge>
        <Badge tone="muted">Probabilité {deal.probability}%</Badge>
        <Badge tone="muted">Clôture {deal.close}</Badge>
        <Badge tone="muted">
          <Clock className="size-3 mr-1" /> Montant {deal.amount.toLocaleString("fr-FR")} €
        </Badge>
      </div>

      <div className="grid sm:grid-cols-4 gap-3 mb-8">
        <Kpi
          label="Montant"
          value={`${(deal.amount / 1000).toFixed(0)}K€`}
          sub={`${deal.probability}% probabilité`}
        />
        <Kpi
          label="Étape"
          value={deal.stage}
          sub={deal.stage === "won" ? "Gagné 🎉" : deal.stage === "lost" ? "Perdu" : "En cours"}
        />
        <Kpi
          label="Clôture"
          value={deal.close}
          sub={isWon ? "À confirmer" : isLost ? "À analyser" : "Objectif"}
        />
        <Kpi
          label="Valeur pondérée"
          value={`${((deal.amount * deal.probability) / 100 / 1000).toFixed(0)}K€`}
          sub="(Montant × Probabilité)"
        />
      </div>

      <div className="mb-8 p-4 rounded-xl bg-surface/40 border border-border">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground">Progression</span>
          <span className="font-medium">{deal.probability}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${deal.probability}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          {["Qualifié", "Proposition", "Négociation", "Gagné"].map((stage, i) => {
            const stageKeys = ["qualified", "proposal", "negotiation", "won"];
            const isActive = stageKeys.indexOf(deal.stage) >= i;
            return (
              <span key={stage} className={isActive ? "text-primary font-medium" : ""}>
                {stage}
                {i < 3 && <ArrowRight className="inline size-3 mx-1 text-muted-foreground/30" />}
              </span>
            );
          })}
        </div>
      </div>

      <div className="border-b border-border mb-6">
        <div className="flex gap-6">
          {(["overview", "activity", "notes", "emails"] as const).map((tab) => {
            const labels = {
              overview: "Aperçu",
              activity: "Activité",
              notes: "Notes",
              emails: "Emails",
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="animate-fade-in-up">
        {activeTab === "overview" && <OverviewTab deal={deal} />}
        {activeTab === "activity" && <ActivityTab deal={deal} />}
        {activeTab === "notes" && <NotesTab deal={deal} />}
        {activeTab === "emails" && <EmailsTab deal={deal} />}
      </div>
    </div>
  );
}

function OverviewTab({ deal }: { deal: any }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-xl border border-border bg-background p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">
          Détails de l'opportunité
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nom</span>
            <span className="font-medium">{deal.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entreprise</span>
            <span>{deal.company}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contact</span>
            <span>{deal.contact}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Montant</span>
            <span className="font-mono">{deal.amount.toLocaleString("fr-FR")} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Étape</span>
            <Badge tone={deal.stage === "won" ? "success" : "primary"}>{deal.stage}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Probabilité</span>
            <span>{deal.probability}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Clôture</span>
            <span>{deal.close}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Actions rapides
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toast.info("Envoi d'email...")}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-surface transition-colors"
            >
              <Mail className="size-3.5" /> Envoyer un email
            </button>
            <button
              onClick={() => toast.info("Création d'une tâche...")}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-surface transition-colors"
            >
              <FileText className="size-3.5" /> Créer une tâche
            </button>
            <button
              onClick={() => toast.info("Planification...")}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-surface transition-colors"
            >
              <Calendar className="size-3.5" /> Planifier un meeting
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Indicateurs
          </h3>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-display text-primary">{deal.probability}%</div>
              <p className="text-xs text-muted-foreground mt-1">Probabilité</p>
            </div>
            <div className="flex-1">
              <div className="text-sm">
                <span className="text-muted-foreground">Valeur pondérée : </span>
                <span className="font-medium">
                  {((deal.amount * deal.probability) / 100 / 1000).toFixed(0)}K€
                </span>
              </div>
              <div className="text-sm mt-1">
                <span className="text-muted-foreground">Taille : </span>
                <span className="font-medium">
                  {deal.amount >= 50000 ? "Grand compte" : deal.amount >= 20000 ? "Moyen" : "Petit"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityTab({ deal }: { deal: any }) {
  const activities = [
    {
      id: "a1",
      type: "stage",
      label: "Changement d'étape",
      detail: `Passage à "${deal.stage}"`,
      time: "il y a 2h",
    },
    {
      id: "a2",
      type: "email",
      label: "Email envoyé",
      detail: "Proposition commerciale envoyée",
      time: "il y a 1j",
    },
    {
      id: "a3",
      type: "meeting",
      label: "Meeting planifié",
      detail: "Avec le contact principal",
      time: "il y a 3j",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="space-y-4">
        {activities.map((a) => (
          <div
            key={a.id}
            className="flex items-start gap-4 pb-4 border-b border-border last:border-0"
          >
            <div className="size-2 rounded-full bg-primary mt-2 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.detail}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesTab({ deal }: { deal: any }) {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([
    {
      id: "n1",
      text: "Premier échange positif. Le contact est ouvert à une démo.",
      time: "il y a 2 jours",
      author: "Utilisateur",
    },
  ]);

  const addNote = () => {
    if (!note.trim()) return;
    setNotes([
      { id: `n${Date.now()}`, text: note, time: "à l'instant", author: "Utilisateur" },
      ...notes,
    ]);
    setNote("");
    toast.success("Note ajoutée");
  };

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="space-y-4">
        <div className="flex gap-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ajouter une note sur cette opportunité..."
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
          />
          <button
            onClick={addNote}
            className="h-fit px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:brightness-110 transition-all"
          >
            Ajouter
          </button>
        </div>
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="p-4 rounded-lg bg-surface/40 border border-border">
              <p className="text-sm">{n.text}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{n.author}</span>
                <span>·</span>
                <span>{n.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmailsTab({ deal }: { deal: any }) {
  const emails = [
    {
      id: "e1",
      subject: "Proposition commerciale",
      preview: "Bonjour, suite à notre échange...",
      time: "il y a 1j",
      direction: "sent",
    },
    {
      id: "e2",
      subject: "Re: Proposition commerciale",
      preview: "Merci, je regarde et reviens vers vous.",
      time: "hier",
      direction: "received",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="space-y-3">
        {emails.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface/50 transition-colors"
          >
            <div
              className={`size-8 rounded-full grid place-items-center ${
                e.direction === "sent" ? "bg-primary/10 text-primary" : "bg-secondary"
              }`}
            >
              {e.direction === "sent" ? (
                <Send className="size-3.5" />
              ) : (
                <Mail className="size-3.5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{e.subject}</p>
              <p className="text-xs text-muted-foreground truncate">{e.preview}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{e.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
