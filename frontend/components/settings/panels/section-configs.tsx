// frontend/components/settings/panels/section-configs.tsx

import { useState } from "react";
import {
  LayoutGrid,
  LayoutList,
  List as ListIcon,
  Maximize2,
  Radio,
  Sparkles,
  Star,
  Tag as TagIcon,
  UserRound,
  Flame,
  Sun,
  Snowflake,
} from "@/components/icons";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/core/utils";
import {
  PAGE_SIZE_OPTIONS,
  readPeoplePreferences,
  writePeoplePreferences,
  type PeoplePreferences,
} from "@/lib/people/preferences";
import {
  readCompaniesPrefs,
  writeCompaniesPrefs,
  readDashboardPrefs,
  writeDashboardPrefs,
  type CompaniesSectionPrefs,
  type DashboardSectionPrefs,
} from "@/lib/section-display/preferences";
import { PanelGroup, SettingsCard, RowsCard, Row } from "./primitives";

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  columns = 2,
}: {
  value: T;
  options: { value: T; label: string; icon?: React.ComponentType<{ className?: string }> }[];
  onChange: (v: T) => void;
  columns?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        "grid gap-1 p-0.5 rounded-lg border border-border bg-surface/40",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-4",
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "px-2 py-1.5 text-[11px] rounded-md transition-colors inline-flex items-center justify-center gap-1",
              active
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon && <Icon className="size-3.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function PeopleSectionConfig() {
  const [prefs, setPrefs] = useState<PeoplePreferences>(() => readPeoplePreferences());
  const update = (patch: Partial<PeoplePreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      writePeoplePreferences(next);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PanelGroup label="Mise en page">
        <SettingsCard
          title="Densité et pagination"
        >
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Densité
              </p>
              <SegmentedControl
                value={prefs.density}
                onChange={(v) => update({ density: v })}
                options={[
                  { value: "comfortable", label: "Confort", icon: Maximize2 },
                  { value: "compact", label: "Compact", icon: ListIcon },
                ]}
              />
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Lignes par page
              </p>
              <SegmentedControl
                value={String(prefs.pageSize)}
                onChange={(v) => update({ pageSize: Number(v) })}
                options={PAGE_SIZE_OPTIONS.map((n) => ({
                  value: String(n),
                  label: String(n),
                }))}
                columns={4}
              />
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Vue par défaut
              </p>
              <SegmentedControl
                value={prefs.view}
                onChange={(v) => update({ view: v })}
                options={[
                  { value: "table", label: "Tableau", icon: LayoutList },
                  { value: "cards", label: "Cartes", icon: LayoutGrid },
                ]}
              />
            </div>
          </div>
        </SettingsCard>
      </PanelGroup>

      <PanelGroup label="Colonnes visibles">
        <RowsCard>
          <Row title="Signaux d'intention" description="Colonne signal (levée, recrutement…).">
            <Switch
              checked={prefs.showSignals}
              onCheckedChange={(v) => update({ showSignals: v })}
              aria-label="Afficher les signaux"
            />
          </Row>
          <Row title="Scores ICP" description="Score numérique avec capsule de progression.">
            <Switch
              checked={prefs.showScores}
              onCheckedChange={(v) => update({ showScores: v })}
              aria-label="Afficher les scores"
            />
          </Row>
          <Row title="Étapes pipeline" description="Badge d'étape (contacté, répondu, gagné…).">
            <Switch
              checked={prefs.showStages}
              onCheckedChange={(v) => update({ showStages: v })}
              aria-label="Afficher les étapes"
            />
          </Row>
        </RowsCard>
      </PanelGroup>

      <PanelGroup label="Affichage avancé">
        <RowsCard>
          <Row
            title="Encadrer chaque tableau"
            description="Chaque groupe de prospects est isolé dans son propre cadre."
          >
            <Switch
              checked={prefs.tablesInOwnContainer}
              onCheckedChange={(v) => update({ tablesInOwnContainer: v })}
              aria-label="Encadrer chaque tableau"
            />
          </Row>
          <Row
            title="Masquer les décideurs connus"
            description="La section suggestions de décideurs est cachée sur la liste."
          >
            <Switch
              checked={prefs.hideKnownPeople}
              onCheckedChange={(v) => update({ hideKnownPeople: v })}
              aria-label="Masquer les décideurs connus"
            />
          </Row>
        </RowsCard>
      </PanelGroup>

      <PanelGroup label="Tri & filtres">
        <SettingsCard
          title="Ordre par défaut"
        >
          <SegmentedControl
            value={prefs.sortBy}
            onChange={(v) => update({ sortBy: v })}
            options={[
              { value: "score", label: "Score" },
              { value: "name", label: "Nom" },
              { value: "manual", label: "Manuel" },
            ]}
            columns={3}
          />
        </SettingsCard>
      </PanelGroup>
    </div>
  );
}

