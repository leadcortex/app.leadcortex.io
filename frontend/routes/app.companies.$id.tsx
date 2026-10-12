//frontend\routes\app.companies.$id.tsx
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui-primitives";
import { useAppStore } from "@/lib/store";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  DollarSign,
  Globe,
  Star,
  Edit,
  Trash2,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  Flame,
  Sun,
  Snowflake,
} from "lucide-react";
import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { DetailViewSkeleton } from "@/components/skeletons";
import { ActionMenu } from "@/components/action-menu";
import { EditRecordDialog } from "@/components/edit-record-dialog";
import { CompanyAvatar } from "@/components/ui/letter-avatar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/companies/$id")({
  head: () => ({ meta: [{ title: "Entreprise — LeadCortex" }] }),
  pendingComponent: () => <DetailViewSkeleton />,
  component: CompaniesDetailPage,
});

class DetailErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message?: string }
> {
  state = { hasError: false, message: undefined as string | undefined };

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown) {
    console.error("[CompanyDetail] Crash de rendu :", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 md:p-8 max-w-2xl">
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center">
            <AlertCircle className="size-10 mx-auto text-destructive mb-3" />
            <h2 className="font-display text-xl italic">Un problème est survenu</h2>
            <p className="text-muted-foreground text-xs mt-2">
              La fiche n'a pas pu être affichée correctement.
              {this.state.message ? ` (${this.state.message})` : ""}
            </p>
            <Link
              to="/app/companies"
              className="inline-flex items-center gap-2 mt-4 text-xs text-primary hover:underline"
            >
              <ArrowLeft className="size-3.5" /> Retour à la liste
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function CompaniesDetailPage() {
  return (
    <DetailErrorBoundary>
      <CompaniesDetailInner />
    </DetailErrorBoundary>
  );
}

function CompaniesDetailInner() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { companies, toggleCompanySaved, updateCompany, deleteCompany, addActivity } =
    useAppStore();

  const company = useMemo(
    () => companies.find((c) => String(c.id) === String(id)),
    [companies, id],
  );

  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(t);
  }, [id]);

  const [activeTab, setActiveTab] = useState<"overview" | "contacts" | "activity">("overview");
  const [editOpen, setEditOpen] = useState(false);

  if (!company && !ready) {
    return (
      <div className="p-4 md:p-8">
        <DetailViewSkeleton />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-4 md:p-8 text-center">
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
    );
  }

  const companyName = company.name ?? "Entreprise sans nom";
  const companyDomain = company.domain ?? "—";
  const companyIndustry = company.industry ?? "—";
  const companyLocation = company.location ?? "—";
  const companySize = company.size ?? "—";
  const companyRevenue = company.revenue ?? "—";
  const employees = Number(company.employees) || 0;
  const intent = (company.intent ?? "cold") as "hot" | "warm" | "cold";

  return (
    <div className="max-w-6xl">
      <Link
        to="/app/companies"
        className="inline-flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 md:mb-6"
      >
        <ArrowLeft className="size-3.5 md:size-4" /> Retour aux entreprises
      </Link>

      <div className="flex flex-wrap items-start gap-4 md:gap-6 mb-4 md:mb-8">
        <CompanyAvatar name={companyName} domain={company.domain} size={64} shape="rounded" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2 md:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl md:text-4xl italic break-words">
                {companyName}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground font-mono mt-0.5 md:mt-1">
                {companyDomain}
              </p>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1.5 md:mt-2 text-xs md:text-sm text-muted-foreground">
                <span className="flex items-center gap-1 md:gap-1.5">
                  <MapPin className="size-3.5 md:size-4" /> {companyLocation}
                </span>
                <span className="flex items-center gap-1 md:gap-1.5 hide-on-xs">
                  <Users className="size-3.5 md:size-4" /> {employees.toLocaleString("fr-FR")}{" "}
                  employés
                </span>
                <span className="flex items-center gap-1 md:gap-1.5 hide-on-xs">
                  <DollarSign className="size-3.5 md:size-4" /> {companyRevenue}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <button
                onClick={() => {
                  toggleCompanySaved(company.id);
                  toast.success(company.saved ? "Retiré des favoris" : "Ajouté aux favoris");
                }}
                className={`p-1.5 md:p-2 rounded-lg border transition-colors ${
                  company.saved
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-surface"
                }`}
              >
                <Star className={`size-3.5 md:size-4 ${company.saved ? "fill-primary" : ""}`} />
              </button>
              <button
                type="button"
                title="Modifier l'entreprise"
                onClick={() => setEditOpen(true)}
                className="p-1.5 md:p-2 rounded-lg border border-border hover:bg-surface transition-colors"
              >
                <Edit className="size-3.5 md:size-4" />
              </button>
              <ActionMenu
                items={[
                  { label: "Modifier la fiche", icon: Edit, onSelect: () => setEditOpen(true) },
                  {
                    label: "Ouvrir le site web",
                    icon: Globe,
                    onSelect: () => {
                      if (!company.domain) return toast.error("Aucun domaine renseigné");
                      window.open(`https://${company.domain}`, "_blank", "noopener");
                    },
                  },
                  {
                    label: "Copier le domaine",
                    icon: FileText,
                    onSelect: () => {
                      if (!company.domain) return toast.error("Aucun domaine renseigné");
                      navigator.clipboard?.writeText(company.domain);
                      toast.success("Domaine copié");
                    },
                  },
                  {
                    label: company.saved ? "Retirer des favoris" : "Ajouter aux favoris",
                    icon: Star,
                    onSelect: () => {
                      toggleCompanySaved(company.id);
                      toast.success(company.saved ? "Retiré des favoris" : "Ajouté aux favoris");
                    },
                  },
                  {
                    label: "Supprimer l'entreprise",
                    icon: Trash2,
                    tone: "danger",
                    separatorBefore: true,
                    onSelect: () => {
                      if (!confirm(`Supprimer ${companyName} ?`)) return;
                      deleteCompany(company.id);
                      addActivity("Entreprise supprimée", companyName);
                      toast.success("Entreprise supprimée");
                      navigate({ to: "/app/companies" });
                    },
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <EditRecordDialog
        open={editOpen}
        title="Modifier l'entreprise"
        description="Mettez à jour les informations firmographiques."
        onClose={() => setEditOpen(false)}
        values={{
          name: companyName,
          domain: companyDomain,
          industry: companyIndustry,
          location: companyLocation,
          size: companySize,
          revenue: companyRevenue,
          employees,
          intent,
        }}
        fields={[
          { key: "name", label: "Nom", required: true },
          { key: "domain", label: "Domaine" },
          { key: "industry", label: "Secteur" },
          { key: "location", label: "Localisation" },
          { key: "size", label: "Taille" },
          { key: "revenue", label: "Chiffre d'affaires" },
          { key: "employees", label: "Employés", type: "number" },
          {
            key: "intent",
            label: "Intention",
            type: "select",
            options: [
              { value: "hot", label: "Chaude" },
              { value: "warm", label: "Tiède" },
              { value: "cold", label: "Froide" },
            ],
          },
        ]}
        onSave={(values) => {
          updateCompany(company.id, {
            ...(values as Record<string, unknown>),
            employees: Number(values.employees) || 0,
          });
          addActivity("Entreprise modifiée", String(values.name ?? companyName));
          toast.success("Entreprise mise à jour");
          setEditOpen(false);
        }}
      />

      <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-4 md:mb-8">
        <Badge tone={intent === "hot" ? "primary" : intent === "warm" ? "warning" : "muted"}>
          Intention {intent}
        </Badge>
        <Badge tone="muted">Taille {companySize}</Badge>
        <Badge tone="muted">{companyIndustry}</Badge>
        {company.saved && (
          <Badge tone="primary">
            <Star className="size-2.5 md:size-3 mr-0.5 md:mr-1 fill-primary" /> Favori
          </Badge>
        )}
      </div>

      <div className="border-b border-border mb-4 md:mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 md:gap-6 min-w-max">
          {(["overview", "contacts", "activity"] as const).map((tab) => {
            const labels = { overview: "Aperçu", contacts: "Contacts", activity: "Activité" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 md:pb-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
        {activeTab === "overview" && (
          <OverviewTab
            company={{
              name: companyName,
              industry: companyIndustry,
              location: companyLocation,
              employees,
              size: companySize,
              revenue: companyRevenue,
              domain: companyDomain,
              intent,
            }}
          />
        )}
        {activeTab === "contacts" && <ContactsTab companyName={companyName} />}
        {activeTab === "activity" && <ActivityTab />}
      </div>
    </div>
  );
}

type OverviewCompany = {
  name: string;
  industry: string;
  location: string;
  employees: number;
  size: string;
  revenue: string;
  domain: string;
  intent: "hot" | "warm" | "cold";
};

function OverviewTab({ company }: { company: OverviewCompany }) {
  const IntentIcon = company.intent === "hot" ? Flame : company.intent === "warm" ? Sun : Snowflake;

  const intentTone =
    company.intent === "hot"
      ? "bg-primary/10 text-primary"
      : company.intent === "warm"
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "bg-sky-500/10 text-sky-600 dark:text-sky-400";

  const intentLabel = company.intent.charAt(0).toUpperCase() + company.intent.slice(1);

  return (
    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
      <div className="rounded-xl border border-border bg-background p-4 md:p-6">
        <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3 md:mb-4">
          Informations générales
        </h3>
        <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
          <Row label="Industrie" value={company.industry} />
          <Row label="Localisation" value={company.location} />
          <Row label="Effectif" value={company.employees.toLocaleString("fr-FR")} />
          <Row label="Tranche" value={company.size} />
          <Row label="Revenu" value={company.revenue} />
          <Row label="Domaine" value={company.domain} mono />
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        <div className="rounded-xl border border-border bg-background p-4 md:p-6">
          <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3 md:mb-4">
            Intention
          </h3>
          <div className="flex items-center gap-3 md:gap-4">
            <div
              className={cn(
                "grid size-10 md:size-12 shrink-0 place-items-center rounded-full",
                intentTone,
              )}
              aria-hidden="true"
            >
              <IntentIcon className="size-5 md:size-6" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm md:text-base">{intentLabel}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                {company.intent === "hot"
                  ? "Fort signal d'achat"
                  : company.intent === "warm"
                    ? "Intérêt modéré"
                    : "Faible intention"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-4 md:p-6">
          <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3 md:mb-4">
            Actions rapides
          </h3>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            <button
              onClick={() => toast.info("Recherche des contacts...")}
              className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs border border-border rounded-lg hover:bg-surface transition-colors"
            >
              <Users className="size-3 md:size-3.5" /> Voir les contacts
            </button>
            <button
              onClick={() => toast.info("Analyse en cours...")}
              className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs border border-border rounded-lg hover:bg-surface transition-colors"
            >
              <Globe className="size-3 md:size-3.5" /> Visiter le site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span
        className={mono ? "font-mono text-[10px] md:text-xs text-right break-all" : "text-right"}
      >
        {value}
      </span>
    </div>
  );
}

function ContactsTab({ companyName }: { companyName: string }) {
  const { leads } = useAppStore();
  const contacts = leads.filter((l) => l.company === companyName);

  if (contacts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 md:p-12 text-center text-xs md:text-sm text-muted-foreground">
        <Users className="size-6 md:size-8 mx-auto mb-2 md:mb-3 text-muted-foreground/40" />
        Aucun contact identifié pour cette entreprise.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide table-scroll">
        <table className="w-full text-left text-xs md:text-sm min-w-[500px]">
          <thead className="bg-surface/50 text-muted-foreground text-[8px] md:text-[10px] uppercase tracking-[0.12em]">
            <tr>
              <th className="px-3 md:px-4 py-2 font-medium border-b border-border">Nom</th>
              <th className="px-3 md:px-4 py-2 font-medium border-b border-border">Poste</th>
              <th className="px-3 md:px-4 py-2 font-medium border-b border-border">Contact</th>
              <th className="px-3 md:px-4 py-2 font-medium border-b border-border">Score</th>
              <th className="px-3 md:px-4 py-2 font-medium border-b border-border"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts.map((c) => (
              <tr key={c.id} className="hover:bg-surface/40 transition-colors">
                <td className="px-3 md:px-4 py-2 md:py-3 font-medium text-xs md:text-sm">
                  {c.name}
                </td>
                <td className="px-3 md:px-4 py-2 md:py-3 text-muted-foreground text-[10px] md:text-xs">
                  {c.title}
                </td>
                <td className="px-3 md:px-4 py-2 md:py-3">
                  <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs">
                    {c.email && <Mail className="size-2.5 md:size-3 text-primary" />}
                    {c.phone && <Phone className="size-2.5 md:size-3 text-primary" />}
                    <span className="font-mono text-muted-foreground truncate max-w-[120px] md:max-w-none">
                      {c.email || "—"}
                    </span>
                  </div>
                </td>
                <td className="px-3 md:px-4 py-2 md:py-3 font-mono text-xs md:text-sm">
                  {typeof c.score === "number" ? c.score.toFixed(1) : "—"}
                </td>
                <td className="px-3 md:px-4 py-2 md:py-3">
                  <Link
                    to={`/app/people/$id`}
                    params={{ id: c.id }}
                    className="text-[10px] md:text-xs text-primary hover:underline"
                  >
                    Voir →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityTab() {
  const activities = [
    { id: "a1", label: "Visite du site", detail: "3 pages consultées", time: "il y a 2h" },
    { id: "a2", label: "Email envoyé", detail: "Séquence de prospection", time: "il y a 1j" },
    { id: "a3", label: "Signal détecté", detail: "Levée de fonds annoncée", time: "il y a 3j" },
  ];

  return (
    <div className="rounded-xl border border-border bg-background p-4 md:p-6">
      <div className="space-y-3 md:space-y-4">
        {activities.map((a) => (
          <div
            key={a.id}
            className="flex items-start gap-3 md:gap-4 pb-3 md:pb-4 border-b border-border last:border-0"
          >
            <div className="size-1.5 md:size-2 rounded-full bg-primary mt-1.5 md:mt-2 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium">{a.label}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">{a.detail}</p>
              <p className="text-[8px] md:text-[10px] text-muted-foreground/60 mt-0.5 md:mt-1">
                {a.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
