// frontend/components/hub/saved-view.tsx

import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bookmark,
  Building2,
  Mail,
  MapPin,
  Phone,
  Radio,
  Search,
  Star,
  Users,
  X,
} from "@/components/icons";
import { toast } from "sonner";
import { useAppStore } from "@/lib/state/store";
import { Badge } from "@/components/common/ui-primitives";
import { ProgressCapsule } from "@/components/ui/capsule-progress";
import { CompanyAvatar, CompanyLogo } from "@/components/company-logo";
import { stageLabels } from "@/lib/people/preferences";
import { intentLabels } from "@/lib/companies/preferences";
import { cn } from "@/lib/core/utils";

type SubTab = "people" | "companies";

export function SavedView() {
  const navigate = useNavigate();
  const {
    leads,
    companies,
    toggleLeadSaved,
    toggleCompanySaved,
    addActivity,
  } = useAppStore();

  const [tab, setTab] = useState<SubTab>("people");
  const [query, setQuery] = useState("");

  const savedPeople = useMemo(() => leads.filter((l) => l.saved), [leads]);
  const savedCompanies = useMemo(() => companies.filter((c) => c.saved), [companies]);

  const filteredPeople = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return savedPeople;
    return savedPeople.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q) ||
        l.title?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q),
    );
  }, [savedPeople, query]);

  const filteredCompanies = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return savedCompanies;
    return savedCompanies.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.domain?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q),
    );
  }, [savedCompanies, query]);

  const removePerson = (id: string, name: string) => {
    toggleLeadSaved(id);
    addActivity("Retiré des favoris", name);
    toast.success(`${name} retiré des favoris`);
  };

  const removeCompany = (id: string, name: string) => {
    toggleCompanySaved(id);
    addActivity("Retiré des favoris", name);
    toast.success(`${name} retirée des favoris`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-border bg-surface/40 p-1">
          <button
            type="button"
            onClick={() => setTab("people")}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all",
              tab === "people"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Users className="size-3.5" />
            Prospects
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
                tab === "people"
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {savedPeople.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("companies")}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all",
              tab === "companies"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Building2 className="size-3.5" />
            Entreprises
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
                tab === "companies"
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {savedCompanies.length}
            </span>
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              tab === "people"
                ? "Rechercher un prospect sauvegardé…"
                : "Rechercher une entreprise sauvegardée…"
            }
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-surface"
              aria-label="Effacer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {tab === "people" ? (
        filteredPeople.length === 0 ? (
          <EmptySaved
            icon={Users}
            title="Aucun prospect sauvegardé"
            description="Cliquez sur le signet d'un prospect pour le retrouver ici."
            cta={{
              label: "Explorer les prospects",
              onClick: () => navigate({ to: "/app/people" }),
            }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPeople.map((lead) => (
              <article
                key={lead.id}
                className="group relative rounded-2xl border border-border bg-background p-3 transition-all hover:border-primary/40 hover:shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--primary)_30%,transparent)]"
              >
                <button
                  type="button"
                  onClick={() => removePerson(lead.id, lead.name)}
                  aria-label="Retirer des favoris"
                  className="absolute right-2 top-2 z-10 grid size-7 place-items-center rounded-lg text-primary transition-colors hover:bg-primary/10"
                >
                  <Bookmark className="size-3.5 fill-primary" />
                </button>

                <Link
                  to="/app/people/$id"
                  params={{ id: lead.id }}
                  className="flex items-start gap-2.5 pr-8"
                >
                  {lead.avatarUrl ? (
                    <img
                      src={lead.avatarUrl}
                      alt=""
                      className="size-11 shrink-0 rounded-full object-cover ring-1 ring-border"
                    />
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-sm font-semibold text-primary">
                      {lead.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium group-hover:text-primary transition-colors">
                        {lead.name}
                      </span>
                      {typeof lead.score === "number" && (
                        <span
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                            lead.score >= 9
                              ? "bg-primary/15 text-primary"
                              : lead.score >= 8
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {lead.score.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {lead.title}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {lead.companyLogoUrl ? (
                        <img
                          src={lead.companyLogoUrl}
                          alt=""
                          className="size-3.5 shrink-0 rounded object-cover ring-1 ring-border/50"
                        />
                      ) : (
                        <CompanyLogo name={lead.company} size={14} className="shrink-0" />
                      )}
                      <span className="truncate text-[11px] text-muted-foreground">
                        {lead.company}
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge
                    tone={
                      lead.stage === "won"
                        ? "success"
                        : lead.stage === "meeting"
                          ? "primary"
                          : "muted"
                    }
                  >
                    {stageLabels[lead.stage ?? "new"] ?? "Nouveau"}
                  </Badge>
                  {lead.signal && (
                    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning">
                      <Radio className="size-2.5 shrink-0" />
                      <span className="truncate">{lead.signal}</span>
                    </span>
                  )}
                </div>

                {typeof lead.score === "number" && (
                  <div className="mt-2">
                    <ProgressCapsule value={lead.score} max={10} size="sm" />
                  </div>
                )}

                <div className="mt-2 flex items-center gap-1">
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-[10px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                      title={lead.email}
                    >
                      <Mail className="size-3" /> Email
                    </a>
                  )}
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-[10px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                      title={lead.phone}
                    >
                      <Phone className="size-3" /> Appeler
                    </a>
                  )}
                  <Link
                    to="/app/people/$id"
                    params={{ id: lead.id }}
                    className="ml-auto inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2 text-[10px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Ouvrir →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )
      ) : filteredCompanies.length === 0 ? (
        <EmptySaved
          icon={Building2}
          title="Aucune entreprise sauvegardée"
          description="Cliquez sur le signet d'une entreprise pour la retrouver ici."
          cta={{
            label: "Explorer les entreprises",
            onClick: () => navigate({ to: "/app/companies" }),
          }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <article
              key={company.id}
              className="group relative rounded-2xl border border-border bg-background p-3 transition-all hover:border-primary/40 hover:shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--primary)_30%,transparent)]"
            >
              <button
                type="button"
                onClick={() => removeCompany(company.id, company.name)}
                aria-label="Retirer des favoris"
                className="absolute right-2 top-2 z-10 grid size-7 place-items-center rounded-lg text-primary transition-colors hover:bg-primary/10"
              >
                <Bookmark className="size-3.5 fill-primary" />
              </button>

              <Link
                to="/app/companies/$id"
                params={{ id: company.id }}
                className="flex items-start gap-2.5 pr-8"
              >
                <CompanyAvatar
                  name={company.name}
                  domain={company.domain}
                  logoUrl={company.companyLogoUrl}
                  size={44}
                  shape="rounded"
                />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium group-hover:text-primary transition-colors">
                    {company.name}
                  </span>
                  <p className="truncate text-[11px] text-muted-foreground font-mono">
                    {company.domain || "—"}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    {company.location && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="size-2.5 shrink-0" />
                        {company.location}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              <div className="mt-2 flex flex-wrap gap-1">
                <Badge
                  tone={
                    company.intent === "hot"
                      ? "primary"
                      : company.intent === "warm"
                        ? "warning"
                        : "muted"
                  }
                >
                  {intentLabels[company.intent] ?? company.intent}
                </Badge>
                {company.industry && company.industry !== "—" && (
                  <Badge tone="muted">{company.industry}</Badge>
                )}
              </div>

              <div className="mt-2 flex items-center gap-1">
                {company.domain && (
                  <a
                    href={`https://${company.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-[10px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                  >
                    Site
                  </a>
                )}
                <Link
                  to="/app/companies/$id"
                  params={{ id: company.id }}
                  className="ml-auto inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2 text-[10px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Ouvrir →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptySaved({
  icon: Icon,
  title,
  description,
  cta,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  cta: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/20 p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-5" strokeWidth={1.8} />
      </span>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">{description}</p>
      <button
        type="button"
        onClick={cta.onClick}
        className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Star className="size-3.5" /> {cta.label}
      </button>
    </div>
  );
}
