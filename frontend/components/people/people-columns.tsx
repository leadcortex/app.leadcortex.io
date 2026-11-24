// frontend/components/people/people-columns.tsx

import { Link } from "@tanstack/react-router";
import { 
  Bookmark, Building2, Globe, Languages, Link as LinkedinIcon, 
  Mail, MapPin, Phone, Search, Sparkles, Users, TrendingUp
} from "@/components/icons";
import { CompanyLogo } from "@/components/company-logo";
import { Badge } from "@/components/common/ui-primitives";
import { ProspectAvatarBadge } from "@/components/people/people-shared";
import { stageLabels, type PeoplePreferences } from "@/lib/people/preferences";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/core/utils";
import type { Column } from "@/components/common/data-table";

type ColumnActions = {
  onFindEmail: (id: string) => void;
  onFindPhone: (id: string) => void;
};

const isValid = (val: any) => {
  if (val === undefined || val === null) return false;
  const str = String(val).trim();
  return str !== "" && str !== "—" && str !== "-";
};

export function getPeopleColumns(
  prefs: PeoplePreferences,
  actions: ColumnActions,
  toggleLeadSaved: (id: string) => void
): Column<any>[] {
  const cols: Column<any>[] = [
    {
      key: "name",
      header: "Prospect",
      sortable: true,
      sticky: true,
      width: 320,
      accessor: (row) => (
        <Link
          to={`/app/people/$id`}
          params={{ id: row.id }}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-3 hover:text-primary transition-colors group min-w-0"
        >
          <ProspectAvatarBadge
            name={row.name || "?"}
            avatarUrl={row.avatarUrl}
            company={row.company || "?"}
            companyLogoUrl={row.companyLogoUrl}
            size={32}
          />
          <div className="min-w-0">
            <div className="font-semibold text-[13px] truncate group-hover:underline">
              {isValid(row.name) ? row.name : ""}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {isValid(row.title) ? row.title : ""}
            </div>
          </div>
        </Link>
      ),
    },
    {
      key: "phone",
      header: "Téléphone",
      icon: Phone,
      sortable: false,
      width: 180,
      accessor: (row) => (
        <div className="flex items-center gap-2 w-full">
          {isValid(row.phone) ? (
            <span className="font-mono text-[12px] truncate">{row.phone}</span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); actions.onFindPhone(row.id); }}
              className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline bg-primary/10 px-2.5 py-1 rounded-md"
            >
              <Sparkles className="size-3" /> Trouver
            </button>
          )}
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      icon: Mail,
      sortable: true,
      width: 280,
      accessor: (row) => (
        <div className="flex items-center justify-between w-full gap-2">
          {isValid(row.email) ? (
            <>
              <span className="font-mono text-[12px] truncate flex-1">{row.email}</span>
              <CopyButton 
                text={row.email} 
                size="xs" 
                className="shrink-0 opacity-40 hover:opacity-100 transition-opacity" 
              />
            </>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); actions.onFindEmail(row.id); }}
              className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline bg-primary/10 px-2.5 py-1 rounded-md"
            >
              <Search className="size-3" /> Trouver
            </button>
          )}
        </div>
      ),
    },
    {
      key: "linkedin",
      header: "LinkedIn",
      icon: LinkedinIcon,
      sortable: false,
      width: 160,
      accessor: (row) => {
        const hasLinkedin = isValid(row.linkedin);
        const url = hasLinkedin ? row.linkedin : `https://www.linkedin.com/in/${String(row.name || "").toLowerCase().replace(/\s+/g, "-")}`;
        return (
          <div className="flex items-center justify-between w-full gap-2">
            <a
              href={url} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-[12px] text-primary hover:underline truncate flex-1"
            >
              <LinkedinIcon className="size-3.5 shrink-0" /> Profil
            </a>
            <CopyButton 
              text={url} 
              size="xs" 
              className="shrink-0 opacity-40 hover:opacity-100 transition-opacity" 
            />
          </div>
        );
      },
    },
    {
      key: "company",
      header: "Entreprise",
      icon: Building2,
      sortable: true,
      width: 240,
      accessor: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          {row.companyLogoUrl ? (
            <img src={row.companyLogoUrl} alt={row.company || "?"} className="size-6 shrink-0 rounded object-cover bg-background ring-1 ring-border/50" />
          ) : (
            <CompanyLogo name={row.company || "?"} size={24} className="shrink-0 rounded" />
          )}
          <span className="truncate text-[12px] font-medium">{isValid(row.company) ? row.company : ""}</span>
        </div>
      ),
    },
  ];

  if (prefs.showPoste) {
    cols.push({
      key: "title",
      header: "Poste",
      sortable: true,
      width: 200,
      accessor: (row) => <span className="text-[12px] truncate">{isValid(row.title) ? row.title : ""}</span>,
    });
  }

  if (prefs.showLangue) {
    cols.push({
      key: "language",
      header: "Langue",
      icon: Languages,
      sortable: false,
      width: 120,
      accessor: (row) => (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
          {isValid(row.language) ? row.language : ""}
        </span>
      ),
    });
  }

  if (prefs.showPays) {
    cols.push({
      key: "location",
      header: "Pays",
      icon: MapPin,
      sortable: true,
      width: 160,
      accessor: (row) => (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground truncate">
          {isValid(row.location) ? row.location : ""}
        </span>
      ),
    });
  }

  if (prefs.showSite) {
    cols.push({
      key: "website",
      header: "Site Web",
      icon: Globe,
      sortable: false,
      width: 200,
      accessor: (row) => {
        if (!isValid(row.website)) return null;
        return (
          <div className="flex items-center justify-between w-full gap-2">
            <a href={row.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-[12px] text-primary hover:underline truncate flex-1">
              Lien
            </a>
            <CopyButton 
              text={row.website} 
              size="xs" 
              className="shrink-0 opacity-40 hover:opacity-100 transition-opacity" 
            />
          </div>
        );
      },
    });
  }

  if (prefs.showCompanySize) {
    cols.push({
      key: "companySize",
      header: "Taille",
      icon: Users,
      sortable: false,
      width: 140,
      accessor: (row) => (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
          {isValid(row.companySize) ? row.companySize : ""}
        </span>
      ),
    });
  }

  if (prefs.showIndustry) {
    cols.push({
      key: "industry",
      header: "Secteur",
      sortable: true,
      width: 160,
      accessor: (row) => isValid(row.industry) ? <Badge tone="muted">{row.industry}</Badge> : null,
    });
  }

  if (prefs.showTrader) {
    cols.push({
      key: "trader",
      header: "Trader",
      icon: TrendingUp,
      sortable: false,
      width: 180,
      accessor: (row) => (
        <div className="flex flex-col gap-0.5">
           <span className="text-[11px] text-success flex items-center gap-1">
             <TrendingUp className="size-3" /> +2.4%
           </span>
           <span className="text-[11px] text-destructive flex items-center gap-1">
             <TrendingUp className="size-3 rotate-180" /> -1.2%
           </span>
        </div>
      ),
    });
  }

  if (prefs.showStages) {
    cols.push({
      key: "stage",
      header: "Étape",
      sortable: true,
      width: 150,
      accessor: (row) => {
        const label = stageLabels[row.stage ?? "new"];
        if (!isValid(label)) return null;
        return (
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium",
            row.stage === "won" ? "bg-success/12 text-success" 
            : row.stage === "meeting" || row.stage === "replied" ? "bg-primary/10 text-primary"
            : "bg-secondary text-muted-foreground"
          )}>
            {label}
          </span>
        );
      },
    });
  }

  if (prefs.showScores) {
    cols.push({
      key: "score",
      header: "Score",
      sortable: true,
      width: 100,
      accessor: (row) => (
        <span className={cn(
          "font-mono text-[12px] font-semibold tabular-nums",
          row.score >= 9 ? "text-primary" : row.score >= 6 ? "text-primary" : "text-muted-foreground"
        )}>
          {row.score != null ? row.score.toFixed(1) : ""}
        </span>
      ),
      className: "text-center",
      cellClassName: "text-center",
    });
  }

  cols.push({
    key: "actions",
    header: "",
    sortable: false,
    width: 80,
    accessor: (row) => (
      <div className="flex items-center justify-center">
        <button
          data-range-action="saved"
          data-range-active={String(!!row.saved)}
          onClick={(e) => { e.stopPropagation(); toggleLeadSaved(row.id); }}
          title={row.saved ? "Retirer des favoris" : "Sauvegarder"}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <Bookmark className={`size-4 ${row.saved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
        </button>
      </div>
    ),
    className: "w-20",
    cellClassName: "text-center",
  });

  return cols;
}
