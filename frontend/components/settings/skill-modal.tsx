//frontend\components\settings\skill-modal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  PenLine,
  Search,
  Send,
  Sparkles,
  Target,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FileDropZone, type DroppedFile } from "./file-drop-zone";

export type SkillCategory = "outreach" | "qualification" | "research" | "writing" | "custom";

export type Skill = {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  prompt: string;
  enabled: boolean;
  builtin?: boolean;
  file?: DroppedFile | null;
  createdAt?: string;
};

export const SKILL_CATEGORIES: {
  value: SkillCategory;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}[] = [
  {
    value: "outreach",
    label: "Prospection",
    description: "Emails, messages LinkedIn, relances.",
    icon: Send,
    color: "text-sky-600 dark:text-sky-400",
  },
  {
    value: "qualification",
    label: "Qualification",
    description: "Scoring ICP, priorisation des signaux.",
    icon: Target,
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    value: "research",
    label: "Recherche",
    description: "Enrichissement, vérification, veille.",
    icon: Search,
    color: "text-violet-600 dark:text-violet-400",
  },
  {
    value: "writing",
    label: "Rédaction",
    description: "Contenus, synthèses, résumés.",
    icon: PenLine,
    color: "text-amber-600 dark:text-amber-400",
  },
  {
    value: "custom",
    label: "Personnalisée",
    description: "Votre propre cas d'usage.",
    icon: Wand2,
    color: "text-primary",
  },
];

export function getCategoryMeta(cat: SkillCategory) {
  return SKILL_CATEGORIES.find((c) => c.value === cat) ?? SKILL_CATEGORIES[4]!;
}

export const SKILL_PROMPT_TEMPLATES: { id: string; label: string; value: string }[] = [
  { id: "empty", label: "Vide", value: "" },
  {
    id: "outreach-email",
    label: "Rédaction d'email de prospection",
    value:
      "Rédige un email de prospection court (max 90 mots).\n" +
      "• Ton direct, sans formule de politesse excessive.\n" +
      "• Accroche personnalisée basée sur le signal détecté.\n" +
      "• Une seule preuve chiffrée.\n" +
      "• Un CTA à faible friction (question fermée).\n" +
      "• Signe « [Votre prénom] ».",
  },
  {
    id: "qualification-icp",
    label: "Qualification ICP",
    value:
      "Évalue ce prospect par rapport à notre ICP :\n" +
      "• Secteur cible : SaaS B2B / Industrie.\n" +
      "• Effectif : 20 – 500 employés.\n" +
      "• Zone : France / UE.\n" +
      "• Signaux recherchés : levée de fonds, recrutement, expansion.\n" +
      "Retourne un score sur 10 avec justification en 3 puces.",
  },
  {
    id: "meeting-prep",
    label: "Préparation de meeting",
    value:
      "Prépare une fiche meeting en 5 blocs :\n" +
      "1) Contexte du compte\n" +
      "2) Signaux récents\n" +
      "3) Objections probables (3) + réponses\n" +
      "4) Questions de découverte (5)\n" +
      "5) Prochaines étapes suggérées.",
  },
];

type SkillModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: Skill | null;
  onSave: (skill: Skill) => void;
  onDelete?: (id: string) => void;
};

