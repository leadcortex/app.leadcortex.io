//frontend\components\settings\panels\AccountPanel.tsx
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Globe2,
  LogOut,
  Mail,
  Search,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { LoadingButton } from "../loading-button";
import { ConnectionsBlock } from "./ConnectionsBlock";
import {
  PanelIntro,
  PanelGroup,
  SettingsCard,
  Field,
  inputCls,
  SELECT_Z,
  fakeRequest,
} from "./primitives";

type TimezoneOption = { value: string; label: string; region: string };

const TIMEZONES: TimezoneOption[] = [
  { value: "Indian/Mauritius", label: "Maurice (UTC+4)", region: "Afrique / Océan Indien" },
  { value: "Africa/Casablanca", label: "Casablanca (UTC+1)", region: "Afrique" },
  { value: "Africa/Algiers", label: "Alger (UTC+1)", region: "Afrique" },
  { value: "Africa/Tunis", label: "Tunis (UTC+1)", region: "Afrique" },
  { value: "Africa/Dakar", label: "Dakar (UTC+0)", region: "Afrique" },
  { value: "Africa/Abidjan", label: "Abidjan (UTC+0)", region: "Afrique" },
  { value: "Africa/Lagos", label: "Lagos (UTC+1)", region: "Afrique" },
  { value: "Africa/Nairobi", label: "Nairobi (UTC+3)", region: "Afrique" },
  { value: "Europe/Paris", label: "Paris (UTC+1/+2)", region: "Europe" },
  { value: "Europe/London", label: "Londres (UTC+0/+1)", region: "Europe" },
  { value: "Europe/Brussels", label: "Bruxelles (UTC+1/+2)", region: "Europe" },
  { value: "Europe/Madrid", label: "Madrid (UTC+1/+2)", region: "Europe" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1/+2)", region: "Europe" },
  { value: "Europe/Rome", label: "Rome (UTC+1/+2)", region: "Europe" },
  { value: "Europe/Amsterdam", label: "Amsterdam (UTC+1/+2)", region: "Europe" },
  { value: "Europe/Lisbon", label: "Lisbonne (UTC+0/+1)", region: "Europe" },
  { value: "Europe/Zurich", label: "Zurich (UTC+1/+2)", region: "Europe" },
  { value: "Europe/Athens", label: "Athènes (UTC+2/+3)", region: "Europe" },
  { value: "America/New_York", label: "New York (UTC-5/-4)", region: "Amérique du Nord" },
  { value: "America/Chicago", label: "Chicago (UTC-6/-5)", region: "Amérique du Nord" },
  { value: "America/Denver", label: "Denver (UTC-7/-6)", region: "Amérique du Nord" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8/-7)", region: "Amérique du Nord" },
  { value: "America/Toronto", label: "Toronto (UTC-5/-4)", region: "Amérique du Nord" },
  { value: "America/Mexico_City", label: "Mexico (UTC-6)", region: "Amérique du Nord" },
  { value: "America/Sao_Paulo", label: "São Paulo (UTC-3)", region: "Amérique du Sud" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (UTC-3)", region: "Amérique du Sud" },
  { value: "Asia/Dubai", label: "Dubaï (UTC+4)", region: "Asie / Moyen-Orient" },
  { value: "Asia/Tel_Aviv", label: "Tel Aviv (UTC+2/+3)", region: "Asie / Moyen-Orient" },
  { value: "Asia/Riyadh", label: "Riyad (UTC+3)", region: "Asie / Moyen-Orient" },
  { value: "Asia/Istanbul", label: "Istanbul (UTC+3)", region: "Asie / Moyen-Orient" },
  { value: "Asia/Kolkata", label: "New Delhi (UTC+5:30)", region: "Asie" },
  { value: "Asia/Singapore", label: "Singapour (UTC+8)", region: "Asie" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (UTC+8)", region: "Asie" },
  { value: "Asia/Shanghai", label: "Shanghai (UTC+8)", region: "Asie" },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+9)", region: "Asie" },
  { value: "Asia/Seoul", label: "Séoul (UTC+9)", region: "Asie" },
  { value: "Australia/Sydney", label: "Sydney (UTC+10/+11)", region: "Océanie" },
  { value: "Australia/Melbourne", label: "Melbourne (UTC+10/+11)", region: "Océanie" },
  { value: "Pacific/Auckland", label: "Auckland (UTC+12/+13)", region: "Océanie" },
  { value: "UTC", label: "UTC", region: "Autres" },
];

function TimezoneSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const current = TIMEZONES.find((tz) => tz.value === value) ?? TIMEZONES[0]!;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TIMEZONES;
    return TIMEZONES.filter(
      (tz) =>
        tz.label.toLowerCase().includes(q) ||
        tz.value.toLowerCase().includes(q) ||
        tz.region.toLowerCase().includes(q),
    );
  }, [search]);

  const grouped = useMemo(() => {
    const map = new Map<string, TimezoneOption[]>();
    for (const tz of filtered) {
      const arr = map.get(tz.region) ?? [];
      arr.push(tz);
      map.set(tz.region, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm transition-all",
          "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
          "hover:border-primary/30",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Globe2 className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 truncate text-left">{current.label}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-[70] overflow-hidden rounded-lg border border-border bg-popover shadow-lg animate-in fade-in zoom-in-95"
        >
          <div className="relative border-b border-border/60 p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un fuseau (Paris, Tokyo…)"
              className="h-8 w-full rounded-md border border-transparent bg-surface/60 pl-8 pr-2 text-xs outline-none transition focus:border-border focus:bg-background focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto overscroll-contain p-1">
            {grouped.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                Aucun fuseau ne correspond.
              </p>
            )}
            {grouped.map(([region, items]) => (
              <div key={region} className="mb-1 last:mb-0">
                <p className="px-2 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
                  {region}
                </p>
                {items.map((tz) => {
                  const selected = tz.value === value;
                  return (
                    <button
                      key={tz.value}
                      type="button"
                      onClick={() => {
                        onChange(tz.value);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                        selected
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-surface",
                      )}
                    >
                      <span className="truncate">{tz.label}</span>
                      {selected && <Check className="size-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AvatarUploader({
  name,
  src,
  onChange,
}: {
  name: string;
  src: string | null;
  onChange: (next: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const readFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Format d'image requis (PNG, JPG, WebP…)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo.");
      return;
    }
    const url = URL.createObjectURL(file);
    onChange(url);
    toast.success("Photo de profil mise à jour");
  };

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) readFile(f);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) readFile(f);
      }}
      className={cn(
        "flex flex-col items-start gap-4 rounded-xl border border-dashed p-4 transition-colors sm:flex-row sm:items-center",
        dragging ? "border-primary bg-primary/5" : "border-border bg-surface/30",
      )}
    >
      <div className="relative shrink-0">
        {src ? (
          <img
            src={src}
            alt={name}
            className="size-20 rounded-2xl object-cover ring-1 ring-border"
          />
        ) : (
          <LetterAvatar name={name} size={80} shape="rounded" />
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Changer la photo de profil"
          className="absolute -bottom-1.5 -right-1.5 grid size-7 place-items-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Camera className="size-3.5" strokeWidth={1.8} />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Photo de profil</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
          Glissez un fichier ici, ou cliquez sur l'icône appareil photo. PNG, JPG ou WebP — 2 Mo
          max.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-1.5 size-3.5" /> Téléverser
          </Button>
          {src && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => onChange(null)}
            >
              <Trash2 className="mr-1.5 size-3.5" /> Retirer
            </Button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onInput} />
    </div>
  );
}

function LogoutBlock() {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const confirmLogout = () => {
    setConfirmOpen(false);
    toast.success("Vous avez été déconnecté");
    navigate({ to: "/login" });
  };

  return (
    <>
      <SettingsCard
        title="Déconnexion"
        description="Fermer la session sur cet appareil."
        icon={LogOut}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Vous serez redirigé vers la page de connexion. Vos données locales restent intactes.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="shrink-0"
          >
            <LogOut className="mr-1.5 size-3.5" /> Se déconnecter
          </Button>
        </div>
      </SettingsCard>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={confirmLogout}
        title="Se déconnecter ?"
        description="Votre travail enregistré restera disponible à votre prochaine connexion."
        confirmLabel="Se déconnecter"
        cancelLabel="Rester connecté"
        variant="default"
      />
    </>
  );
}

function purgeAllLocalData() {
  if (typeof window === "undefined") return;
  const PREFIXES = ["leadcortex", "lc.", "cortex."];
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && PREFIXES.some((p) => key.startsWith(p))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* Intentionally ignored. */
  }
  try {
    window.sessionStorage.clear();
  } catch {
    /* Intentionally ignored. */
  }
}

function DangerZoneBlock() {
  const { reset } = useAppStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const REQUIRED = "SUPPRIMER";
  const canConfirm = confirmText.trim().toUpperCase() === REQUIRED;

  useEffect(() => {
    if (!confirmOpen || deleting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen, deleting]);

  useEffect(() => {
    if (!confirmOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [confirmOpen]);

  const handleDelete = async () => {
    setDeleting(true);
    const t = toast.loading("Suppression du compte…");

    await fakeRequest(1100);

    purgeAllLocalData();

    try {
      reset();
    } catch {
      /* Intentionally ignored. */
    }

    toast.dismiss(t);
    toast.success("Compte supprimé", {
      description: "Vos données locales ont été effacées. Retour à l'accueil…",
    });

    setDeleting(false);
    setConfirmOpen(false);

    window.setTimeout(() => {
      window.location.href = "/";
    }, 700);
  };

  return (
    <>
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 px-1">
          <AlertTriangle className="size-3.5 shrink-0 text-destructive" strokeWidth={1.9} />
          <h4 className="text-xs font-semibold text-destructive">Zone de danger</h4>
          <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-destructive">
            Irréversible
          </span>
        </div>
        <div className="rounded-xl border border-destructive/40 bg-destructive/[0.03] p-4 md:p-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Supprime définitivement votre compte et efface{" "}
            <b className="text-foreground">toutes vos données locales</b> : prospects, entreprises,
            séquences, workflows, paramètres et préférences enregistrés dans ce navigateur. Utile
            pour retester l'expérience de première connexion.
          </p>

          <ul className="mt-3 space-y-1 text-[11px] text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Check className="size-3 shrink-0 text-destructive/70" />
              Store métier remis à zéro (leads, deals, workflows…)
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="size-3 shrink-0 text-destructive/70" />
              Préférences, onglets et réglages locaux purgés
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="size-3 shrink-0 text-destructive/70" />
              Redirection vers l'accueil après suppression
            </li>
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[10px] text-muted-foreground">
              Aucune copie de sauvegarde n'est conservée.
            </span>
            <button
              type="button"
              onClick={() => {
                setConfirmText("");
                setConfirmOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-background px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
            >
              <Trash2 className="size-3.5" /> Supprimer mon compte
            </button>
          </div>
        </div>
      </div>

      {confirmOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirmer la suppression du compte"
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-150"
              onClick={() => {
                if (!deleting) setConfirmOpen(false);
              }}
            />

            <div className="relative z-10 flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[0_40px_120px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 fade-in duration-150">
              <div className="shrink-0 px-5 pb-3 pt-5 md:px-6 md:pt-6">
                <div className="mb-1 flex items-center gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-destructive/12 text-destructive">
                    <AlertTriangle className="size-5" strokeWidth={1.9} />
                  </span>
                  <h2 className="text-base font-semibold md:text-lg">Supprimer votre compte ?</h2>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground md:text-sm">
                  Cette action est <b className="text-foreground">définitive</b>. Toutes vos données
                  locales (prospects, entreprises, séquences, workflows, réglages) seront effacées.
                  Vous serez redirigé vers l'accueil.
                </p>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-5 md:px-6">
                <div className="rounded-lg border border-destructive/30 bg-destructive/[0.05] p-3 text-[11px] text-destructive">
                  <p className="font-medium">Pour confirmer, tapez « {REQUIRED} »</p>
                  <p className="mt-0.5 text-destructive/80">
                    Cela évite les suppressions accidentelles.
                  </p>
                </div>

                <label className="block">
                  <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Confirmation
                  </span>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={REQUIRED}
                    autoFocus
                    disabled={deleting}
                    className={cn(
                      "mt-1.5 h-10 w-full rounded-lg border bg-background px-3 font-mono text-sm uppercase tracking-wider outline-none transition-all",
                      canConfirm
                        ? "border-destructive/50 focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                        : "border-input focus:border-primary focus:ring-2 focus:ring-primary/20",
                      deleting && "opacity-50",
                    )}
                  />
                </label>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border/70 px-5 py-4 md:flex-row md:justify-end md:px-6">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  disabled={deleting}
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-medium transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  Conserver mon compte
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={!canConfirm || deleting}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-destructive px-3.5 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  {deleting ? (
                    <>
                      <span className="size-3.5 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                      Suppression…
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-3.5" />
                      Supprimer définitivement
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export function AccountPanel() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("Jean");
  const [lastName, setLastName] = useState("Dupont");
  const [email, setEmail] = useState("utilisateur@leadcortex.io");
  const [phone, setPhone] = useState("+33 6 12 34 56 78");
  const [organization, setOrganization] = useState("Acme B2B");
  const [role, setRole] = useState("Founder");
  const [teamSize, setTeamSize] = useState("1-5");
  const [timezone, setTimezone] = useState("Europe/Paris");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [currency, setCurrency] = useState("EUR");
  const [saving, setSaving] = useState(false);

  const fullName = `${firstName} ${lastName}`.trim() || "Utilisateur";

  const save = async () => {
    setSaving(true);
    const t = toast.loading("Enregistrement du profil…");
    await fakeRequest(700);
    toast.dismiss(t);
    setSaving(false);
    toast.success("Profil enregistré");
  };

  return (
    <div className="space-y-8">
      <PanelIntro
        icon={UsersRound}
        title="Compte"
        description="Identité, organisation, comptes connectés et session. Modifiables à tout moment."
      />

      <PanelGroup label="Profil">
        <SettingsCard
          title="Identité"
          description="Ces informations apparaissent dans l'application."
          icon={UserRound}
        >
          <AvatarUploader name={fullName} src={avatar} onChange={setAvatar} />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Prénom">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputCls}
                placeholder="Jean"
                autoComplete="given-name"
              />
            </Field>
            <Field label="Nom">
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputCls}
                placeholder="Dupont"
                autoComplete="family-name"
              />
            </Field>
            <Field
              label="Email professionnel"
              icon={Mail}
              hint={email.includes("@") ? "Vérifié" : undefined}
            >
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(inputCls, "pr-9")}
                  placeholder="vous@entreprise.com"
                  autoComplete="email"
                />
                {email.includes("@") && (
                  <CheckCircle2 className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-success" />
                )}
              </div>
            </Field>
            <Field label="Téléphone" icon={UserRound}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
                placeholder="+33 6 12 34 56 78"
                autoComplete="tel"
              />
            </Field>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Organisation"
          description="Ces informations apparaissent sur vos factures."
          icon={Building2}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom de l'organisation">
              <input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className={inputCls}
                placeholder="Acme B2B"
                autoComplete="organization"
              />
            </Field>
            <Field label="Votre rôle">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-10 w-full border-input bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className={SELECT_Z}>
                  {[
                    "Founder",
                    "CEO",
                    "CTO",
                    "Sales Manager",
                    "Growth",
                    "Marketing",
                    "Customer Success",
                    "Autre",
                  ].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Taille de l'équipe">
              <Select value={teamSize} onValueChange={setTeamSize}>
                <SelectTrigger className="h-10 w-full border-input bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className={SELECT_Z}>
                  {[
                    { value: "solo", label: "Solo" },
                    { value: "1-5", label: "1 – 5 personnes" },
                    { value: "6-20", label: "6 – 20 personnes" },
                    { value: "21-50", label: "21 – 50 personnes" },
                    { value: "50+", label: "50+ personnes" },
                  ].map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Région & préférences"
          description="Format des dates, devise et fuseau horaire."
          icon={Globe2}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Fuseau horaire" hint="Utilisé pour les envois programmés">
                <TimezoneSelect value={timezone} onChange={setTimezone} />
              </Field>
            </div>
            <Field label="Format de date">
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger className="h-10 w-full border-input bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className={SELECT_Z}>
                  {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Devise">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-10 w-full border-input bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className={SELECT_Z}>
                  {[
                    { value: "EUR", label: "Euro (€)" },
                    { value: "USD", label: "Dollar US ($)" },
                    { value: "GBP", label: "Livre sterling (£)" },
                    { value: "CHF", label: "Franc suisse (CHF)" },
                    { value: "MUR", label: "Roupie mauricienne (Rs)" },
                  ].map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </SettingsCard>
      </PanelGroup>

      <PanelGroup label="Connexions">
        <ConnectionsBlock />
      </PanelGroup>

      <PanelGroup
        label="Session & zone à risque"
        description="Actions irréversibles concernant votre compte et votre session."
      >
        <LogoutBlock />
        <DangerZoneBlock />
      </PanelGroup>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
        <LoadingButton
          size="sm"
          loading={saving}
          loadingText="Enregistrement…"
          onClick={() => void save()}
        >
          Enregistrer les modifications
        </LoadingButton>
      </div>
    </div>
  );
}
