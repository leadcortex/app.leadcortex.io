// frontend/routes/app/companies/$id.tsx

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/common/ui-primitives";
import { useAppStore } from "@/lib/state/store";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  Copy,
  Edit,
  ExternalLink,
  FileText,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Radio,
  Save,
  Send,
  Sparkles,
  Star,
  Tag as TagIcon,
  Trash2,
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
import { ImageCropperDialog } from "@/components/ui/image-cropper-dialog";
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
import { EditCompanyDialog } from "@/components/companies/edit-company-dialog";
import { intentLabels } from "@/lib/companies/helpers";
import { cn } from "@/lib/core/utils";

export const Route = createFileRoute("/app/companies/$id")({
  head: () => ({ meta: [{ title: "Entreprise — LeadCortex" }] }),
  pendingComponent: () => <DetailViewSkeleton />,
  component: CompaniesDetailPage,
});

type CtxPayload =
  | { type: "hero" }
  | { type: "logo" }
  | { type: "domain" }
  | { type: "linkedin" }
  | { type: "website" }
  | { type: "tag"; tag: string }
  | { type: "notes" };

function CompaniesDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const store = useAppStore();
  const {
    companies,
    leads,
    activity,
    toggleCompanySaved,
    updateCompany,
    deleteCompany,
    addActivity,
    addLead,
  } = store;

  const company = useMemo(
    () => companies.find((c) => String(c.id) === String(id)),
    [companies, id],
  );

  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(t);
  }, [id]);

  const [editOpen, setEditOpen] = useState(false);
  const [notesEditOpen, setNotesEditOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoCropOpen, setLogoCropOpen] = useState(false);
  const [logoCropSrc, setLogoCropSrc] = useState("");

  const [activeTab, setActiveTab] = useState<"overview" | "contacts" | "activity" | "notes">(
    "overview",
  );

  const ctx = useContextMenu<CtxPayload>({});

  const linkedContacts = useMemo(() => {
    if (!company) return [];
    const normalized = company.name.trim().toLowerCase();
    return leads.filter((l) => l.company.trim().toLowerCase() === normalized);
  }, [leads, company]);

  const companyActivity = useMemo(() => {
    if (!company) return [];
    const normalized = company.name.toLowerCase();
    return activity.filter(
      (a) =>
        a.detail.toLowerCase().includes(normalized) ||
        a.label.toLowerCase().includes(normalized),
    );
  }, [activity, company]);

  if (!company && !ready) {
    return (
      <div className="p-4 md:p-8">
        <DetailViewSkeleton />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="mx-auto w-full max-w-[1400px] p-4 md:p-8 text-center">
        <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-border bg-surface/30 p-6 md:p-8 shadow-[0_3px_0_var(--border)]">
          <AlertCircle className="size-10 md:size-12 mx-auto text-muted-foreground mb-3 md:mb-4" />
          <h2 className="font-display text-xl md:text-2xl italic">Entreprise introuvable</h2>
          <p className="text-muted-foreground text-xs md:text-sm mt-2">
            Cette entreprise n'existe pas ou a été supprimée.
          </p>
          <p className="text-muted-foreground/60 text-[10px] mt-1 font-mono">id : {String(id)}</p>
          <Link
            to="/app/companies"
            className="inline-flex items-center gap-2 mt-4 md:mt-6 text-xs md:text-sm text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5 md:size-4" /> Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const copyText = (value: string, label: string) => {
    navigator.clipboard?.writeText(value);
    toast.success(`${label} copié`);
  };

  const openLogoCropper = () => {
    if (company.companyLogoUrl) {
      setLogoCropSrc(company.companyLogoUrl);
      setLogoCropOpen(true);
    } else {
      logoInputRef.current?.click();
    }
  };

  const addTag = (tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    const current = company.tags ?? [];
    if (current.includes(clean)) {
      toast.info("Ce tag existe déjà");
      return;
    }
    updateCompany(company.id, { tags: [...current, clean] });
    addActivity("Tag ajouté", `${company.name} — ${clean}`);
    toast.success(`Tag « ${clean} » ajouté`);
  };

  const removeTag = (tag: string) => {
    const current = company.tags ?? [];
    updateCompany(company.id, { tags: current.filter((t) => t !== tag) });
    addActivity("Tag retiré", `${company.name} — ${tag}`);
    toast.success(`Tag « ${tag} » retiré`);
  };

  const saveNotes = (notes: string) => {
    updateCompany(company.id, { notes });
    addActivity("Notes mises à jour", company.name);
    toast.success("Notes enregistrées");
  };

  const handleCreateContact = () => {
    const newLead = addLead({
      name: "Nouveau contact",
      title: "—",
      company: company.name,
      industry: company.industry,
      location: company.location,
      status: "queued",
      score: null,
      stage: "new",
      saved: false,
    });
    addActivity("Contact créé", `${newLead.name} — ${company.name}`);
    toast.success("Contact créé");
    navigate({ to: "/app/people/$id", params: { id: newLead.id } });
  };

  const handleSendEmail = (subject: string, body: string) => {
    const contact = linkedContacts[0];
    if (!contact?.email) {
      toast.error("Aucun contact avec un email dans cette entreprise");
      return;
    }
    addActivity("Email envoyé", `À ${contact.name} — ${subject}`);
    store.sendEmail({
      id: `e-${Date.now()}`,
      threadId: `t-${Date.now()}`,
      accountId: "acc-1",
      from: "Utilisateur <utilisateur@leadcortex.io>",
      to: [contact.email],
      subject,
      preview: body.slice(0, 140),
      body,
      time: "à l'instant",
      date: new Date().toISOString(),
      unread: false,
      status: "sent",
      folder: "sent",
    });
    toast.success("Email envoyé");
    setComposeOpen(false);
  };

  const intent = company.intent ?? "cold";

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
                onSelect: () => copyText(company.name, "Nom"),
              },
              {
                id: "add-contact",
                label: "Ajouter un contact",
                icon: Users,
                onSelect: handleCreateContact,
              },
              {
                id: "delete-hero",
                label: "Supprimer l'entreprise",
                icon: Trash2,
                tone: "danger",
                separatorBefore: true,
                onSelect: () => {
                  if (!confirm(`Supprimer ${company.name} ? Les contacts liés seront conservés.`))
                    return;
                  deleteCompany(company.id);
                  addActivity("Entreprise supprimée", company.name);
                  toast.success("Entreprise supprimée");
                  navigate({ to: "/app/companies" });
                },
              },
            ],
          });
        } else if (p.type === "logo") {
          sections.push({
            id: "logo",
            items: [
              {
                id: "change-logo",
                label: company.companyLogoUrl ? "Changer le logo" : "Ajouter un logo",
                icon: Edit,
                onSelect: openLogoCropper,
              },
              ...(company.companyLogoUrl
                ? [
                    {
                      id: "remove-logo",
                      label: "Supprimer le logo",
                      icon: Trash2,
                      tone: "danger" as const,
                      onSelect: () => {
                        updateCompany(company.id, { companyLogoUrl: undefined });
                        toast.success("Logo supprimé");
                      },
                    },
                  ]
                : []),
            ],
          });
        } else if (p.type === "domain" && company.domain) {
          sections.push({
            id: "domain",
            items: [
              {
                id: "copy-domain",
                label: "Copier le domaine",
                icon: Copy,
                onSelect: () => copyText(company.domain!, "Domaine"),
              },
              {
                id: "open-site",
                label: "Ouvrir le site",
                icon: ExternalLink,
                onSelect: () => window.open(`https://${company.domain}`, "_blank", "noopener"),
              },
            ],
          });
        } else if (p.type === "linkedin") {
          const url =
            company.linkedin ||
            `https://www.linkedin.com/company/${company.name.toLowerCase().replace(/\s+/g, "-")}`;
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
        } else if (p.type === "website" && company.website) {
          sections.push({
            id: "website",
            items: [
              {
                id: "open-website",
                label: "Ouvrir le site",
                icon: ExternalLink,
                onSelect: () => window.open(company.website!, "_blank", "noopener"),
              },
              {
                id: "copy-website",
                label: "Copier le lien",
                icon: Copy,
                onSelect: () => copyText(company.website!, "Site web"),
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
              ...(company.notes
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
      <div className="sticky top-0 z-30 -mx-3 md:-mx-6 px-3 md:px-6 py-2.5 bg-background/90 backdrop-blur-xl border-b border-border mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <Link
            to="/app/companies"
            className="rounded-lg border border-border bg-background p-1.5 hover:bg-surface transition-colors shrink-0 shadow-[0_1px_0_var(--border)]"
            title="Retour"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <div className="hidden md:flex items-center gap-2 min-w-0">
            <span className="truncate font-medium text-sm">{company.name}</span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="truncate text-xs text-muted-foreground">
              {company.domain || "—"}
            </span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCreateContact}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-2.5 md:px-3 py-1.5 text-[10px] md:text-xs font-medium hover:opacity-90 transition-opacity shadow-[0_2px_0_color-mix(in_oklab,var(--foreground)_70%,black)] active:translate-y-[2px] active:shadow-none"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Contact</span>
            </button>
            {company.domain && (
              <button
                onClick={() => window.open(`https://${company.domain}`, "_blank", "noopener")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 md:px-3 py-1.5 text-[10px] md:text-xs hover:bg-surface transition-colors shadow-[0_1px_0_var(--border)]"
              >
                <Globe className="size-3.5" />
                <span className="hidden sm:inline">Site</span>
              </button>
            )}

            <span className="w-px h-5 bg-border mx-1" />

            <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 shadow-[0_1px_0_var(--border)]">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Intent
              </span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  intent === "hot"
                    ? "text-primary"
                    : intent === "warm"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground",
                )}
              >
                {intentLabels[intent]}
              </span>
            </div>
            <button
              onClick={() => {
                toggleCompanySaved(company.id);
                toast.success(company.saved ? "Retiré des favoris" : "Ajouté aux favoris");
              }}
              className={cn(
                "rounded-lg border p-1.5 transition-colors",
                company.saved
                  ? "border-primary bg-primary/5 text-primary shadow-[0_1px_0_color-mix(in_oklab,var(--primary)_40%,transparent)]"
                  : "border-border bg-background hover:bg-surface shadow-[0_1px_0_var(--border)]",
              )}
              title={company.saved ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Star className={cn("size-3.5", company.saved && "fill-primary")} />
            </button>
            <ActionMenu
              items={[
                { label: "Modifier la fiche", icon: Edit, onSelect: () => setEditOpen(true) },
                {
                  label: "Ajouter un contact",
                  icon: Users,
                  onSelect: handleCreateContact,
                },
                {
                  label: "Envoyer un email",
                  icon: Send,
                  onSelect: () => setComposeOpen(true),
                },
                {
                  label: "Copier le domaine",
                  icon: Copy,
                  onSelect: () => {
                    if (!company.domain) return toast.error("Aucun domaine renseigné");
                    copyText(company.domain, "Domaine");
                  },
                },
                {
                  label: "Supprimer l'entreprise",
                  icon: Trash2,
                  tone: "danger",
                  separatorBefore: true,
                  onSelect: () => {
                    if (!confirm(`Supprimer ${company.name} ? Les contacts liés seront conservés.`))
                      return;
                    deleteCompany(company.id);
                    addActivity("Entreprise supprimée", company.name);
                    toast.success("Entreprise supprimée");
                    navigate({ to: "/app/companies" });
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
              onClick={openLogoCropper}
              onContextMenu={ctx.bind({ type: "logo" }).onContextMenu}
              aria-label="Changer le logo"
              title="Cliquer pour changer · Clic droit pour plus d'options"
              className="group/logo relative shrink-0 rounded-lg transition-transform active:scale-95"
            >
              {company.companyLogoUrl ? (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "0.75rem",
                    overflow: "hidden",
                    boxShadow:
                      "0 0 0 2px color-mix(in oklab, var(--primary) 20%, transparent), 0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  <img
                    src={company.companyLogoUrl}
                    alt={company.name}
                    draggable={false}
                    style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ) : (
                <CompanyLogo name={company.name} domain={company.domain} size={96} rounded="lg" />
              )}
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border border-border bg-background shadow-[0_1px_0_var(--border)] opacity-0 transition-opacity group-hover/logo:opacity-100"
              >
                <Edit className="size-3.5" />
              </span>
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl md:text-4xl italic break-words">
                {company.name}
              </h1>
              <p
                className="text-sm md:text-base text-muted-foreground mt-0.5 md:mt-1 font-mono cursor-context-menu"
                onContextMenu={ctx.bind({ type: "domain" }).onContextMenu}
              >
                {company.domain || "—"}
              </p>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2 md:mt-3 text-xs md:text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {company.location || "—"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5" />{" "}
                  {(Number(company.employees) || 0).toLocaleString("fr-FR")} employés
                </span>
                <span className="hidden md:flex items-center gap-1.5">
                  <Briefcase className="size-3.5" /> {company.industry || "—"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-3">
                <Badge
                  tone={intent === "hot" ? "primary" : intent === "warm" ? "warning" : "muted"}
                >
                  {intentLabels[intent]}
                </Badge>
                {company.size && company.size !== "—" && (
                  <Badge tone="muted">{company.size}</Badge>
                )}
                {company.revenue && company.revenue !== "—" && (
                  <Badge tone="muted">{company.revenue}</Badge>
                )}
                {linkedContacts.length > 0 && (
                  <Badge tone="primary">
                    <Users className="size-2.5 mr-1" />
                    {linkedContacts.length} contact{linkedContacts.length > 1 ? "s" : ""}
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
                  <Users className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="section-atelier__title min-w-0 text-sm md:text-base leading-tight">
                    Couverture contacts
                  </h2>
                </div>
                <span className="counter-pill shrink-0">{linkedContacts.length}</span>
              </div>

              <div className="mb-4">
                <ProgressCapsule
                  value={Math.min(linkedContacts.length, 10)}
                  max={10}
                  size="md"
                  tone={linkedContacts.length >= 3 ? "success" : "primary"}
                />
                <p className="text-[10.5px] text-muted-foreground mt-1.5">
                  {linkedContacts.length === 0
                    ? "Aucun contact identifié — ajoutez-en pour enrichir ce compte."
                    : `${linkedContacts.length} contact${linkedContacts.length > 1 ? "s" : ""} — vous avez une bonne couverture.`}
                </p>
              </div>

              <button
                onClick={handleCreateContact}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-[11px] md:text-xs hover:bg-primary/15 transition-colors shadow-[0_1px_0_color-mix(in_oklab,var(--primary)_20%,transparent)]"
              >
                <Plus className="size-3.5" /> Ajouter un contact
              </button>
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
                {company.notes?.trim() || (
                  <span className="text-muted-foreground italic">
                    Aucune note d'approche. Cliquez sur ✏ pour en ajouter.
                  </span>
                )}
              </div>
            </section>

            <section className="section-atelier overflow-hidden">
              <div className="border-b border-border px-3 md:px-4 overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 md:gap-5 min-w-max">
                  {(["overview", "contacts", "activity", "notes"] as const).map((tab) => {
                    const labels = {
                      overview: "Aperçu",
                      contacts: "Contacts",
                      activity: "Activité",
                      notes: "Notes",
                    };
                    const counts: Record<string, number | null> = {
                      overview: null,
                      contacts: linkedContacts.length,
                      activity: companyActivity.length,
                      notes: company.notes ? 1 : 0,
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
                {activeTab === "overview" && <OverviewTab company={company} />}
                {activeTab === "contacts" && (
                  <ContactsTab
                    contacts={linkedContacts}
                    onCreate={handleCreateContact}
                    onOpen={(id) =>
                      navigate({ to: "/app/people/$id", params: { id } })
                    }
                  />
                )}
                {activeTab === "activity" && <ActivityTab activities={companyActivity} />}
                {activeTab === "notes" && (
                  <NotesTab
                    notes={company.notes ?? ""}
                    onSave={saveNotes}
                    onEdit={() => setNotesEditOpen(true)}
                  />
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-3 md:space-y-4 lg:sticky lg:top-20 lg:self-start">
            <section className="section-atelier p-4">
              <div className="section-atelier__head">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="section-atelier__title truncate text-base">Coordonnées</h2>
                </div>
              </div>
              <div className="space-y-2.5">
                {company.domain && (
                  <div
                    onContextMenu={ctx.bind({ type: "domain" }).onContextMenu}
                    className="flex items-center gap-2 group list-item-atelier p-2 cursor-context-menu"
                  >
                    <Globe className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] font-mono truncate flex-1">
                      {company.domain}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyText(company.domain!, "Domaine");
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 hover:bg-surface"
                      aria-label="Copier le domaine"
                    >
                      <Copy className="size-3 text-muted-foreground" />
                    </button>
                  </div>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onContextMenu={ctx.bind({ type: "website" }).onContextMenu}
                    className="flex items-center gap-2 text-[11px] text-primary hover:underline list-item-atelier p-2 border-primary/20 cursor-context-menu"
                  >
                    <Globe className="size-3.5 shrink-0" />
                    <span className="truncate">Site web</span>
                    <ExternalLink className="size-3 ml-auto shrink-0" />
                  </a>
                )}
                <a
                  href={
                    company.linkedin ||
                    `https://www.linkedin.com/company/${company.name.toLowerCase().replace(/\s+/g, "-")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  onContextMenu={ctx.bind({ type: "linkedin" }).onContextMenu}
                  className="flex items-center gap-2 text-[11px] text-primary hover:underline list-item-atelier p-2 border-primary/20 cursor-context-menu"
                >
                  <Linkedin className="size-3.5 shrink-0" />
                  <span className="truncate">LinkedIn</span>
                  <ExternalLink className="size-3 ml-auto shrink-0" />
                </a>
                {!company.domain && !company.website && !company.linkedin && (
                  <p className="text-[11px] text-muted-foreground italic">
                    Aucune coordonnée renseignée.
                  </p>
                )}
              </div>
            </section>

            <TagsSection company={company} onAdd={addTag} onRemove={removeTag} onContext={ctx.bind} />

            <section className="section-atelier p-4">
              <div className="section-atelier__head">
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="section-atelier__title truncate text-base">Contacts liés</h2>
                </div>
                <span className="counter-pill counter-pill--sm">{linkedContacts.length}</span>
              </div>

              {linkedContacts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 bg-surface/20 p-4 text-center">
                  <p className="text-[11px] text-muted-foreground mb-2">Aucun contact lié.</p>
                  <button
                    onClick={handleCreateContact}
                    className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline"
                  >
                    <Plus className="size-3" /> Ajouter un contact
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedContacts.slice(0, 5).map((c) => (
                    <Link
                      key={c.id}
                      to="/app/people/$id"
                      params={{ id: c.id }}
                      className="list-item-atelier p-2.5 flex items-center gap-2 hover:bg-primary/[0.04]"
                    >
                      {c.avatarUrl ? (
                        <img
                          src={c.avatarUrl}
                          alt=""
                          className="size-7 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <LetterAvatar name={c.name} size={28} shape="circle" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {c.title}
                        </p>
                      </div>
                      {typeof c.score === "number" && (
                        <span className="shrink-0 rounded px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-mono font-semibold">
                          {c.score.toFixed(1)}
                        </span>
                      )}
                    </Link>
                  ))}
                  {linkedContacts.length > 5 && (
                    <button
                      onClick={() => setActiveTab("contacts")}
                      className="w-full text-center text-[10px] text-primary hover:underline py-1"
                    >
                      Voir les {linkedContacts.length - 5} autres →
                    </button>
                  )}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      <EditCompanyDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        company={company}
        onSave={(patch) => {
          updateCompany(company.id, patch);
          addActivity("Entreprise modifiée", company.name);
          toast.success("Entreprise mise à jour");
          setEditOpen(false);
        }}
      />

      <ComposeEmailDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        company={company}
        contacts={linkedContacts}
        onSend={handleSendEmail}
      />

      <NotesEditDialog
        open={notesEditOpen}
        onOpenChange={setNotesEditOpen}
        value={company.notes ?? ""}
        onSave={(v) => {
          saveNotes(v);
          setNotesEditOpen(false);
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
          updateCompany(company.id, { companyLogoUrl: url });
          addActivity("Logo modifié", company.name);
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

function OverviewTab({ company }: { company: any }) {
  const employees = Number(company.employees) || 0;
  return (
    <div className="grid md:grid-cols-2 gap-3 md:gap-4">
      <div className="list-item-atelier p-3 md:p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3 inline-flex items-center gap-1.5">
          <Building2 className="size-3 text-primary" /> Informations
        </h3>
        <div className="space-y-1.5 text-xs">
          <Row label="Industrie" value={company.industry || "—"} />
          <Row label="Localisation" value={company.location || "—"} />
          <Row label="Effectif" value={employees.toLocaleString("fr-FR")} />
          <Row label="Tranche" value={company.size || "—"} />
          <Row label="Chiffre d'affaires" value={company.revenue || "—"} />
          <Row label="Domaine" value={company.domain || "—"} mono />
        </div>
      </div>

      <div className="list-item-atelier p-3 md:p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3 inline-flex items-center gap-1.5">
          <Sparkles className="size-3 text-primary" /> Qualification
        </h3>
        <div className="space-y-1.5 text-xs">
          <Row
            label="Intention"
            value={
              company.intent === "hot"
                ? "Forte"
                : company.intent === "warm"
                  ? "Moyenne"
                  : "Faible"
            }
          />
          {company.tags && company.tags.length > 0 && (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground shrink-0">Tags</span>
              <span className="text-right">
                {company.tags.slice(0, 3).join(", ")}
                {company.tags.length > 3 && ` +${company.tags.length - 3}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={mono ? "font-mono text-[10px] md:text-xs text-right break-all" : "text-right"}>
        {value}
      </span>
    </div>
  );
}

function ContactsTab({
  contacts,
  onCreate,
  onOpen,
}: {
  contacts: any[];
  onCreate: () => void;
  onOpen: (id: string) => void;
}) {
  if (contacts.length === 0) {
    return (
      <div className="text-center py-8 rounded-lg border border-dashed border-border">
        <Users className="mx-auto size-6 text-muted-foreground/40 mb-2" />
        <p className="text-xs text-muted-foreground mb-3">
          Aucun contact identifié pour cette entreprise.
        </p>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-[11px] hover:brightness-110 transition-all"
        >
          <Plus className="size-3" /> Ajouter un contact
        </button>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {contacts.map((c) => (
        <li
          key={c.id}
          onClick={() => onOpen(c.id)}
          className="list-item-atelier p-3 flex items-start gap-3 cursor-pointer"
        >
          <LetterAvatar name={c.name} size={36} shape="circle" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs md:text-sm font-medium truncate">{c.name}</p>
              {typeof c.score === "number" && (
                <span className="shrink-0 rounded px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-mono font-semibold">
                  {c.score.toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              {c.title}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
              {c.email && <Mail className="size-3 text-primary" />}
              {c.phone && <span className="font-mono">{c.phone}</span>}
            </div>
          </div>
        </li>
      ))}
    </ul>
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
        <p className="text-xs md:text-sm text-muted-foreground">
          Aucune activité pour cette entreprise.
        </p>
        <p className="mt-1 text-[10.5px] text-muted-foreground/70">
          Les actions apparaîtront ici automatiquement.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {activities.map((a) => (
        <li key={a.id} className="list-item-atelier p-3 flex items-start gap-3">
          <div className="size-7 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0 mt-0.5">
            <Radio className="size-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-medium">{a.label}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">{a.detail}</p>
            <p className="text-[9px] md:text-[10px] text-muted-foreground/60 mt-0.5">
              {a.time}
            </p>
          </div>
        </li>
      ))}
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
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Notes d'approche, contexte, objections, prochaines étapes…"
        rows={8}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[140px] shadow-[0_2px_0_var(--border)] focus:shadow-none focus:translate-y-[2px]"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-muted-foreground">
          Sauvegarde via le bouton, ou appuyez sur ✏ dans l'en-tête.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-[11px] hover:bg-surface transition-colors shadow-[0_1px_0_var(--border)]"
          >
            Éditer en plein écran
          </button>
          <button
            onClick={() => onSave(draft)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-[11px] hover:brightness-110 transition-all shadow-[0_2px_0_color-mix(in_oklab,var(--primary)_60%,black)] active:translate-y-[2px] active:shadow-none"
          >
            <Save className="size-3" /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function TagsSection({
  company,
  onAdd,
  onRemove,
  onContext,
}: {
  company: any;
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  onContext: (payload: CtxPayload) => any;
}) {
  const { companies } = useAppStore();
  const tags: string[] = company.tags ?? [];

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const c of companies) {
      for (const t of c.tags ?? []) set.add(t);
    }
    return Array.from(set).sort();
  }, [companies]);

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
            className="group/tag inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] text-foreground cursor-context-menu hover:bg-secondary transition-colors"
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
            <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
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

function ComposeEmailDialog({
  open,
  onOpenChange,
  company,
  contacts,
  onSend,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  company: any;
  contacts: any[];
  onSend: (subject: string, body: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const contact = contacts.find((c) => c.email);

  useEffect(() => {
    if (!open) return;
    setSubject("");
    setBody(
      `Bonjour ${contact?.name?.split(" ")[0] ?? ""},\n\n\n\nBien à vous,\nUtilisateur`,
    );
  }, [open, contact?.name]);

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
          <DialogTitle className="font-display text-xl italic">Nouveau message</DialogTitle>
          <DialogDescription>
            À <span className="font-mono">{contact?.email || "Aucun contact avec email"}</span> —{" "}
            {company.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm hover:bg-surface transition-colors shadow-[0_1px_0_var(--border)]"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={!subject.trim() || !contact?.email}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 shadow-[0_2px_0_color-mix(in_oklab,var(--foreground)_70%,black)] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <Send className="size-3.5" /> Envoyer
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
          <DialogTitle className="font-display text-lg italic">Notes d'approche</DialogTitle>
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
