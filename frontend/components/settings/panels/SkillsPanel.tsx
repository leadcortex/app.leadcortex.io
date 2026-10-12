//frontend\components\settings\panels\SkillsPanel.tsx
import { useState } from "react";
import { toast } from "sonner";
import { PenLine, Plus, Sparkles, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";
import { SkillModal, SKILL_CATEGORIES, getCategoryMeta, type Skill } from "../skill-modal";
import { PanelIntro, PanelGroup, SettingsCard, fakeRequest } from "./primitives";

const DEFAULT_SKILLS: Skill[] = [
  {
    id: "sk_builtin_outreach",
    name: "Rédaction d'emails de prospection",
    description: "Ton direct, accroche personnalisée, un seul CTA.",
    category: "outreach",
    prompt:
      "Rédige un email de prospection court (max 90 mots).\n" +
      "• Ton direct, sans formule de politesse excessive.\n" +
      "• Accroche personnalisée basée sur le signal détecté.\n" +
      "• Un seul CTA à faible friction.",
    enabled: true,
    builtin: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "sk_builtin_icp",
    name: "Qualification ICP",
    description: "Évaluation d'un prospect par rapport à votre cible.",
    category: "qualification",
    prompt:
      "Évalue ce prospect par rapport à notre ICP et retourne un score sur 10 avec une justification en 3 puces.",
    enabled: true,
    builtin: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "sk_builtin_meeting",
    name: "Préparation de meeting",
    description: "Résumé, points clés et objections anticipées.",
    category: "research",
    prompt:
      "Prépare une fiche meeting : contexte du compte, signaux récents, objections probables, questions de découverte et prochaines étapes.",
    enabled: true,
    builtin: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function SkillCard({
  skill,
  onToggle,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  skill: Skill;
  onToggle: (next: boolean) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const meta = getCategoryMeta(skill.category);
  const CategoryIcon = meta.icon;

  return (
    <article className="group relative flex flex-col gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg",
            skill.enabled ? "bg-primary/10" : "bg-surface",
          )}
        >
          <CategoryIcon
            className={cn("size-4", skill.enabled ? meta.color : "text-muted-foreground")}
            strokeWidth={1.8}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">{skill.name}</p>
            {skill.builtin ? (
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                Intégrée
              </span>
            ) : (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-primary">
                Personnalisée
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {skill.description || "Aucune description."}
          </p>
        </div>
        <div className="shrink-0">
          <Switch
            checked={skill.enabled}
            onCheckedChange={onToggle}
            aria-label={`Activer la compétence ${skill.name}`}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full bg-surface/60 px-2 py-0.5">
          <CategoryIcon className="size-2.5" />
          {meta.label}
        </span>
        {skill.file && (
          <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-surface/60 px-2 py-0.5">
            <span className="truncate">{skill.file.name}</span>
          </span>
        )}
        {skill.prompt && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface/60 px-2 py-0.5">
            <Sparkles className="size-2.5" />
            {skill.prompt.length} car.
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 border-t border-border/60 pt-2.5">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <PenLine className="size-3" /> Modifier
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-3" /> Dupliquer
        </button>
        {!skill.builtin && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="size-3" /> Supprimer
          </button>
        )}
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*  SkillsPanel                                                               */
/* -------------------------------------------------------------------------- */

export function SkillsPanel() {
  const [skills, setSkills] = useState<Skill[]>(() => DEFAULT_SKILLS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [toDelete, setToDelete] = useState<Skill | null>(null);

  const enabledCount = skills.filter((s) => s.enabled).length;

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (skill: Skill) => {
    setEditing(skill);
    setModalOpen(true);
  };

  const handleSave = async (next: Skill) => {
    const t = toast.loading("Enregistrement…");
    await fakeRequest(400);
    setSkills((prev) => {
      const existing = prev.findIndex((s) => s.id === next.id);
      if (existing >= 0) {
        const copy = prev.slice();
        copy[existing] = next;
        return copy;
      }
      return [next, ...prev];
    });
    toast.dismiss(t);
    toast.success(editing ? "Compétence mise à jour" : "Compétence créée");
  };

  const handleDuplicate = (skill: Skill) => {
    const copy: Skill = {
      ...skill,
      id: `sk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: `${skill.name} (copie)`,
      builtin: false,
      createdAt: new Date().toISOString(),
    };
    setSkills((prev) => [copy, ...prev]);
    toast.success("Compétence dupliquée");
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    setSkills((prev) => prev.filter((s) => s.id !== toDelete.id));
    toast.success("Compétence supprimée");
    setToDelete(null);
  };

  const handleToggle = (id: string, next: boolean) => {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: next } : s)));
  };

  return (
    <div className="space-y-8">
      <PanelIntro
        icon={Wrench}
        title="Compétences"
        description="Capacités réutilisables que LeadCortex peut mobiliser dans ses tâches. Ajoutez vos propres prompts et fichiers de référence."
      />

      <PanelGroup label="Vue d'ensemble">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="mt-1 font-display text-xl">{skills.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Actives</p>
            <p className="mt-1 font-display text-xl text-primary">{enabledCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Intégrées</p>
            <p className="mt-1 font-display text-xl">{skills.filter((s) => s.builtin).length}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Personnalisées
            </p>
            <p className="mt-1 font-display text-xl">{skills.filter((s) => !s.builtin).length}</p>
          </div>
        </div>
      </PanelGroup>

      <PanelGroup label="Vos compétences">
        <SettingsCard
          title="Bibliothèque"
          description="Activez celles que l'IA peut mobiliser."
          actions={
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-3.5" /> Nouvelle
            </Button>
          }
        >
          {skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Wrench className="size-6" strokeWidth={1.5} />
              </span>
              <div>
                <p className="text-sm font-medium">Aucune compétence</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Créez votre première compétence pour guider l'IA sur vos cas d'usage.
                </p>
              </div>
              <Button size="sm" onClick={openCreate}>
                <Plus className="size-3.5" /> Créer une compétence
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {skills.map((s) => (
                <SkillCard
                  key={s.id}
                  skill={s}
                  onToggle={(next) => handleToggle(s.id, next)}
                  onEdit={() => openEdit(s)}
                  onDuplicate={() => handleDuplicate(s)}
                  onDelete={() => setToDelete(s)}
                />
              ))}
            </div>
          )}
        </SettingsCard>
      </PanelGroup>

      {skills.length > 0 && (
        <PanelGroup label="Catégories disponibles">
          <div className="rounded-xl border border-dashed border-border bg-surface/20 p-4">
            <div className="flex flex-wrap gap-2">
              {SKILL_CATEGORIES.map((c) => {
                const CatIcon = c.icon;
                return (
                  <span
                    key={c.value}
                    className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-[11px]"
                  >
                    <CatIcon className={cn("size-3", c.color)} />
                    {c.label}
                  </span>
                );
              })}
            </div>
          </div>
        </PanelGroup>
      )}

      <SkillModal
        open={modalOpen}
        onOpenChange={(v) => {
          setModalOpen(v);
          if (!v) setEditing(null);
        }}
        skill={editing}
        onSave={handleSave}
        onDelete={(id) => {
          const target = skills.find((s) => s.id === id);
          if (target) setToDelete(target);
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        onConfirm={confirmDelete}
        title={`Supprimer « ${toDelete?.name ?? ""} » ?`}
        description="Cette action est immédiate et définitive. Vous pouvez recréer une compétence à tout moment."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
      />
    </div>
  );
}
