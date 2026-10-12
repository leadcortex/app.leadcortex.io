//frontend\components\settings\panels\ConnectionsBlock.tsx
import { useState } from "react";
import { CheckCircle2, Link2, ShieldCheck, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";
import { LoadingButton } from "../loading-button";
import { SettingsCard, fakeRequest } from "./primitives";

type ConnectionStatus = "connected" | "disconnected";

type ConnectionProvider = {
  id: "google" | "microsoft" | "linkedin";
  name: string;
  description: string;
  status: ConnectionStatus;
  accountEmail?: string;
  scopes?: string;
};

const PROVIDER_BRANDING: Record<ConnectionProvider["id"], { initials: string; tint: string }> = {
  google: { initials: "G", tint: "bg-[#EA4335]/10 text-[#EA4335]" },
  microsoft: { initials: "M", tint: "bg-[#0078D4]/10 text-[#0078D4]" },
  linkedin: { initials: "in", tint: "bg-[#0A66C2]/10 text-[#0A66C2]" },
};

function ProviderBadge({ id }: { id: ConnectionProvider["id"] }) {
  const b = PROVIDER_BRANDING[id];
  return (
    <span
      className={cn("grid size-10 shrink-0 place-items-center rounded-xl font-semibold", b.tint)}
      aria-hidden
    >
      <span className="text-sm leading-none">{b.initials}</span>
    </span>
  );
}

export function ConnectionsContent() {
  const [connections, setConnections] = useState<
    Record<ConnectionProvider["id"], ConnectionProvider>
  >({
    google: {
      id: "google",
      name: "Google Workspace",
      description: "Connexion, Gmail, Agenda et Drive.",
      status: "connected",
      accountEmail: "utilisateur@leadcortex.io",
      scopes: "openid · email · profile · gmail.readonly",
    },
    microsoft: {
      id: "microsoft",
      name: "Microsoft 365",
      description: "Connexion et Outlook Mail.",
      status: "disconnected",
    },
    linkedin: {
      id: "linkedin",
      name: "LinkedIn",
      description: "Connexion rapide (identité uniquement).",
      status: "disconnected",
    },
  });
  const [pending, setPending] = useState<ConnectionProvider["id"] | null>(null);
  const [toDisconnect, setToDisconnect] = useState<ConnectionProvider | null>(null);

  const connect = async (id: ConnectionProvider["id"]) => {
    setPending(id);
    const t = toast.loading("Redirection vers le fournisseur…");
    await fakeRequest(900);
    toast.dismiss(t);
    setPending(null);
    toast.info("Connexion OAuth bientôt disponible", {
      description: `Le flux ${id} sera branché au backend dans une prochaine mise à jour.`,
    });
  };

  const confirmDisconnect = () => {
    if (!toDisconnect) return;
    const id = toDisconnect.id;
    setConnections((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: "disconnected", accountEmail: undefined, scopes: undefined },
    }));
    toast.success("Compte déconnecté");
    setToDisconnect(null);
  };

  return (
    <>
      <ul className="space-y-2.5">
        {Object.values(connections).map((c) => {
          const connected = c.status === "connected";
          const isPending = pending === c.id;
          return (
            <li
              key={c.id}
              className="flex flex-col gap-3 rounded-xl border border-border p-3.5 transition-colors hover:border-primary/20 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <ProviderBadge id={c.id} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{c.name}</p>
                    {connected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[9px] font-medium text-success">
                        <CheckCircle2 className="size-2.5" /> Connecté
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {connected && c.accountEmail ? c.accountEmail : c.description}
                  </p>
                  {connected && c.scopes && (
                    <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground/70">
                      {c.scopes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {connected ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info("Gestion des scopes bientôt disponible")}
                    >
                      Gérer
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setToDisconnect(c)}
                    >
                      <Unplug className="mr-1.5 size-3.5" /> Déconnecter
                    </Button>
                  </>
                ) : (
                  <LoadingButton
                    type="button"
                    size="sm"
                    loading={isPending}
                    loadingText="Connexion…"
                    onClick={() => void connect(c.id)}
                  >
                    Connecter
                  </LoadingButton>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface/40 p-3 text-[11px] text-muted-foreground">
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-primary" />
        <span>
          Vos tokens sont stockés chiffrés côté serveur. Aucun secret n'est conservé dans le
          navigateur. Vous pouvez révoquer un accès à tout moment.
        </span>
      </div>

      <ConfirmDialog
        open={!!toDisconnect}
        onOpenChange={(v) => !v && setToDisconnect(null)}
        onConfirm={confirmDisconnect}
        title={`Déconnecter ${toDisconnect?.name ?? ""} ?`}
        description="Vous pourrez reconnecter ce compte à tout moment. Les mails déjà importés resteront accessibles dans la page Emails."
        confirmLabel="Déconnecter"
        cancelLabel="Annuler"
        variant="destructive"
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  ConnectionsBlock — wrapper avec SettingsCard (titre extérieur)            */
/* -------------------------------------------------------------------------- */

export function ConnectionsBlock() {
  return (
    <SettingsCard
      title="Comptes externes"
      description="Ces comptes servent à la connexion et à l'accès à votre boîte mail."
      icon={Link2}
    >
      <ConnectionsContent />
    </SettingsCard>
  );
}
