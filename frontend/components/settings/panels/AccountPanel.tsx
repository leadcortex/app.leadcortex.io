// frontend/components/settings/panels/AccountPanel.tsx

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  LogOut,
  Mail,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { cn } from "@/lib/core/utils";
import { useAppStore } from "@/lib/state/store";
import { useCurrentUser, useUpdateCurrentUser } from "@/hooks/use-current-user";
import { LoadingButton } from "../loading-button";
import { ConnectionsBlock } from "./ConnectionsBlock";
import {
  PanelIntro,
  PanelGroup,
  SettingsCard,
  Field,
  inputCls,
  fakeRequest,
} from "./primitives";


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
          className="absolute -bottom-1.5 -right-1.5 grid size-7 place-items-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Camera className="size-3.5" strokeWidth={1.8} />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Photo de profil</p>
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
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Fermer la session sur cet appareil.
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
  }
  try {
    window.sessionStorage.clear();
  } catch {
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
          <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
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
            <span className="text-xs text-muted-foreground">
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
                  Cette action est <b className="text-foreground">définitive</b>. Toutes vos données seront effacées.
                </p>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-5 md:px-6">
                <div className="rounded-lg border border-destructive/30 bg-destructive/[0.05] p-3 text-[11px] text-destructive">
                  <p className="font-medium">Pour confirmer, tapez « {REQUIRED} »</p>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">
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
                      "mt-1.5 h-10 w-full rounded-lg border bg-background px-3 font-mono text-sm outline-none transition-colors",
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
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const [avatar, setAvatar] = useState<string | null>(currentUser.avatarUrl);
  const [firstName, setFirstName] = useState(currentUser.firstName);
  const [lastName, setLastName] = useState(currentUser.lastName);
  const [phone, setPhone] = useState("+33 6 12 34 56 78");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFirstName(currentUser.firstName);
    setLastName(currentUser.lastName);
    setAvatar(currentUser.avatarUrl);
  }, [currentUser.firstName, currentUser.lastName, currentUser.avatarUrl]);

  const fullName = `${firstName} ${lastName}`.trim() || currentUser.fullName;

  const save = async () => {
    setSaving(true);
    const t = toast.loading("Enregistrement du profil…");
    try {
      await updateCurrentUser({ firstName, lastName });
      await fakeRequest(700);
      toast.success("Profil enregistré");
    } catch {
      toast.error("Impossible d’enregistrer le profil. Veuillez réessayer.");
    } finally {
      toast.dismiss(t);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 md:space-y-12">
      <PanelIntro
        title="Compte"
        description="Votre nom et votre photo apparaissent dans l'app et dans les e-mails envoyés à vos prospects."
      />

      <PanelGroup label="Profil">
        <SettingsCard
          title="Identité"
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
              hint={currentUser.email ? "Compte Google vérifié" : undefined}
            >
              <div className="relative">
                <input
                  type="email"
                  value={currentUser.email}
                  readOnly
                  className={cn(inputCls, "pr-9")}
                  placeholder="vous@entreprise.com"
                  autoComplete="email"
                />
                {currentUser.email && (
                  <CheckCircle2 className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-success" />
                )}
              </div>
            </Field>
            <Field label="Téléphone">
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

      </PanelGroup>

      <PanelGroup label="Connexions">
        <ConnectionsBlock />
      </PanelGroup>

      <PanelGroup
        label="Session & zone à risque"
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