export function SkillModal({ open, onOpenChange, skill, onSave, onDelete }: SkillModalProps) {
  const isEdit = Boolean(skill);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SkillCategory>("custom");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<DroppedFile | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [touched, setTouched] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  const templateRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setTemplateOpen(false);
    if (skill) {
      setName(skill.name);
      setDescription(skill.description);
      setCategory(skill.category);
      setPrompt(skill.prompt);
      setFile(skill.file ?? null);
      setEnabled(skill.enabled);
    } else {
      setName("");
      setDescription("");
      setCategory("custom");
      setPrompt("");
      setFile(null);
      setEnabled(true);
    }
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0 }));
  }, [open, skill]);

  useEffect(() => {
    if (!templateOpen) return;
    const onDown = (e: MouseEvent) => {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setTemplateOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTemplateOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [templateOpen]);

  const nameError = useMemo(() => {
    if (!touched) return null;
    if (!name.trim()) return "Le nom est requis.";
    if (name.trim().length < 2) return "Le nom doit contenir au moins 2 caractères.";
    return null;
  }, [name, touched]);

  const descriptionError = useMemo(() => {
    if (!touched) return null;
    if (description.length > 200) return "Maximum 200 caractères.";
    return null;
  }, [description, touched]);

  const canSubmit = name.trim().length >= 2 && description.length <= 200;

  const handleSubmit = () => {
    setTouched(true);
    if (!canSubmit) {
      toast.error("Veuillez corriger les erreurs avant d'enregistrer.");
      return;
    }

    const saved: Skill = {
      id: skill?.id ?? `sk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      description: description.trim(),
      category,
      prompt: prompt.trim(),
      enabled,
      builtin: skill?.builtin,
      file: file ?? undefined,
      createdAt: skill?.createdAt ?? new Date().toISOString(),
    };

    onSave(saved);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!skill || !onDelete) return;
    onDelete(skill.id);
    onOpenChange(false);
  };

  const currentCat = getCategoryMeta(category);
  const CategoryIcon = currentCat.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-[70] flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh] sm:max-w-2xl"
        aria-describedby={undefined}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/70 pb-3 pl-4 pr-14 pt-5 text-left md:pl-6 md:pr-14">
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" strokeWidth={1.8} />
            </span>
            <span className="truncate">
              {isEdit ? "Modifier la compétence" : "Nouvelle compétence"}
            </span>
          </DialogTitle>
          <DialogDescription className="line-clamp-2 text-xs md:text-sm">
            {isEdit
              ? "Ajustez le nom, la catégorie, le prompt ou le fichier associé."
              : "Décrivez ce que l'IA doit savoir faire, puis ajoutez éventuellement un fichier de référence."}
          </DialogDescription>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <span>
                  Nom de la compétence <span className="text-destructive">*</span>
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  {name.length}/60
                </span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 60))}
                onBlur={() => setTouched(true)}
                placeholder="Ex. : Rédaction d'emails de prospection"
                className={cn(
                  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-all",
                  "focus:border-primary focus:ring-2 focus:ring-primary/20",
                  nameError ? "border-destructive" : "border-input",
                )}
                autoFocus
              />
              {nameError && (
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-destructive">
                  <AlertCircle className="size-3" /> {nameError}
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Catégorie
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {SKILL_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = cat.value === category;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-surface/50",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-8 place-items-center rounded-lg",
                          active ? "bg-primary/10" : "bg-surface",
                        )}
                      >
                        <Icon
                          className={cn("size-4", active ? cat.color : "text-muted-foreground")}
                        />
                      </span>
                      <span
                        className={cn(
                          "text-[11px] leading-tight",
                          active ? "font-medium text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">{currentCat.description}</p>
            </div>

            <div>
              <label className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <span>Description courte</span>
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  {description.length}/200
                </span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                placeholder="Ex. : Ton direct, accroche personnalisée, un seul CTA."
                className={cn(
                  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-all",
                  "focus:border-primary focus:ring-2 focus:ring-primary/20",
                  descriptionError ? "border-destructive" : "border-input",
                )}
              />
              {descriptionError && (
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-destructive">
                  <AlertCircle className="size-3" /> {descriptionError}
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Fichier de compétence (optionnel)
              </p>
              <FileDropZone
                value={file}
                onChange={setFile}
                accept={[".json", ".md", ".markdown", ".txt"]}
                maxSize={2 * 1024 * 1024}
                label="Déposez un fichier de compétence ici"
                onReject={(reason, f) => {
                  if (reason === "type") {
                    toast.error(`Format non supporté : ${f.name}`, {
                      description: "Utilisez un fichier JSON, Markdown ou TXT.",
                    });
                  } else {
                    toast.error("Fichier trop volumineux", {
                      description: "La taille maximale est de 2 Mo.",
                    });
                  }
                }}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  <Sparkles className="size-3 text-primary" />
                  Prompt / instructions personnalisées
                </label>
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  {prompt.length} caractère{prompt.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground">
                  Instructions précises que l'IA suivra pour cette compétence.
                </p>

                <div ref={templateRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setTemplateOpen((v) => !v)}
                    aria-haspopup="listbox"
                    aria-expanded={templateOpen}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Sparkles className="size-3 text-primary" />
                    <span className="hidden sm:inline">Utiliser un template</span>
                    <span className="sm:hidden">Template</span>
                    <ChevronDown
                      className={cn("size-3 transition-transform", templateOpen && "rotate-180")}
                    />
                  </button>

                  {templateOpen && (
                    <div
                      role="listbox"
                      className="absolute right-0 top-[calc(100%+4px)] z-[80] w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-xl animate-in fade-in zoom-in-95"
                    >
                      <p className="border-b border-border/60 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Templates
                      </p>
                      {SKILL_PROMPT_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            setPrompt(tpl.value);
                            setTemplateOpen(false);
                            toast.success(`Template « ${tpl.label} » appliqué`);
                          }}
                          className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-surface"
                        >
                          <Check
                            className={cn(
                              "mt-0.5 size-3.5 shrink-0",
                              prompt === tpl.value ? "text-primary" : "opacity-0",
                            )}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{tpl.label}</span>
                            {tpl.value && (
                              <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                                {tpl.value.split("\n")[0]}
                              </span>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  "Ex. :\n" +
                  "• Ton direct, tutoiement, phrases courtes.\n" +
                  "• Maximum 90 mots.\n" +
                  "• Mentionner le signal détecté dès l'accroche.\n" +
                  "• Terminer par une question fermée."
                }
                className="mt-2 min-h-[130px] resize-y border-border bg-background text-xs leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface/30 p-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">Activer la compétence</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  L'IA pourra mobiliser cette compétence dans ses tâches.
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>
        </div>

        <DialogFooter className="flex shrink-0 flex-col-reverse gap-2 border-t border-border/70 bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6 md:py-4">
          {isEdit && onDelete && !skill?.builtin ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Supprimer
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={!canSubmit && touched}>
              <CategoryIcon className="size-3.5" />
              {isEdit ? "Enregistrer" : "Créer la compétence"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