export function CompaniesSectionConfig() {
  const [prefs, setPrefs] = useState<CompaniesSectionPrefs>(() => readCompaniesPrefs());
  const update = (patch: Partial<CompaniesSectionPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      writeCompaniesPrefs(next);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PanelGroup label="Mise en page">
        <SettingsCard
          title="Densité et pagination"
        >
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Densité
              </p>
              <SegmentedControl
                value={prefs.density}
                onChange={(v) => update({ density: v })}
                options={[
                  { value: "comfortable", label: "Confort", icon: Maximize2 },
                  { value: "compact", label: "Compact", icon: ListIcon },
                ]}
              />
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Lignes par page
              </p>
              <SegmentedControl
                value={String(prefs.pageSize)}
                onChange={(v) => update({ pageSize: Number(v) })}
                options={PAGE_SIZE_OPTIONS.map((n) => ({
                  value: String(n),
                  label: String(n),
                }))}
                columns={4}
              />
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Vue par défaut
              </p>
              <SegmentedControl
                value={prefs.view}
                onChange={(v) => update({ view: v })}
                options={[
                  { value: "table", label: "Tableau", icon: LayoutList },
                  { value: "cards", label: "Cartes", icon: LayoutGrid },
                ]}
              />
            </div>
          </div>
        </SettingsCard>
      </PanelGroup>

      <PanelGroup label="Filtres">
        <SettingsCard
          title="Intention par défaut"
        >
          <SegmentedControl
            value={prefs.defaultIntent}
            onChange={(v) => update({ defaultIntent: v })}
            options={[
              { value: "all", label: "Toutes" },
              { value: "hot", label: "Chaudes", icon: Flame },
              { value: "warm", label: "Tièdes", icon: Sun },
              { value: "cold", label: "Froides", icon: Snowflake },
            ]}
            columns={4}
          />
        </SettingsCard>
      </PanelGroup>
    </div>
  );
}

export function DashboardSectionConfig() {
  const [prefs, setPrefs] = useState<DashboardSectionPrefs>(() => readDashboardPrefs());
  const update = (patch: Partial<DashboardSectionPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      writeDashboardPrefs(next);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PanelGroup label="Blocs visibles">
        <RowsCard>
          <Row title="Pipeline rapide" description="Répartition des prospects par étape.">
            <Switch
              checked={prefs.showPipeline}
              onCheckedChange={(v) => update({ showPipeline: v })}
              aria-label="Afficher le pipeline"
            />
          </Row>
          <Row title="Priorités du jour" description="Prospects à haut score à contacter.">
            <Switch
              checked={prefs.showPriorities}
              onCheckedChange={(v) => update({ showPriorities: v })}
              aria-label="Afficher les priorités"
            />
          </Row>
          <Row title="Signaux chauds" description="Regroupement des signaux détectés.">
            <Switch
              checked={prefs.showSignals}
              onCheckedChange={(v) => update({ showSignals: v })}
              aria-label="Afficher les signaux chauds"
            />
          </Row>
          <Row title="Derniers enrichis" description="Grid des 5 dernières fiches enrichies.">
            <Switch
              checked={prefs.showRecent}
              onCheckedChange={(v) => update({ showRecent: v })}
              aria-label="Afficher les derniers enrichis"
            />
          </Row>
          <Row title="Tâches du jour" description="Actions à réaliser aujourd'hui.">
            <Switch
              checked={prefs.showTasks}
              onCheckedChange={(v) => update({ showTasks: v })}
              aria-label="Afficher les tâches"
            />
          </Row>
          <Row title="Rendez-vous du jour" description="Meetings planifiés aujourd'hui.">
            <Switch
              checked={prefs.showMeetings}
              onCheckedChange={(v) => update({ showMeetings: v })}
              aria-label="Afficher les rendez-vous"
            />
          </Row>
          <Row
            title="Décideurs connus"
            description="Section suggestions (masquée si ≥ 20 prospects)."
          >
            <Switch
              checked={prefs.showKnown}
              onCheckedChange={(v) => update({ showKnown: v })}
              aria-label="Afficher les décideurs connus"
            />
          </Row>
        </RowsCard>
      </PanelGroup>

      <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3 text-[11px] text-muted-foreground">
        <p className="inline-flex items-start gap-1.5">
          <Sparkles className="mt-px size-3.5 shrink-0 text-primary" />
          <span>
            Ces réglages contrôlent uniquement quels <b>blocs</b> apparaissent sur le dashboard.
            Chaque bloc reste cliquable et vous amène vers les fiches correspondantes.
          </span>
        </p>
      </div>
    </div>
  );
}

export function SectionConfigDispatcher({ section }: { section: string }) {
  switch (section) {
    case "people":
      return <PeopleSectionConfig />;
    case "companies":
      return <CompaniesSectionConfig />;
    case "dashboard":
      return <DashboardSectionConfig />;
    default:
      return (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucun réglage disponible pour cette section.
        </p>
      );
  }
}
