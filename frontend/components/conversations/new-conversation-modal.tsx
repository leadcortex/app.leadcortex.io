//frontend\components\conversations\new-conversation-modal.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, UserPlus, X, Building2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import {
  CHANNELS,
  CHANNEL_ORDER,
  type ChannelId,
  type ProspectThread,
} from "@/lib/conversations-mock";
import { cn } from "@/lib/utils";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { SearchSelect, type SearchSelectOption } from "@/components/search-select";

const HANDLE_FIELDS: Record<ChannelId, { placeholder: string; type: string }> = {
  whatsapp: { placeholder: "+33 6 12 34 56 78", type: "tel" },
  sms: { placeholder: "+33 6 12 34 56 78", type: "tel" },
  email: { placeholder: "prenom.nom@entreprise.com", type: "email" },
  linkedin: { placeholder: "in/prenom-nom ou lien du profil", type: "text" },
  instagram: { placeholder: "@pseudo ou lien du profil", type: "text" },
};

const TONES: ProspectThread["avatarTone"][] = ["primary", "amber", "emerald", "sky"];

const PRESET_COMPANIES = [
  "Naval Systems",
  "Stripe",
  "Notion",
  "Linear",
  "Vercel",
  "Figma",
  "Datadog",
  "Airtable",
  "Retool",
  "Deel",
  "Qonto",
  "Payfit",
  "Alan",
  "Swile",
  "Ledger",
  "Contentsquare",
];

const PRESET_ROLES = [
  "CEO",
  "CTO",
  "COO",
  "CFO",
  "VP Sales",
  "VP Marketing",
  "VP Engineering",
  "Head of Growth",
  "Head of Product",
  "Head of Revenue",
  "Founder",
  "Directrice Achats",
  "Directeur commercial",
  "Directeur marketing",
  "Responsable RH",
];

const COMPANY_OPTIONS: SearchSelectOption[] = PRESET_COMPANIES.map((c) => ({
  value: c,
  label: c,
  icon: <Building2 className="size-4" />,
}));

const ROLE_OPTIONS: SearchSelectOption[] = PRESET_ROLES.map((r) => ({
  value: r,
  label: r,
  icon: <Briefcase className="size-4" />,
}));

const STAGE_OPTIONS: SearchSelectOption[] = [
  { value: "Nouveau", label: "Nouveau", description: "Pas encore contacté" },
  { value: "Contacté", label: "Contacté", description: "Premier message envoyé" },
  { value: "Qualifié", label: "Qualifié", description: "Besoin identifié" },
  { value: "Proposition", label: "Proposition", description: "Devis / offre envoyée" },
  { value: "Négociation", label: "Négociation", description: "Discussion en cours" },
  { value: "Client", label: "Client", description: "Signé" },
  { value: "Perdu", label: "Perdu", description: "Opportunité fermée" },
];

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary/50";

