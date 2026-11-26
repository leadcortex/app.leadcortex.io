// frontend/routes/app/people/$id.tsx

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/common/ui-primitives";
import { useAppStore } from "@/lib/state/store";
import type { Email } from "@/lib/data/mock-data";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  Copy,
  Edit,
  ExternalLink,
  FileText,
  Gauge,
  Linkedin,
  Mail,
  MapPin,
  Mic,
  Phone,
  PhoneCall,
  Pencil,
  Plus,
  Radio,
  Save,
  Send,
  Sparkles,
  Star,
  Tag as TagIcon,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "@/components/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DetailViewSkeleton } from "@/components/skeletons";
import { ActionMenu } from "@/components/common/action-menu";
import { CompanyLogo } from "@/components/company-logo";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { ProgressCapsule } from "@/components/ui/capsule-progress";
import { ScoreStepper } from "@/components/ui/score-stepper";
import { ImageCropperDialog } from "@/components/ui/image-cropper-dialog";
import { SearchSelect } from "@/components/common/search-select";
import { useContextMenu } from "@/hooks/use-context-menu";
import { ContextMenu, type ContextMenuSection } from "@/components/common/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { EditPeopleDialog } from "@/components/people/edit-people-dialog";
import { CallDialog } from "@/components/people/call-dialog";
import { ScheduleDialog } from "@/components/people/schedule-dialog";
import { stageLabels } from "@/lib/people/helpers";
import { cn } from "@/lib/core/utils";

export const Route = createFileRoute("/app/people/$id")({
  head: () => ({ meta: [{ title: "Prospect · LeadCortex" }] }),
  pendingComponent: () => <DetailViewSkeleton />,
  component: PeopleDetailPage,
});

type CtxPayload =
  | { type: "hero" }
  | { type: "avatar" }
  | { type: "logo" }
  | { type: "email" }
  | { type: "phone" }
  | { type: "signal" }
  | { type: "stage" }
  | { type: "linkedin" }
  | { type: "company" }
  | { type: "tag"; tag: string }
  | { type: "task"; taskId: string }
  | { type: "notes" };

function PeopleDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const store = useAppStore();
  const {
    leads,
    tasks,
    emails,
    activity,
    toggleLeadSaved,
    addActivity,
    updateLead,
    deleteLead,
    deleteTask,
    toggleTask,
  } = store;

  const lead = useMemo(() => leads.find((l) => l.id === id), [leads, id]);

  const [editOpen, setEditOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [scoreEditOpen, setScoreEditOpen] = useState(false);
  const [notesEditOpen, setNotesEditOpen] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [avatarCropOpen, setAvatarCropOpen] = useState(false);
  const [avatarCropSrc, setAvatarCropSrc] = useState("");
  const [logoCropOpen, setLogoCropOpen] = useState(false);
  const [logoCropSrc, setLogoCropSrc] = useState("");

  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "notes" | "emails">(
    "overview",
  );

  const ctx = useContextMenu<CtxPayload>({});

  const leadTasks = useMemo(
    () => (lead ? tasks.filter((t) => t.contact === lead.name) : []),
    [tasks, lead],
  );
  const openTasks = leadTasks.filter((t) => !t.done);

  const leadEmails = useMemo(() => {
    if (!lead) return [];
    const name = lead.name.toLowerCase();
    const email = (lead.email ?? "").toLowerCase();
    return emails.filter((e) => {
      const from = e.from.toLowerCase();
      const to = (e.to ?? []).map((t) => t.toLowerCase());
      return (
        from.includes(email) ||
        from.includes(name) ||
        to.some((t) => t.includes(email) || t.includes(name))
      );
    });
  }, [emails, lead]);

  const leadActivity = useMemo(() => {
    if (!lead) return [];
    return activity.filter(
      (a) =>
        a.detail.toLowerCase().includes(lead.name.toLowerCase()) ||
        a.label.toLowerCase().includes(lead.name.toLowerCase()),
    );
  }, [activity, lead]);

  const openAvatarCropper = () => {
    if (lead?.avatarUrl) {
      setAvatarCropSrc(lead.avatarUrl);
      setAvatarCropOpen(true);
    } else {
      avatarInputRef.current?.click();
    }
  };

  const openLogoCropper = () => {
    if (lead?.companyLogoUrl) {
      setLogoCropSrc(lead.companyLogoUrl);
      setLogoCropOpen(true);
    } else {
      logoInputRef.current?.click();
    }
  };

  const copyText = (value: string, label: string) => {
    navigator.clipboard?.writeText(value);
    toast.success(`${label} copié`);
  };

  const addTag = (tag: string) => {
    if (!lead) return;
    const clean = tag.trim();
    if (!clean) return;
    const current = lead.tags ?? [];
    if (current.includes(clean)) {
      toast.info("Ce tag existe déjà");
      return;
    }
    updateLead(lead.id, { tags: [...current, clean] });
    addActivity("Tag ajouté", `${lead.name} · ${clean}`);
    toast.success(`Tag « ${clean} » ajouté`);
  };

  const removeTag = (tag: string) => {
    if (!lead) return;
    const current = lead.tags ?? [];
    updateLead(lead.id, { tags: current.filter((t) => t !== tag) });
    addActivity("Tag retiré", `${lead.name} · ${tag}`);
    toast.success(`Tag « ${tag} » retiré`);
  };

  const updateSignal = (signal: string) => {
    if (!lead) return;
    updateLead(lead.id, { signal: signal || undefined });
    addActivity("Signal mis à jour", `${lead.name} · ${signal || "aucun"}`);
    toast.success(signal ? "Signal mis à jour" : "Signal retiré");
  };

  const saveNotes = (notes: string) => {
    if (!lead) return;
    updateLead(lead.id, { notes });
    addActivity("Notes mises à jour", lead.name);
    toast.success("Notes enregistrées");
  };

  const updateScore = (score: string) => {
    if (!lead) return;
    const value = score === "" ? null : Number(score);
    updateLead(lead.id, { score: value });
    addActivity("Score mis à jour", `${lead.name} · ${value ?? "aucun"}`);
  };

  const handleSendEmail = (subject: string, body: string) => {
    if (!lead) return;
    if (!lead.email) {
      toast.error("Aucun email renseigné pour ce prospect");
      return;
    }
    const email: Email = {
      id: `e-${Date.now()}`,
      threadId: `t-${Date.now()}`,
      accountId: "acc-1",
      from: "Utilisateur <utilisateur@leadcortex.io>",
      to: [lead.email],
      subject,
      preview: body.slice(0, 140),
      body,
      time: "à l'instant",
      date: new Date().toISOString(),
      unread: false,
      status: "sent",
      folder: "sent",
    };
    store.sendEmail(email);
    addActivity("Email envoyé", `À ${lead.name} · ${subject}`);
    toast.success("Email envoyé");
    setComposeOpen(false);
  };

  if (!lead) {
    return (
      <div className="mx-auto w-full max-w-[1400px] p-4 md:p-8 text-center">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 md:p-8">
          <AlertCircle className="size-10 md:size-12 mx-auto text-muted-foreground mb-3 md:mb-4" />
          <h2 className="text-xl font-semibold">Prospect introuvable</h2>
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
      </div>
    );
  }

  const score = lead.score ?? 0;
  const scoreColor =
    score >= 9 ? "text-primary" : score >= 8 ? "text-amber-500" : "text-muted-foreground";
  const scoreTone = score >= 9 ? "success" : score >= 7 ? "primary" : "warning";

  const contextSections: ContextMenuSection[] = ctx.state
    ? (() => {
        const p = ctx.state!.payload;
        const sections: ContextMenuSection[] = [];
        if (p.type === "hero") {
          sections.push({
            id: "hero",
            items: [
              {
                id: "edit-hero",
                label: "Modifier la fiche",
                icon: Edit,
                onSelect: () => setEditOpen(true),
              },
              {
                id: "copy-name",
                label: "Copier le nom",
                icon: Copy,
                onSelect: () => copyText(lead.name, "Nom"),
              },
              {
                id: "copy-email",
                label: "Copier l'email",
                icon: Copy,
                onSelect: () => {
                  if (!lead.email) return toast.error("Aucun email");
                  copyText(lead.email, "Email");
                },
                disabled: !lead.email,
              },
              {
                id: "delete-hero",
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
            ],
          });
        } else if (p.type === "stage") {
          const stageOptions = [
            { value: "new", label: "Nouveau" },
            { value: "contacted", label: "Contacté" },
            { value: "replied", label: "Répondu" },
            { value: "meeting", label: "Rendez-vous" },
            { value: "won", label: "Gagné" },
            { value: "lost", label: "Perdu" },
          ] as const;
          sections.push({
            id: "stage",
            label: "Changer l'étape",
            items: stageOptions.map((st) => ({
              id: `stage-${st.value}`,
              label: st.label,
              icon: lead.stage === st.value ? CheckCircle2 : CircleDot,
              onSelect: () => {
                updateLead(lead.id, { stage: st.value });
                addActivity("Étape changée", `${lead.name} → ${st.label}`);
                toast.success(`Étape : ${st.label}`);
              },
            })),
          });
        } else if (p.type === "linkedin") {
          const url = `https://www.linkedin.com/in/${lead.name.toLowerCase().replace(/\s+/g, "-")}`;
          sections.push({
            id: "linkedin",
            items: [
              {
                id: "open-linkedin",
                label: "Ouvrir le profil",
                icon: ExternalLink,
                onSelect: () => window.open(url, "_blank", "noopener"),
              },
              {
                id: "copy-linkedin",
                label: "Copier le lien",
                icon: Copy,
                onSelect: () => copyText(url, "Lien LinkedIn"),
              },
            ],
          });
        } else if (p.type === "company") {
          sections.push({
            id: "company",
            items: [
              {
                id: "copy-company",
                label: "Copier le nom",
                icon: Copy,
                onSelect: () => copyText(lead.company, "Nom"),
              },
              {
                id: "open-companies",
                label: "Voir les entreprises",
                icon: Building2,
                onSelect: () => navigate({ to: "/app/companies" }),
              },
            ],
          });
        } else if (p.type === "avatar") {
          sections.push({
            id: "avatar",
            items: [
              {
                id: "change-avatar",
                label: lead.avatarUrl ? "Changer la photo" : "Ajouter une photo",
                icon: Edit,
                onSelect: openAvatarCropper,
              },
              ...(lead.avatarUrl
                ? [
                    {
                      id: "remove-avatar",
                      label: "Supprimer la photo",
                      icon: Trash2,
                      tone: "danger" as const,
                      onSelect: () => {
                        updateLead(lead.id, { avatarUrl: undefined });
                        toast.success("Photo supprimée");
                      },
                    },
                  ]
                : []),
            ],
          });
        } else if (p.type === "logo") {
          sections.push({
            id: "logo",
            items: [
              {
                id: "change-logo",
                label: lead.companyLogoUrl ? "Changer le logo" : "Ajouter un logo",
                icon: Edit,
                onSelect: openLogoCropper,
              },
              ...(lead.companyLogoUrl
                ? [
                    {
                      id: "remove-logo",
                      label: "Supprimer le logo",
                      icon: Trash2,
                      tone: "danger" as const,
                      onSelect: () => {
                        updateLead(lead.id, { companyLogoUrl: undefined });
                        toast.success("Logo supprimé");
                      },
                    },
                  ]
                : []),
            ],
          });
        } else if (p.type === "email" && lead.email) {
          sections.push({
            id: "email",
            items: [
              {
                id: "copy-email",
                label: "Copier l'email",
                icon: Copy,
                onSelect: () => copyText(lead.email!, "Email"),
              },
              {
                id: "send-email",
                label: "Envoyer un email",
                icon: Send,
                onSelect: () => setComposeOpen(true),
              },
            ],
          });
        } else if (p.type === "phone" && lead.phone) {
          sections.push({
            id: "phone",
            items: [
              {
                id: "copy-phone",
                label: "Copier le téléphone",
                icon: Copy,
                onSelect: () => copyText(lead.phone!, "Téléphone"),
              },
              {
                id: "call",
                label: "Appeler",
                icon: PhoneCall,
                onSelect: () => setCallOpen(true),
              },
            ],
          });
        } else if (p.type === "signal") {
          sections.push({
            id: "signal",
            items: [
              {
                id: "change-signal",
                label: "Modifier le signal",
                icon: Edit,
                onSelect: () => {
                  const next = window.prompt(
                    "Nouveau signal (laisser vide pour supprimer)",
                    lead.signal ?? "",
                  );
                  if (next !== null) updateSignal(next.trim());
                },
              },
              {
                id: "remove-signal",
                label: "Supprimer le signal",
                icon: Trash2,
                tone: "danger",
                onSelect: () => updateSignal(""),
              },
            ],
          });
        } else if (p.type === "tag") {
          sections.push({
            id: "tag",
            items: [
              {
                id: "copy-tag",
                label: `Copier « ${p.tag} »`,
                icon: Copy,
                onSelect: () => copyText(p.tag, "Tag"),
              },
              {
                id: "remove-tag",
                label: "Supprimer le tag",
                icon: Trash2,
                tone: "danger",
                onSelect: () => removeTag(p.tag),
              },
            ],
          });
        } else if (p.type === "task") {
          const task = tasks.find((t) => t.id === p.taskId);
          if (task) {
            sections.push({
              id: "task",
              items: [
                {
                  id: "toggle-task",
                  label: task.done ? "Marquer à faire" : "Marquer terminée",
                  icon: task.done ? CircleDot : CheckCircle2,
                  onSelect: () => toggleTask(task.id),
                },
                {
                  id: "delete-task",
                  label: "Supprimer la tâche",
                  icon: Trash2,
                  tone: "danger",
                  separatorBefore: true,
                  onSelect: () => {
                    deleteTask(task.id);
                    toast.success("Tâche supprimée");
                  },
                },
              ],
            });
          }
        } else if (p.type === "notes") {
          sections.push({
            id: "notes",
            items: [
              {
                id: "edit-notes",
                label: "Modifier les notes",
                icon: Edit,
                onSelect: () => setNotesEditOpen(true),
              },
              ...(lead.notes
                ? [
                    {
                      id: "delete-notes",
                      label: "Supprimer les notes",
                      icon: Trash2,
                      tone: "danger" as const,
                      onSelect: () => saveNotes(""),
                    },
                  ]
                : []),
            ],
          });
        }

        return sections;
      })()
    : [];

  return (
    <>
      <div className="sticky top-0 z-30 -mx-4 md:-mx-8 px-4 md:px-8 py-2 bg-background/90 backdrop-blur-xl border-b border-border mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <Link
            to="/app/people"
            className="rounded-lg border border-border bg-background p-1.5 hover:bg-surface transition-colors shrink-0"
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
              onClick={() => setComposeOpen(true)}
              disabled={!lead.email}
              title={!lead.email ? "Aucun email renseigné" : "Envoyer un email"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-2.5 md:px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="size-3.5" />
              <span className="hidden sm:inline">Email</span>
            </button>
            <button
              onClick={() => setCallOpen(true)}
              disabled={!lead.phone}
              title={!lead.phone ? "Aucun numéro renseigné" : "Appeler"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 md:px-3 py-1.5 text-xs hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <PhoneCall className="size-3.5" />
              <span className="hidden sm:inline">Appeler</span>
            </button>
            <button
              onClick={() => setScheduleOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 md:px-3 py-1.5 text-xs hover:bg-surface transition-colors"
            >
              <CalendarDays className="size-3.5" />
              <span className="hidden sm:inline">Planifier</span>
            </button>

            <span className="w-px h-5 bg-border mx-1" />

            <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1">
              <span className={cn("font-mono text-xs font-semibold tabular-nums", scoreColor)}>
                {lead.score?.toFixed(1) ?? "-"}
              </span>
              <span className="text-xs text-muted-foreground">/10</span>
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
                  : "border-border bg-background hover:bg-surface",
              )}
              title={lead.saved ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Star className={cn("size-3.5", lead.saved && "fill-primary")} />
            </button>
            <ActionMenu
              items={[
                { label: "Modifier la fiche", icon: Edit, onSelect: () => setEditOpen(true) },
                {
                  label: "Envoyer un email",
                  icon: Send,
                  onSelect: () => setComposeOpen(true),
                },
                {
                  label: "Copier l'email",
                  icon: Copy,
                  onSelect: () => {
                    if (!lead.email) return toast.error("Aucun email renseigné");
                    copyText(lead.email, "Email");
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

      <div className="mx-auto w-full max-w-[1400px] pb-10">
        <section
          className="section-atelier p-4 md:p-6 mb-4 md:mb-6"
          onContextMenu={ctx.bind({ type: "hero" }).onContextMenu}
        >
          <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
            <button
              type="button"
              onClick={openAvatarCropper}
              onContextMenu={ctx.bind({ type: "avatar" }).onContextMenu}
              aria-label="Changer la photo du prospect"
              title="Cliquer pour changer · Clic droit pour plus d'options"
              className="group/avatar relative shrink-0 rounded-full transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {lead.avatarUrl ? (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "9999px",
                    overflow: "hidden",
                    boxShadow:
                      "0 0 0 2px color-mix(in oklab, var(--primary) 20%, transparent), 0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  <img
                    src={lead.avatarUrl}
                    alt={lead.name}
                    draggable={false}
                    style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ) : (
                <LetterAvatar name={lead.name} size={96} shape="circle" />
              )}
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border border-border bg-background opacity-0 transition-opacity group-hover/avatar:opacity-100"
              >
                <Edit className="size-3.5" />
              </span>
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl md:text-4xl italic break-words">{lead.name}</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-0.5 md:mt-1">
                {lead.title}
              </p>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2 md:mt-3 text-xs md:text-sm text-muted-foreground">
                <span
                  className="flex items-center gap-1.5 cursor-context-menu"
                  onContextMenu={ctx.bind({ type: "company" }).onContextMenu}
                >
                  {lead.companyLogoUrl ? (
                    <div
                      className="shrink-0"
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        overflow: "hidden",
                        backgroundColor: "var(--background)",
                      }}
                    >
                      <img
                        src={lead.companyLogoUrl}
                        alt=""
                        draggable={false}
                        style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  ) : (
                    <CompanyLogo name={lead.company} size={16} className="shrink-0" />
                  )}
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
                <span
                  className="inline-flex cursor-context-menu"
                  onContextMenu={ctx.bind({ type: "stage" }).onContextMenu}
                  title="Clic droit pour changer l'étape"
                >
                  <Badge tone={lead.stage === "won" ? "success" : "primary"}>
                    {stageLabels[lead.stage ?? "new"] ?? lead.stage ?? "Nouveau"}
                  </Badge>
                </span>
                {lead.signal && (
                  <button
                    onClick={() => {
                      const next = window.prompt(
                        "Modifier le signal (vide pour supprimer)",
                        lead.signal ?? "",
                      );
                      if (next !== null) updateSignal(next.trim());
                    }}
                    onContextMenu={ctx.bind({ type: "signal" }).onContextMenu}
                    className="inline-flex items-center gap-1 rounded-full bg-warning/14 px-2 py-0.5 text-xs font-medium text-warning hover:bg-warning/20 transition-colors"
                  >
                    <Radio className="size-2.5" />
                    {lead.signal}
                  </button>
                )}
                {lead.email && (
                  <Badge tone="muted">
                    <Mail className="size-2.5 md:size-3 mr-1" /> Email vérifié
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-4 md:gap-6 items-start">
          <div className="space-y-4 md:space-y-5 min-w-0">
            <section className="section-atelier p-4 md:p-5">
              <div className="section-atelier__head">
                <div className="flex items-center gap-2 min-w-0">
                  <TrendingUp className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="section-atelier__title min-w-0 text-sm md:text-base leading-tight">
                    Score ICP
                  </h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("text-2xl font-semibold tabular-nums", scoreColor)}>
                    {lead.score?.toFixed(1) ?? "-"}
                  </span>
                  <span className="text-xs md:text-sm text-muted-foreground">/10</span>
                  <button
                    onClick={() => setScoreEditOpen(true)}
                    className="ml-1 rounded-md p-1 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
                    title="Modifier le score"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <ProgressCapsule
                  value={Math.min(10, score)}
                  max={10}
                  size="md"
                  tone={scoreTone as "success" | "primary" | "warning"}
                />
              </div>

              <ul className="space-y-1.5">
                <li className="list-item-atelier p-2.5">
                  <BreakdownRow label="Correspondance secteur" ok value={2.0} />
                </li>
                <li className="list-item-atelier p-2.5">
                  <BreakdownRow label="Taille entreprise cible" ok value={2.0} />
                </li>
                <li className="list-item-atelier p-2.5">
                  <BreakdownRow label="Poste décisionnaire" ok value={score > 8 ? 2.5 : 2.0} />
                </li>
                <li className="list-item-atelier p-2.5">
                  <BreakdownRow label="Signal d'achat récent" ok={!!lead.signal} value={1.5} />
                </li>
                <li className="list-item-atelier p-2.5">
                  <BreakdownRow label="Localisation hors zone cible" ok={false} value={-0.3} />
                </li>
              </ul>
            </section>

            <section className="section-atelier p-4 md:p-5">
              <div className="section-atelier__head">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="size-4 shrink-0 text-primary" />
                  <h2 className="section-atelier__title min-w-0 text-sm md:text-base leading-tight">
                    Notes d'approche
                  </h2>
                </div>
                <button
                  onClick={() => setNotesEditOpen(true)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors shrink-0"
                  title="Modifier les notes"
                >
                  <Pencil className="size-3.5" />
                </button>
              </div>
              <div
                onContextMenu={ctx.bind({ type: "notes" }).onContextMenu}
                className="text-xs md:text-sm leading-relaxed whitespace-pre-line"
              >
                {lead.notes?.trim() || (
                  <span className="text-muted-foreground italic">
                    Aucune note d'approche. Cliquez sur ✏ pour en ajouter.
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    const body = `Bonjour ${lead.name.split(" ")[0]},\n\n${
                      lead.signal
                        ? `J'ai vu que ${lead.company} ${lead.signal.toLowerCase()}, félicitations !`
                        : `J'ai vu que ${lead.company} évolue dans votre secteur.`
                    }\n\n${lead.notes || "Seriez-vous disponible pour un échange de 20 minutes ?"}\n\nBien à vous,\nUtilisateur`;
                    handleSendEmail(
                      lead.signal ? `${lead.signal} : un échange rapide ?` : "Échange rapide ?",
                      body,
                    );
                  }}
                  disabled={!lead.email}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-2.5 py-1 text-xs hover:bg-primary/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="size-3" /> Générer l'email
                </button>
                <button
                  onClick={() => setCallOpen(true)}
                  disabled={!lead.phone}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mic className="size-3" /> Script d'appel
                </button>
              </div>
            </section>

            <section className="section-atelier overflow-hidden">
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
                      activity: leadActivity.length,
                      notes: lead.notes ? 1 : 0,
                      emails: leadEmails.length,
                    };
                    const active = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "relative py-3 text-xs md:text-sm font-medium transition-colors whitespace-nowrap inline-flex items-center gap-1.5",
                          active
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {labels[tab]}
                        {counts[tab] != null && counts[tab]! > 0 && (
                          <span
                            className={cn(
                              "counter-pill counter-pill--sm",
                              !active && "counter-pill--muted",
                            )}
                          >
                            {counts[tab]}
                          </span>
                        )}
                        {active && (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-primary"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 md:p-5">
                {activeTab === "overview" && <OverviewTab lead={lead} />}
                {activeTab === "activity" && (
                  <ActivityTab activities={leadActivity} />
                )}
                {activeTab === "notes" && (
                  <NotesTab
                    notes={lead.notes ?? ""}
                    onSave={saveNotes}
                    onEdit={() => setNotesEditOpen(true)}
                  />
                )}
                {activeTab === "emails" && (
                  <EmailsTab
                    emails={leadEmails}
                    onCompose={() => setComposeOpen(true)}
                  />
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-3 md:space-y-4 lg:sticky lg:top-20 lg:self-start">
            <section className="section-atelier p-4">
              <div className="section-atelier__head">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="section-atelier__title truncate text-base">Entreprise</h2>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={openLogoCropper}
                  onContextMenu={ctx.bind({ type: "logo" }).onContextMenu}
                  aria-label="Changer le logo de l'entreprise"
                  title="Cliquer pour changer · Clic droit pour plus d'options"
                  className="group/logo relative shrink-0 rounded-lg transition-transform active:scale-95"
                >
                  {lead.companyLogoUrl ? (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "0.5rem",
                        overflow: "hidden",
                        backgroundColor: "var(--background)",
                        boxShadow: "0 0 0 1px var(--border)",
                      }}
                    >
                      <img
                        src={lead.companyLogoUrl}
                        alt=""
                        draggable={false}
                        style={{
                          display: "block",
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  ) : (
                    <CompanyLogo name={lead.company} size={36} rounded="lg" />
                  )}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full border border-border bg-background shadow-sm opacity-0 transition-opacity group-hover/logo:opacity-100"
                  >
                    <Edit className="size-2.5" />
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{lead.company}</p>
                  <p className="text-xs text-muted-foreground truncate">{lead.industry}</p>
                </div>
              </div>
              <Link
                to="/app/companies"
                className="mt-3 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                Voir la fiche entreprise <ChevronRight className="size-3" />
              </Link>
            </section>

            <section className="section-atelier p-4">
              <div className="section-atelier__head">
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="section-atelier__title truncate text-base">Coordonnées</h2>
                </div>
              </div>
              <div className="space-y-2.5">
                {lead.email && (
                  <div
                    onContextMenu={ctx.bind({ type: "email" }).onContextMenu}
                    className="flex items-center gap-2 group list-item-atelier p-2 cursor-context-menu"
                  >
                    <Mail className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] font-mono truncate flex-1">{lead.email}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyText(lead.email!, "Email");
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 hover:bg-surface"
                      aria-label="Copier l'email"
                    >
                      <Copy className="size-3 text-muted-foreground" />
                    </button>
                  </div>
                )}
                {lead.phone && (
                  <div
                    onContextMenu={ctx.bind({ type: "phone" }).onContextMenu}
                    className="flex items-center gap-2 list-item-atelier p-2 cursor-context-menu"
                  >
                    <Phone className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] font-mono truncate flex-1">{lead.phone}</span>
                  </div>
                )}
                <a
                  href={`https://www.linkedin.com/in/${lead.name.toLowerCase().replace(/\s+/g, "-")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onContextMenu={ctx.bind({ type: "linkedin" }).onContextMenu}
                  className="flex items-center gap-2 text-[11px] text-primary hover:underline list-item-atelier p-2 border-primary/20 cursor-context-menu"
                >
                  <Linkedin className="size-3.5 shrink-0" />
                  <span className="truncate">Profil LinkedIn</span>
                  <ExternalLink className="size-3 ml-auto shrink-0" />
                </a>
              </div>
            </section>

            <TagsSection lead={lead} onAdd={addTag} onRemove={removeTag} onContext={ctx.bind} />

            <NextActionsSection
              tasks={leadTasks}
              openTasks={openTasks}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onContext={ctx.bind}
              lead={lead}
            />
          </aside>
        </div>
      </div>

      <EditPeopleDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        lead={lead}
        onSave={(patch) => {
          updateLead(lead.id, patch);
          addActivity("Prospect modifié", lead.name);
          toast.success("Prospect mis à jour");
          setEditOpen(false);
        }}
      />
      <CallDialog
        open={callOpen}
        onOpenChange={setCallOpen}
        lead={lead}
        onCompleted={(duration) => {
          addActivity("Appel effectué", `À ${lead.name} · ${duration}`);
          store.addTask({
            title: `Suivi après appel avec ${lead.name}`,
            type: "follow-up",
            contact: lead.name,
            due: "Demain",
            priority: "med",
          });
          toast.success("Tâche de suivi créée");
        }}
      />
      <ScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        lead={lead}
        onScheduled={(summary) => {
          addActivity("Meeting planifié", `Avec ${lead.name} · ${summary}`);
          store.addTask({
            title: `Meeting avec ${lead.name}`,
            type: "call",
            contact: lead.name,
            due: "À venir",
            priority: "high",
          });
          toast.success("Meeting planifié");
        }}
      />
      <ComposeEmailDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        lead={lead}
        onSend={handleSendEmail}
      />
      <ScoreEditDialog
        open={scoreEditOpen}
        onOpenChange={setScoreEditOpen}
        value={lead.score}
        onSave={updateScore}
      />
      <NotesEditDialog
        open={notesEditOpen}
        onOpenChange={setNotesEditOpen}
        value={lead.notes ?? ""}
        onSave={(v) => {
          saveNotes(v);
          setNotesEditOpen(false);
        }}
      />

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*,image/svg+xml,.svg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const result = typeof reader.result === "string" ? reader.result : "";
            if (result) {
              setAvatarCropSrc(result);
              setAvatarCropOpen(true);
            }
          };
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*,image/svg+xml,.svg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const result = typeof reader.result === "string" ? reader.result : "";
            if (result) {
              setLogoCropSrc(result);
              setLogoCropOpen(true);
            }
          };
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />

      <ImageCropperDialog
        open={avatarCropOpen}
        onOpenChange={(v) => {
          setAvatarCropOpen(v);
          if (!v) setAvatarCropSrc("");
        }}
        src={avatarCropSrc}
        shape="circle"
        defaultBackground="surface"
        allowBackgroundChoice
        onSave={(url) => {
          updateLead(lead.id, { avatarUrl: url });
          addActivity("Photo modifiée", lead.name);
          toast.success("Photo mise à jour");
          setAvatarCropSrc("");
        }}
      />
      <ImageCropperDialog
        open={logoCropOpen}
        onOpenChange={(v) => {
          setLogoCropOpen(v);
          if (!v) setLogoCropSrc("");
        }}
        src={logoCropSrc}
        shape="rounded"
        defaultBackground="transparent"
        allowBackgroundChoice
        onSave={(url) => {
          updateLead(lead.id, { companyLogoUrl: url });
          addActivity("Logo modifié", lead.company);
          toast.success("Logo mis à jour");
          setLogoCropSrc("");
        }}
      />

      {ctx.state && contextSections.length > 0 && (
        <ContextMenu
          open
          position={{ x: ctx.state.x, y: ctx.state.y }}
          onClose={ctx.close}
          sections={contextSections}
        />
      )}
    </>
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
      <span className="flex-1 text-muted-foreground truncate text-xs md:text-sm">{label}</span>
      <span
        className={cn(
          "font-mono text-xs shrink-0 tabular-nums",
          value > 0 ? "text-primary" : "text-amber-600",
        )}
      >
        {value > 0 ? "+" : ""}
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function OverviewTab({ lead }: { lead: any }) {
  return (
    <div className="grid md:grid-cols-2 gap-3 md:gap-4">
      <div className="list-item-atelier p-3 md:p-4">
        <h3 className="text-[13px] font-semibold text-foreground mb-3 inline-flex items-center gap-1.5">
          <Mail className="size-3 text-primary" /> Coordonnées
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

      <div className="list-item-atelier p-3 md:p-4">
        <h3 className="text-[13px] font-semibold text-foreground mb-3 inline-flex items-center gap-1.5">
          <Building2 className="size-3 text-primary" /> Entreprise
        </h3>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nom</span>
            <span className="font-medium truncate ml-2">{lead.company}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Industrie</span>
            <span className="truncate ml-2">{lead.industry}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Localisation</span>
            <span className="truncate ml-2">{lead.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityTab({
  activities,
}: {
  activities: { id: string; label: string; detail: string; time: string }[];
}) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs md:text-sm text-muted-foreground">Aucune activité pour ce prospect.</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Les actions apparaîtront ici automatiquement.
        </p>
      </div>
    );
  }

  const iconFor = (label: string) => {
    if (/email/i.test(label)) return Send;
    if (/appel|call/i.test(label)) return PhoneCall;
    if (/meeting|rdv|planifi/i.test(label)) return CalendarDays;
    if (/note/i.test(label)) return FileText;
    if (/signal/i.test(label)) return Radio;
    if (/tag/i.test(label)) return TagIcon;
    if (/profil|visit/i.test(label)) return Users;
    return CircleDot;
  };

  return (
    <ul className="space-y-2">
      {activities.map((a) => {
        const Icon = iconFor(a.label);
        return (
          <li key={a.id} className="list-item-atelier p-3 flex items-start gap-3">
            <div className="size-7 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0 mt-0.5">
              <Icon className="size-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.detail}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {a.time}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function NotesTab({
  notes,
  onSave,
  onEdit,
}: {
  notes: string;
  onSave: (text: string) => void;
  onEdit: () => void;
}) {
  const [draft, setDraft] = useState(notes);
  useEffect(() => setDraft(notes), [notes]);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Notes d'approche, contexte, objections, prochaines étapes…"
          rows={8}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[140px]"
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Sauvegarde auto via le bouton, ou appuyez sur ✏ dans l'en-tête.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-[11px] hover:bg-surface transition-colors"
          >
            Éditer en plein écran
          </button>
          <button
            onClick={() => onSave(draft)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-[11px] hover:brightness-110 transition-all"
          >
            <Save className="size-3" /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function EmailsTab({
  emails,
  onCompose,
}: {
  emails: any[];
  onCompose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={onCompose}
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3 py-1.5 text-[11px] hover:opacity-90 transition-opacity"
        >
          <Send className="size-3.5" /> Nouveau message
        </button>
      </div>

      {emails.length === 0 ? (
        <div className="text-center py-8 rounded-lg border border-dashed border-border">
          <Mail className="mx-auto size-6 text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">Aucun email échangé pour le moment.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {emails.map((e) => {
            const isSent = e.status === "sent";
            return (
              <li
                key={e.id}
                className="list-item-atelier p-3 flex items-start gap-3 cursor-pointer"
              >
                <div
                  className={cn(
                    "size-8 rounded-full grid place-items-center shrink-0",
                    isSent ? "bg-primary/10 text-primary" : "bg-secondary",
                  )}
                >
                  {isSent ? <Send className="size-3.5" /> : <Mail className="size-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs md:text-sm font-medium truncate">{e.subject}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{e.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {e.preview}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TagsSection({
  lead,
  onAdd,
  onRemove,
  onContext,
}: {
  lead: any;
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  onContext: (payload: CtxPayload) => any;
}) {
  const { leads } = useAppStore();
  const tags: string[] = lead.tags ?? [];

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) {
      for (const t of l.tags ?? []) set.add(t);
    }
    return Array.from(set).sort();
  }, [leads]);

  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTags
      .filter((t) => !tags.includes(t))
      .filter((t) => (q ? t.toLowerCase().includes(q) : true))
      .slice(0, 8);
  }, [allTags, tags, query]);

  const canCreate =
    query.trim().length > 0 &&
    !tags.includes(query.trim()) &&
    !allTags.some((t) => t.toLowerCase() === query.trim().toLowerCase());

  return (
    <section className="section-atelier p-4">
      <div className="section-atelier__head">
        <div className="flex items-center gap-2 min-w-0">
          <TagIcon className="size-4 shrink-0 text-muted-foreground" />
          <h2 className="section-atelier__title truncate text-base">Tags</h2>
        </div>
        <span className="counter-pill counter-pill--sm">{tags.length}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span
            key={t}
            onContextMenu={onContext({ type: "tag", tag: t }).onContextMenu}
            className="group/tag inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2 py-0.5 text-xs text-foreground cursor-context-menu hover:bg-secondary transition-colors"
          >
            <span className="truncate">{t}</span>
            <button
              onClick={() => onRemove(t)}
              className="grid size-3 place-items-center rounded-full text-muted-foreground/60 hover:bg-destructive/15 hover:text-destructive transition-colors"
              aria-label={`Retirer ${t}`}
            >
              <X className="size-2.5" />
            </button>
          </span>
        ))}

        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
              <Plus className="size-2.5" /> Ajouter
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-0">
            <div className="border-b border-border px-3 py-2">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher ou créer…"
                className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) {
                    onAdd(query.trim());
                    setQuery("");
                    setAddOpen(false);
                  }
                }}
              />
            </div>

            <ul className="max-h-56 overflow-y-auto p-1">
              {suggestions.length === 0 && !canCreate && (
                <li className="px-3 py-4 text-center text-[11px] text-muted-foreground">
                  {query.trim() ? "Aucun tag correspondant." : "Aucun tag existant."}
                </li>
              )}
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    onClick={() => {
                      onAdd(s);
                      setQuery("");
                      setAddOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-surface"
                  >
                    <TagIcon className="size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate flex-1">{s}</span>
                  </button>
                </li>
              ))}
              {canCreate && (
                <li className="mt-1 border-t border-border pt-1">
                  <button
                    onClick={() => {
                      onAdd(query.trim());
                      setQuery("");
                      setAddOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-primary transition-colors hover:bg-primary/10"
                  >
                    <Plus className="size-3 shrink-0" />
                    <span className="truncate">Créer « {query.trim()} »</span>
                  </button>
                </li>
              )}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
    </section>
  );
}

function NextActionsSection({
  tasks,
  openTasks,
  onToggle,
  onDelete,
  onContext,
  lead,
}: {
  tasks: any[];
  openTasks: any[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onContext: (payload: CtxPayload) => any;
  lead: any;
}) {
  const store = useAppStore();

  return (
    <section className="section-atelier p-4">
      <div className="section-atelier__head">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="size-4 shrink-0 text-muted-foreground" />
          <h2 className="section-atelier__title truncate text-base">Prochaines actions</h2>
        </div>
        <span className="counter-pill counter-pill--sm">{openTasks.length}</span>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-surface/20 p-4 text-center">
          <p className="text-[11px] text-muted-foreground mb-2">Aucune action planifiée.</p>
          <TaskFormDialog
            trigger={
              <button className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline">
                <Plus className="size-3" /> Créer une tâche
              </button>
            }
            onSubmit={(values) => {
              store.addTask({ ...values, contact: lead.name });
              store.addActivity("Tâche créée", `${lead.name} · ${values.title}`);
              toast.success("Tâche créée");
            }}
          />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {openTasks.map((t) => (
              <div
                key={t.id}
                onContextMenu={onContext({ type: "task", taskId: t.id }).onContextMenu}
                className="list-item-atelier p-2.5 flex items-start gap-2 cursor-context-menu"
              >
                <button
                  onClick={() => onToggle(t.id)}
                  className="shrink-0 mt-0.5"
                  aria-label="Marquer terminée"
                >
                  <CircleDot className="size-3.5 text-muted-foreground hover:text-primary transition-colors" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-xs truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {t.due} · {t.priority}
                  </p>
                </div>
                <button
                  onClick={() => onDelete(t.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-colors p-0.5"
                  aria-label="Supprimer"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}

            {openTasks.length === 0 && (
              <p className="text-[11px] text-muted-foreground italic">
                Toutes les actions sont terminées.
              </p>
            )}
          </div>

          <div className="mt-3 border-t border-border/60 pt-3">
            <TaskFormDialog
              trigger={
                <button className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-background py-1.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                  <Plus className="size-3" /> Ajouter une action
                </button>
              }
              onSubmit={(values) => {
                store.addTask({ ...values, contact: lead.name });
                store.addActivity("Tâche créée", `${lead.name} · ${values.title}`);
                toast.success("Tâche ajoutée");
              }}
            />
          </div>
        </>
      )}
    </section>
  );
}

function ComposeEmailDialog({
  open,
  onOpenChange,
  lead,
  onSend,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: any;
  onSend: (subject: string, body: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!open) return;
    setSubject("");
    setBody(`Bonjour ${lead.name.split(" ")[0]},\n\n\n\nBien à vous,\nUtilisateur`);
  }, [open, lead.name]);

  const submit = () => {
    if (!subject.trim()) {
      toast.error("Objet requis");
      return;
    }
    onSend(subject.trim(), body);
    setSubject("");
    setBody("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Nouveau message</DialogTitle>
          <DialogDescription>
            {lead.name} · <span className="font-mono">{lead.email || "Aucun email"}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-[13px] font-medium text-foreground">
              Objet
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet de l'email"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="text-[13px] font-medium text-foreground">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[200px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm hover:bg-surface transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={!subject.trim() || !lead.email}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <Send className="size-3.5" /> Envoyer
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScoreEditDialog({
  open,
  onOpenChange,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: number | null;
  onSave: (score: string) => void;
}) {
  const [draft, setDraft] = useState(value !== null ? String(value) : "");

  useEffect(() => {
    if (open) setDraft(value !== null ? String(value) : "");
  }, [open, value]);

  const submit = () => {
    onSave(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Modifier le score ICP</DialogTitle>
          <DialogDescription>
            Score de 0 à 10, utilisé pour prioriser les prospects.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ScoreStepper
            value={draft}
            onChange={setDraft}
            min={0}
            max={10}
            step={0.5}
            placeholder="8.5"
          />
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-surface transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3 py-1.5 text-xs hover:opacity-90 transition-opacity"
          >
            <Save className="size-3" /> Enregistrer
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NotesEditDialog({
  open,
  onOpenChange,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: string;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Notes d'approche</DialogTitle>
          <DialogDescription>
            Notes internes, contexte, objections, prochaines étapes. Persistées sur la fiche.
          </DialogDescription>
        </DialogHeader>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={12}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[220px]"
          placeholder="Notes internes, contexte, objections…"
        />

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-surface transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(draft)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3 py-1.5 text-xs hover:opacity-90 transition-opacity"
          >
            <Save className="size-3" /> Enregistrer
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
