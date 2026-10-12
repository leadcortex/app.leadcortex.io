//frontend\routes\app.people.$id.tsx
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui-primitives";
import { useAppStore } from "@/lib/store";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  Briefcase,
  CalendarDays,
  Star,
  Edit,
  Trash2,
  Send,
  PhoneCall,
  PhoneOff,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  Mic,
  Video,
  Coffee,
  Linkedin,
  Globe,
  Sparkles,
  Radio,
  TrendingUp,
  Tag as TagIcon,
  Clock,
  ChevronRight,
  CircleDot,
  ExternalLink,
  Copy,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DetailViewSkeleton } from "@/components/skeletons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CustomSelect } from "@/components/custom-select";
import { ActionMenu } from "@/components/action-menu";
import { EditRecordDialog } from "@/components/edit-record-dialog";
import { CompanyLogo } from "@/components/company-logo";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/people/$id")({
  head: () => ({ meta: [{ title: "Prospect — LeadCortex" }] }),
  pendingComponent: () => <DetailViewSkeleton />,
  component: PeopleDetailPage,
});

type ActivityItem = {
  id: string;
  type: "email" | "call" | "meeting" | "note" | "view" | "signal";
  label: string;
  detail: string;
  time: string;
};

type NoteItem = {
  id: string;
  text: string;
  time: string;
  author: string;
};

function PeopleDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { leads, toggleLeadSaved, addActivity, updateLead, deleteLead } = useAppStore();
  const [editOpen, setEditOpen] = useState(false);

  const lead = leads.find((l) => l.id === id);

  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "notes" | "emails">(
    "overview",
  );

  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: "a1",
      type: "email",
      label: "Email envoyé",
      detail: "Séquence de prospection — Étape 1/5",
      time: "il y a 2h",
    },
    {
      id: "a2",
      type: "view",
      label: "Profil visité",
      detail: "LinkedIn — consulté 3 fois",
      time: "il y a 1j",
    },
    {
      id: "a3",
      type: "signal",
      label: "Signal détecté",
      detail: "Levée de fonds — 2,5M€",
      time: "il y a 3j",
    },
  ]);
  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: "n1",
      text: "Premier contact — très réceptif. Intéressé par l'automatisation.",
      time: "il y a 2 jours",
      author: "Utilisateur",
    },
  ]);

  const [callOpen, setCallOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const pushActivity = (item: Omit<ActivityItem, "id" | "time">) => {
    setActivities((prev) => [{ id: `a${Date.now()}`, time: "à l'instant", ...item }, ...prev]);
  };

  const pushNote = (text: string) => {
    setNotes((prev) => [
      { id: `n${Date.now()}`, text, time: "à l'instant", author: "Vous" },
      ...prev,
    ]);
  };

  if (!lead) {
    return (
      <div className="p-4 md:p-8 text-center">
        <AlertCircle className="size-10 md:size-12 mx-auto text-muted-foreground mb-3 md:mb-4" />
        <h2 className="font-display text-xl md:text-2xl italic">Prospect introuvable</h2>
        <p className="text-muted-foreground text-xs md:text-sm mt-2">
          Ce prospect n'existe pas ou a été supprimé.
        </p>
        <Link
          to="/app/people"
          className="inline-flex items-center gap-2 mt-4 md:mt-6 text-xs md:text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5 md:size-4" /> Retour à la liste
        </Link>
      </div>
    );
  }

  const score = lead.score ?? 0;
  const scoreColor =
    score >= 9 ? "text-primary" : score >= 8 ? "text-amber-500" : "text-muted-foreground";

  return (
    <div className="max-w-6xl">
      <div className="sticky top-0 z-30 -mx-4 md:-mx-6 px-4 md:px-6 py-2.5 bg-background/85 backdrop-blur-xl border-b border-border mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <Link
            to="/app/people"
            className="rounded-lg p-1.5 hover:bg-surface transition-colors shrink-0"
            title="Retour"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <div className="hidden md:flex items-center gap-2 min-w-0">
            <span className="truncate font-medium text-sm">{lead.name}</span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="truncate text-xs text-muted-foreground">{lead.company}</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                addActivity("Email envoyé", `À ${lead.name} via séquence`);
                pushActivity({ type: "email", label: "Email envoyé", detail: `À ${lead.name}` });
                toast.success("Email préparé");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-2.5 md:px-3 py-1.5 text-[10px] md:text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <Send className="size-3.5" />
              <span className="hidden sm:inline">Email</span>
            </button>
            <button
              onClick={() => setCallOpen(true)}
              disabled={!lead.phone}
              title={!lead.phone ? "Aucun numéro renseigné" : "Appeler"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 md:px-3 py-1.5 text-[10px] md:text-xs hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <PhoneCall className="size-3.5" />
              <span className="hidden sm:inline">Appeler</span>
            </button>
            <button
              onClick={() => setScheduleOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-surface transition-colors"
            >
              <CalendarDays className="size-3.5" /> Planifier
            </button>

            <span className="w-px h-5 bg-border mx-1" />

            <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-border px-2 py-1">
              <span className={cn("font-mono text-xs font-semibold", scoreColor)}>
                {lead.score?.toFixed(1) ?? "—"}
              </span>
              <span className="text-[10px] text-muted-foreground">/10</span>
            </div>
            <button
              onClick={() => {
                toggleLeadSaved(lead.id);
                toast.success(lead.saved ? "Retiré des favoris" : "Ajouté aux favoris");
              }}
              className={cn(
                "rounded-lg border p-1.5 transition-colors",
                lead.saved
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-surface",
              )}
              title={lead.saved ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Star className={cn("size-3.5", lead.saved && "fill-primary")} />
            </button>
            <ActionMenu
              items={[
                { label: "Modifier la fiche", icon: Edit, onSelect: () => setEditOpen(true) },
                {
                  label: "Copier l'email",
                  icon: Copy,
                  onSelect: () => {
                    if (!lead.email) return toast.error("Aucun email renseigné");
                    navigator.clipboard?.writeText(lead.email);
                    toast.success("Email copié");
                  },
                },
                {
                  label: "Supprimer le prospect",
                  icon: Trash2,
                  tone: "danger",
                  separatorBefore: true,
                  onSelect: () => {
                    if (!confirm(`Supprimer ${lead.name} ?`)) return;
                    deleteLead(lead.id);
                    addActivity("Prospect supprimé", lead.name);
                    toast.success("Prospect supprimé");
                    navigate({ to: "/app/people" });
                  },
                },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4 md:gap-6">
        <div className="min-w-0 space-y-4 md:space-y-5">
          <div className="rounded-2xl border border-border bg-background p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <LetterAvatar name={lead.name} size={80} shape="circle" />
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-2xl md:text-4xl italic break-words">
                  {lead.name}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mt-0.5 md:mt-1">
                  {lead.title}
                </p>
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2 text-xs md:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CompanyLogo name={lead.company} size={16} className="shrink-0" />
                    {lead.company}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {lead.location}
                  </span>
                  <span className="hidden md:flex items-center gap-1.5">
                    <Briefcase className="size-3.5" /> {lead.industry}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-3">
                  <Badge tone={lead.stage === "won" ? "success" : "primary"}>
                    {lead.stage || "Nouveau"}
                  </Badge>
                  {lead.signal && <Badge tone="warning">{lead.signal}</Badge>}
                  {lead.email && (
                    <Badge tone="muted">
                      <Mail className="size-2.5 md:size-3 mr-1" /> Email vérifié
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4 md:p-5">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground inline-flex items-center gap-1.5">
                <TrendingUp className="size-3.5" /> Score ICP
              </h3>
              <span className={cn("font-display text-2xl md:text-3xl", scoreColor)}>
                {lead.score?.toFixed(1) ?? "—"}
                <span className="text-sm text-muted-foreground ml-1">/10</span>
              </span>
            </div>

            <div className="h-2 rounded-full bg-secondary overflow-hidden mb-4">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  score >= 9 ? "bg-primary" : score >= 7 ? "bg-amber-500" : "bg-muted-foreground",
                )}
                style={{ width: `${Math.min(100, score * 10)}%` }}
              />
            </div>

            <div className="space-y-2 text-xs md:text-sm">
              <BreakdownRow label="Correspondance secteur" ok value={2.0} />
              <BreakdownRow label="Taille entreprise cible" ok value={2.0} />
              <BreakdownRow label="Poste décisionnaire" ok value={score > 8 ? 2.5 : 2.0} />
              <BreakdownRow label="Signal d'achat récent" ok={!!lead.signal} value={1.5} />
              <BreakdownRow label="Localisation hors zone cible" ok={false} value={-0.3} />
            </div>
          </div>

          {lead.signal && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5">
              <div className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-primary">
                <Radio className="size-3.5" /> Signal d'intention
              </div>
              <p className="mt-2 text-sm md:text-base font-medium text-primary">{lead.signal}</p>
              <p className="mt-1 text-[10px] md:text-xs text-primary/70">
                Détecté récemment — priorité de contact recommandée.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-background p-4 md:p-5">
            <div className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              <Sparkles className="size-3.5 text-primary" /> Angle d'approche suggéré
            </div>
            <p className="text-xs md:text-sm leading-relaxed">
              {score >= 9
                ? `${lead.name} présente un profil à très fort potentiel. Angle recommandé : approche directe et personnalisée, mentionner ${lead.signal ?? "les signaux récents"} dès l'objet du premier email. Proposer un créneau de 20 min dans la semaine.`
                : score >= 7
                  ? `${lead.name} correspond bien à votre ICP. Angle recommandé : entrer par la valeur métier de ${lead.company}, mentionner un cas client similaire. Séquence douce en 3 étapes.`
                  : `Profil à qualifier. Commencer par un contenu de valeur (article, benchmark) avant toute demande. Surveiller l'évolution des signaux.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                onClick={() => toast.success("Email généré par l'IA")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-2.5 py-1 text-[10px] md:text-xs hover:bg-primary/15 transition-colors"
              >
                <Sparkles className="size-3" /> Générer l'email
              </button>
              <button
                onClick={() => toast.success("Appel scripté par l'IA")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[10px] md:text-xs hover:bg-surface transition-colors"
              >
                <Mic className="size-3" /> Script d'appel
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background overflow-hidden">
            <div className="border-b border-border px-3 md:px-4 overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 md:gap-5 min-w-max">
                {(["overview", "activity", "notes", "emails"] as const).map((tab) => {
                  const labels = {
                    overview: "Aperçu",
                    activity: "Activité",
                    notes: "Notes",
                    emails: "Emails",
                  };
                  const counts: Record<string, number | null> = {
                    overview: null,
                    activity: activities.length,
                    notes: notes.length,
                    emails: null,
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "py-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap inline-flex items-center gap-1.5",
                        activeTab === tab
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {labels[tab]}
                      {counts[tab] != null && (
                        <span
                          className={cn(
                            "text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-full",
                            activeTab === tab
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {counts[tab]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 md:p-5">
              {activeTab === "overview" && <OverviewTab lead={lead} />}
              {activeTab === "activity" && <ActivityTab activities={activities} />}
              {activeTab === "notes" && (
                <NotesTab notes={notes} onAddNote={(text) => pushNote(text)} />
              )}
              {activeTab === "emails" && <EmailsTab lead={lead} />}
            </div>
          </div>
        </div>

        <aside className="space-y-3 md:space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              <Building2 className="size-3.5" /> Entreprise
            </div>
            <div className="flex items-center gap-2.5">
              <CompanyLogo name={lead.company} size={36} rounded="lg" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{lead.company}</p>
                <p className="text-[10px] text-muted-foreground truncate">{lead.industry}</p>
              </div>
            </div>
            <Link
              to="/app/companies"
              className="mt-3 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              Voir la fiche entreprise <ChevronRight className="size-3" />
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              <Phone className="size-3.5" /> Coordonnées
            </div>
            <div className="space-y-2.5">
              {lead.email && (
                <div className="flex items-center gap-2 group">
                  <Mail className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[11px] font-mono truncate flex-1">{lead.email}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(lead.email!);
                      toast.success("Email copié");
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 hover:bg-surface"
                  >
                    <Copy className="size-3 text-muted-foreground" />
                  </button>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[11px] font-mono truncate">{lead.phone}</span>
                </div>
              )}
              <a
                href={`https://www.linkedin.com/in/${lead.name.toLowerCase().replace(/\s+/g, "-")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[11px] text-primary hover:underline"
              >
                <Linkedin className="size-3.5 shrink-0" />
                <span className="truncate">Profil LinkedIn</span>
                <ExternalLink className="size-3 ml-auto shrink-0" />
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              <TagIcon className="size-3.5" /> Tags
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="muted">Prioritaire</Badge>
              <Badge tone="muted">Salon 2026</Badge>
              <button className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                + Ajouter
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              <Clock className="size-3.5" /> Prochaines actions
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <CircleDot className="size-3 text-primary mt-0.5 shrink-0" />
                <span>Relancer par email vendredi</span>
              </div>
              <div className="flex items-start gap-2">
                <CircleDot className="size-3 text-muted-foreground mt-0.5 shrink-0" />
                <span>Envoyer le case study R&D</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <EditRecordDialog
        open={editOpen}
        title="Modifier le prospect"
        description="Mettez à jour les informations de contact et de qualification."
        onClose={() => setEditOpen(false)}
        values={{
          name: lead.name,
          title: lead.title,
          company: lead.company,
          email: lead.email ?? "",
          phone: lead.phone ?? "",
          industry: lead.industry,
          location: lead.location,
          stage: lead.stage ?? "new",
        }}
        fields={[
          { key: "name", label: "Nom complet", required: true },
          { key: "title", label: "Poste" },
          { key: "company", label: "Entreprise" },
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Téléphone" },
          { key: "industry", label: "Secteur" },
          { key: "location", label: "Localisation" },
          {
            key: "stage",
            label: "Étape",
            type: "select",
            options: [
              { value: "new", label: "Nouveau" },
              { value: "contacted", label: "Contacté" },
              { value: "qualified", label: "Qualifié" },
              { value: "won", label: "Gagné" },
              { value: "lost", label: "Perdu" },
            ],
          },
        ]}
        onSave={(values) => {
          updateLead(lead.id, values as any);
          addActivity("Prospect modifié", String(values.name));
          toast.success("Prospect mis à jour");
          setEditOpen(false);
        }}
      />

      <CallDialog
        open={callOpen}
        onOpenChange={setCallOpen}
        lead={lead}
        onCompleted={(duration) => {
          addActivity("Appel effectué", `À ${lead.name} — ${duration}`);
          pushActivity({ type: "call", label: "Appel effectué", detail: `Durée : ${duration}` });
        }}
      />
      <ScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        lead={lead}
        onScheduled={(summary) => {
          addActivity("Meeting planifié", `Avec ${lead.name} — ${summary}`);
          pushActivity({ type: "meeting", label: "Meeting planifié", detail: summary });
        }}
      />
      <NoteQuickDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        lead={lead}
        onSaved={(text) => {
          addActivity("Note ajoutée", `Pour ${lead.name}`);
          pushNote(text);
        }}
      />
    </div>
  );
}

function BreakdownRow({ label, ok, value }: { label: string; ok: boolean; value: number }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="size-3.5 text-primary shrink-0" />
      ) : (
        <AlertCircle className="size-3.5 text-amber-500 shrink-0" />
      )}
      <span className="flex-1 text-muted-foreground truncate">{label}</span>
      <span
        className={cn("font-mono text-xs shrink-0", value > 0 ? "text-primary" : "text-amber-600")}
      >
        {value > 0 ? "+" : ""}
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function OverviewTab({ lead }: { lead: any }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-xl border border-border bg-surface/30 p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
          Coordonnées
        </h3>
        <div className="space-y-2">
          {lead.email && (
            <div className="flex items-center gap-2 text-xs">
              <Mail className="size-3.5 text-muted-foreground shrink-0" />
              <span className="font-mono truncate">{lead.email}</span>
              <Badge tone="success">Vérifié</Badge>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2 text-xs">
              <Phone className="size-3.5 text-muted-foreground shrink-0" />
              <span className="font-mono">{lead.phone}</span>
            </div>
          )}
          {!lead.email && !lead.phone && (
            <p className="text-xs text-muted-foreground">Aucune coordonnée disponible.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface/30 p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
          Entreprise
        </h3>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nom</span>
            <span className="font-medium">{lead.company}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Industrie</span>
            <span>{lead.industry}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Localisation</span>
            <span>{lead.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const activityIcon: Record<ActivityItem["type"], any> = {
  email: Send,
  call: PhoneCall,
  meeting: CalendarDays,
  note: FileText,
  view: Users,
  signal: Radio,
};

function ActivityTab({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <p className="text-xs md:text-sm text-muted-foreground text-center py-6">
        Aucune activité pour l'instant.
      </p>
    );
  }
  return (
    <div className="space-y-3 md:space-y-4">
      {activities.map((a) => {
        const Icon = activityIcon[a.type] ?? CircleDot;
        return (
          <div
            key={a.id}
            className="flex items-start gap-3 pb-3 md:pb-4 border-b border-border last:border-0 last:pb-0"
          >
            <div className="size-7 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0 mt-0.5">
              <Icon className="size-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium">{a.label}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">{a.detail}</p>
              <p className="text-[9px] md:text-[10px] text-muted-foreground/60 mt-0.5">{a.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NotesTab({ notes, onAddNote }: { notes: NoteItem[]; onAddNote: (text: string) => void }) {
  const [note, setNote] = useState("");
  const addNote = () => {
    if (!note.trim()) return;
    onAddNote(note.trim());
    setNote("");
    toast.success("Note ajoutée");
  };
  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ajouter une note sur ce prospect..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]"
        />
        <button
          onClick={addNote}
          className="h-fit px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs md:text-sm hover:brightness-110 transition-all shrink-0"
        >
          Ajouter
        </button>
      </div>
      <div className="space-y-2">
        {notes.map((n) => (
          <div key={n.id} className="p-3 rounded-lg bg-surface/40 border border-border">
            <p className="text-xs md:text-sm">{n.text}</p>
            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{n.author}</span>
              <span>·</span>
              <span>{n.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmailsTab({ lead }: { lead: any }) {
  const emails = [
    {
      id: "e1",
      subject: "Proposition d'automatisation",
      preview: "Bonjour, je vous propose…",
      time: "il y a 2h",
      direction: "sent",
    },
    {
      id: "e2",
      subject: "Re: Proposition d'automatisation",
      preview: "Merci pour votre message…",
      time: "il y a 1h",
      direction: "received",
    },
  ];
  return (
    <div className="space-y-2">
      {emails.map((e) => (
        <div
          key={e.id}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface/50 transition-colors cursor-pointer"
        >
          <div
            className={cn(
              "size-8 rounded-full grid place-items-center shrink-0",
              e.direction === "sent" ? "bg-primary/10 text-primary" : "bg-secondary",
            )}
          >
            {e.direction === "sent" ? <Send className="size-3.5" /> : <Mail className="size-3.5" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-medium truncate">{e.subject}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">{e.preview}</p>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">{e.time}</span>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dialogs                                                                   */
/* -------------------------------------------------------------------------- */

type CallDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: any;
  onCompleted: (duration: string) => void;
};

function CallDialog({ open, onOpenChange, lead, onCompleted }: CallDialogProps) {
  const [status, setStatus] = useState<"dialing" | "connected" | "ended">("dialing");
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) return;
    setStatus("dialing");
    setSeconds(0);
    const t = setTimeout(() => setStatus("connected"), 1600);
    return () => {
      clearTimeout(t);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open]);

  useEffect(() => {
    if (status === "connected")
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const endCall = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus("ended");
    onCompleted(fmt(seconds) || "0:00");
    toast.success(`Appel terminé — ${fmt(seconds)}`);
    setTimeout(() => onOpenChange(false), 600);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (status !== "connected" || !v) && onOpenChange(v)}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center">
          <div className="mb-2 flex justify-center">
            <LetterAvatar name={lead.name} size={64} shape="circle" />
          </div>
          <DialogTitle className="font-display text-xl italic">{lead.name}</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {lead.phone || "Aucun numéro"}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {status === "dialing" && (
            <div className="flex flex-col items-center gap-2">
              <span className="relative flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full size-3 bg-primary" />
              </span>
              <p className="text-sm text-muted-foreground">Appel en cours…</p>
            </div>
          )}
          {status === "connected" && (
            <div className="flex flex-col items-center gap-1.5">
              <Badge tone="success">Connecté</Badge>
              <p className="font-mono text-2xl tabular-nums mt-1">{fmt(seconds)}</p>
            </div>
          )}
          {status === "ended" && (
            <div className="flex flex-col items-center gap-1.5">
              <Badge tone="muted">Terminé</Badge>
              <p className="font-mono text-2xl tabular-nums mt-1">{fmt(seconds)}</p>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-center">
          <button
            onClick={endCall}
            disabled={status === "ended"}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-destructive text-white text-sm font-medium hover:brightness-110 disabled:opacity-50"
          >
            <PhoneOff className="size-4" /> Raccrocher
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const meetingTypes = [
  { value: "call", label: "Appel découverte", icon: Phone },
  { value: "video", label: "Visioconférence", icon: Video },
  { value: "coffee", label: "Rendez-vous informel", icon: Coffee },
];

function ScheduleDialog({
  open,
  onOpenChange,
  lead,
  onScheduled,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: any;
  onScheduled: (summary: string) => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("call");
  const [duration, setDuration] = useState("30");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return toast.error("Choisissez une date et une heure");
    setIsSubmitting(true);
    setTimeout(() => {
      const typeLabel = meetingTypes.find((t) => t.value === type)?.label ?? "Rendez-vous";
      const summary = `${typeLabel} · ${new Date(`${date}T${time}`).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} à ${time} · ${duration} min`;
      onScheduled(summary);
      toast.success("Meeting planifié", { description: summary });
      setIsSubmitting(false);
      onOpenChange(false);
      setDate("");
      setTime("");
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl italic">
            Planifier un rendez-vous
          </DialogTitle>
          <DialogDescription>
            Avec {lead.name} — {lead.company}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Heure</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Type</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {meetingTypes.map((t) => {
                const Icon = t.icon;
                const sel = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2.5 rounded-lg border text-[10px] transition-colors",
                      sel
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-surface text-muted-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Durée</label>
            <div className="mt-1">
              <CustomSelect
                label=""
                value={duration}
                onChange={setDuration}
                options={["15", "30", "45", "60"]}
                title="Durée"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              <CalendarDays className="size-3.5" /> Confirmer
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NoteQuickDialog({
  open,
  onOpenChange,
  lead,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: any;
  onSaved: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSaved(text.trim());
    toast.success("Note ajoutée");
    setText("");
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl italic">Ajouter une note</DialogTitle>
          <DialogDescription>
            Pour {lead.name} — {lead.company}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Contexte, prochaine étape, points d'attention..."
            rows={4}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              <FileText className="size-3.5" /> Enregistrer
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