export function NewConversationModal({
  open,
  thread,
  onClose,
  onCreate,
}: {
  open: boolean;

  thread?: ProspectThread | null;
  onClose: () => void;
  onCreate: (thread: ProspectThread) => void;
}) {
  const editing = Boolean(thread);
  const isMobile = useIsMobile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [selected, setSelected] = useState<ChannelId[]>([]);
  const [handles, setHandles] = useState<Partial<Record<ChannelId, string>>>({});
  const [stage, setStage] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (thread) {
      const [fn, ...rest] = thread.contact.split(" ");
      setFirstName(fn ?? "");
      setLastName(rest.join(" "));
      setCompany(thread.company === "—" ? "" : thread.company);
      setRole(thread.role === "—" ? "" : thread.role);
      setSelected(thread.channels);
      setHandles({ ...thread.handles });
      setStage(thread.stage === "—" ? "" : thread.stage);
      setLocation(thread.location === "—" ? "" : thread.location);
      setNotes(thread.notes ?? "");
    } else {
      setFirstName("");
      setLastName("");
      setCompany("");
      setRole("");
      setSelected([]);
      setHandles({});
      setStage("");
      setLocation("");
      setNotes("");
    }
  }, [open, thread]);

  const validChannels = useMemo(
    () => selected.filter((c) => (handles[c] ?? "").trim().length > 0),
    [selected, handles],
  );

  if (!open) return null;

  const toggle = (c: ChannelId) =>
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const submit = () => {
    const contact = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!contact) {
      toast.error("Renseignez au moins un prénom ou un nom.");
      return;
    }
    if (validChannels.length === 0) {
      toast.error("Renseignez l'identifiant d'au moins un réseau sélectionné.");
      return;
    }

    const cleanHandles: Partial<Record<ChannelId, string>> = {};
    for (const c of validChannels) cleanHandles[c] = (handles[c] ?? "").trim();
    const ordered = CHANNEL_ORDER.filter((c) => validChannels.includes(c));

    const base: ProspectThread = {
      id: thread?.id ?? `cv${Date.now()}`,
      contact,
      role: role.trim() || "—",
      company: company.trim() || "—",
      avatarTone: thread?.avatarTone ?? TONES[Math.floor(Math.random() * TONES.length)]!,
      channel: ordered[0]!,
      channels: ordered,
      handles: cleanHandles,
      last: thread?.last ?? "Nouvelle conversation",
      time:
        thread?.time ??
        new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      unread: thread?.unread ?? 0,
      stage: stage.trim() || "Nouveau",
      location: location.trim() || "—",
      tags: thread?.tags ?? [],
      notes: notes.trim(),
      messages: thread?.messages ?? {
        linkedin: [],
        whatsapp: [],
        email: [],
        sms: [],
        instagram: [],
      },
      favorite: thread?.favorite,
    };

    onCreate(base);
    toast.success(
      editing ? `Contact mis à jour : ${contact}` : `Conversation créée avec ${contact}`,
    );
    onClose();
  };

  /* ─────────────────────────────────────────────────────────────────── */
  /* Contenu commun (formulaire)                                         */
  /* ─────────────────────────────────────────────────────────────────── */
  const formFields = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prénom">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            maxLength={60}
            className={inputCls}
            placeholder="Marie"
          />
        </Field>
        <Field label="Nom">
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            maxLength={60}
            className={inputCls}
            placeholder="Durand"
          />
        </Field>

        <Field label="Entreprise">
          <SearchSelect
            value={company}
            onChange={setCompany}
            options={COMPANY_OPTIONS}
            placeholder="Naval Systems"
            searchPlaceholder="Rechercher une entreprise…"
            title="Entreprises suggérées"
            emptyMessage="Aucune entreprise ne correspond."
            allowCustom
            allowClear
          />
        </Field>

        <Field label="Poste">
          <SearchSelect
            value={role}
            onChange={setRole}
            options={ROLE_OPTIONS}
            placeholder="Directrice Achats"
            searchPlaceholder="Rechercher un poste…"
            title="Postes suggérés"
            emptyMessage="Aucun poste ne correspond."
            allowCustom
            allowClear
          />
        </Field>

        <Field label="Étape">
          <SearchSelect
            value={stage}
            onChange={setStage}
            options={STAGE_OPTIONS}
            placeholder="Nouveau"
            searchPlaceholder="Rechercher une étape…"
            title="Étapes du pipeline"
            emptyMessage="Aucune étape ne correspond."
            allowClear
          />
        </Field>
        <Field label="Localisation">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={80}
            className={inputCls}
            placeholder="Paris, France"
          />
        </Field>
      </div>

      <div>
        <p className="text-[11px] font-medium text-muted-foreground">Réseaux à activer</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CHANNEL_ORDER.map((c) => {
            const t = CHANNELS[c];
            const Icon = t.icon;
            const active = selected.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[11.5px] font-medium transition-colors active:opacity-80",
                )}
                style={{
                  borderColor: active ? t.accent : "var(--border)",
                  color: active ? t.accent : "var(--muted-foreground)",
                  backgroundColor: active
                    ? `color-mix(in oklab, ${t.accent} 12%, transparent)`
                    : "transparent",
                }}
              >
                {active ? <Check className="size-3" /> : <Icon className="size-3" />}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="space-y-3 rounded-xl border border-border bg-surface/40 p-3">
          {CHANNEL_ORDER.filter((c) => selected.includes(c)).map((c) => {
            const t = CHANNELS[c];
            const f = HANDLE_FIELDS[c];
            return (
              <Field key={c} label={`${t.label} — ${t.handleLabel}`}>
                <input
                  value={handles[c] ?? ""}
                  onChange={(e) => setHandles((h) => ({ ...h, [c]: e.target.value }))}
                  type={f.type}
                  maxLength={160}
                  className={inputCls}
                  placeholder={f.placeholder}
                />
              </Field>
            );
          })}
          <p className="text-[10.5px] text-muted-foreground">
            Les réseaux laissés sans identifiant sont ignorés.
          </p>
        </div>
      )}

      <Field label="Notes internes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          className={cn(inputCls, "resize-none")}
          placeholder="Contexte, signaux d'achat, historique…"
        />
      </Field>
    </>
  );

  /* ─────────────────────────────────────────────────────────────────── */
  /* Pied (boutons Annuler / Créer) — utilisé dans les deux versions     */
  /* ─────────────────────────────────────────────────────────────────── */
  const footer = (
    <>
      <span className="text-[11px] text-muted-foreground">
        {validChannels.length} canal{validChannels.length > 1 ? "aux" : ""} prêt
        {validChannels.length > 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onClose}
          className="min-h-10 rounded-md border border-border px-4 text-[12px] hover:bg-surface active:bg-surface/80"
        >
          Annuler
        </button>
        <button
          onClick={submit}
          className="min-h-10 rounded-md bg-foreground px-4 text-[12px] text-background hover:opacity-90 active:opacity-80"
        >
          {editing ? "Enregistrer" : "Créer la conversation"}
        </button>
      </div>
    </>
  );

  /* ─────────────────────────────────────────────────────────────────── */
  /* Version mobile — MobileSheet                                        */
  /* ─────────────────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <MobileSheet
        open={open}
        onOpenChange={(v) => !v && onClose()}
        title={editing ? "Modifier le contact" : "Nouvelle conversation"}
      >
        <div className="space-y-4 px-4 py-4">
          <p className="text-[11.5px] text-muted-foreground">
            {editing
              ? "Mettez à jour les informations du prospect."
              : "Créez le prospect et ouvrez ses canaux de discussion."}
          </p>
          {formFields}
        </div>

        <div
          className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-border bg-background px-4 py-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
        >
          {footer}
        </div>
      </MobileSheet>
    );
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /* Version desktop — modale centrée (comportement existant)            */
  /* ─────────────────────────────────────────────────────────────────── */
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:max-h-[88dvh] sm:max-w-lg">
        <header className="flex items-start gap-3 border-b border-border px-4 py-3 md:px-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <UserPlus className="size-4.5" strokeWidth={1.6} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg italic">
              {editing ? "Modifier le contact" : "Nouvelle conversation"}
            </h2>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
              {editing
                ? "Mettez à jour les informations du prospect."
                : "Créez le prospect et ouvrez ses canaux de discussion."}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="grid size-8 shrink-0 place-items-center rounded-md hover:bg-surface"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-5">{formFields}</div>

        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-4 py-3 md:px-5">
          {footer}
        </footer>
      </div>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
