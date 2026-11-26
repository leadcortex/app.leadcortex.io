// frontend/routes/app/sequences/new.tsx

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/ui-primitives";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Mail,
  Phone,
  Linkedin,
  Clock,
  Sparkles,
  ChevronDown,
} from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useAppStore, DEFAULT_SEQUENCE_SETTINGS, type SequenceSettings } from "@/lib/state/store";
import { CustomSelect } from "@/components/common/custom-select";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { CreateFormSkeleton } from "@/components/skeletons";
import { generateSequence } from "@/lib/ai/sequence.functions";

export const Route = createFileRoute("/app/sequences/new")({
  head: () => ({
    meta: [
      { title: "Nouvelle séquence · LeadCortex" },
      {
        name: "description",
        content:
          "Créez une séquence de prospection : emails, messages LinkedIn et appels, avec horaires d'envoi et brouillon proposé par l'IA.",
      },
      { property: "og:title", content: "Nouvelle séquence · LeadCortex" },
      {
        property: "og:description",
        content: "Créez une séquence de prospection par email, LinkedIn et téléphone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  pendingComponent: () => <CreateFormSkeleton />,
  component: NewSequencePage,
});

type Step = {
  id: string;
  type: "email" | "linkedin" | "call";
  content: string;
  subject?: string;
  delay: number;
};

const STEP_TYPES = [
  { value: "email", label: "Email", icon: Mail },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "call", label: "Appel", icon: Phone },
] as const;

const DEFAULT_DELAYS = [0, 1, 2, 3, 4, 5, 7, 10, 14, 21, 30];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const TONES = [
  { value: "direct", label: "Direct" },
  { value: "consultatif", label: "Consultatif" },
  { value: "chaleureux", label: "Chaleureux" },
  { value: "technique", label: "Technique" },
];

function Section({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="space-y-6 rounded-xl border border-border bg-card p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function NewSequencePage() {
  const navigate = useNavigate();
  const { addActivity, addSequence } = useAppStore();
  const runGenerate = useServerFn(generateSequence);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("Prise de rendez-vous");
  const [audience, setAudience] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState<"draft" | "active">("draft");

  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("direct");
  const [aiStepCount, setAiStepCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [settings, setSettings] = useState<SequenceSettings>({ ...DEFAULT_SEQUENCE_SETTINGS });

  const [steps, setSteps] = useState<Step[]>([
    { id: crypto.randomUUID(), type: "email", content: "", subject: "", delay: 0 },
  ]);

  const setSetting = <K extends keyof SequenceSettings>(key: K, value: SequenceSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const toggleDay = (day: string) =>
    setSettings((s) => ({
      ...s,
      sendDays: s.sendDays.includes(day)
        ? s.sendDays.filter((d) => d !== day)
        : [...s.sendDays, day],
    }));

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "email",
        content: "",
        subject: "",
        delay: prev.length > 0 ? prev[prev.length - 1].delay + 1 : 0,
      },
    ]);
  };

  const removeStep = (id: string) => {
    if (steps.length <= 1) {
      toast.error("La séquence doit contenir au moins une étape.");
      return;
    }
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStep = <K extends keyof Step>(id: string, field: K, value: Step[K]) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Décrivez votre offre et votre cible pour générer la séquence.");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await runGenerate({
        data: {
          prompt: aiPrompt.trim(),
          audience: audience.trim() || undefined,
          tone: aiTone,
          stepCount: aiStepCount,
        },
      });
      const gen = res.sequence;
      if (!name.trim()) setName(gen.name);
      if (!description.trim()) setDescription(gen.description);
      if (gen.objective) setObjective(gen.objective);
      if (!audience.trim()) setAudience(gen.audience);
      if (!tagsInput.trim()) setTagsInput(gen.tags.join(", "));
      setSteps(
        gen.steps.map((s) => ({
          id: crypto.randomUUID(),
          type: s.type,
          subject: s.subject,
          content: s.content,
          delay: s.delay,
        })),
      );
      if (res.source === "ai") {
        toast.success(`Séquence générée : ${gen.steps.length} étapes proposées`);
      } else {
        toast.warning(res.message || "IA indisponible : modèle par défaut appliqué.");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "La génération IA a échoué.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Donnez un nom à la séquence.");
      return;
    }

    const invalidStep = steps.find(
      (s) => !s.content.trim() || (s.type === "email" && !s.subject?.trim()),
    );
    if (invalidStep) {
      toast.error(`L'étape ${steps.indexOf(invalidStep) + 1} est incomplète.`);
      return;
    }

    if (settings.sendDays.length === 0) {
      toast.error("Sélectionnez au moins un jour d'envoi dans les options avancées.");
      return;
    }

    setIsSubmitting(true);

    try {
      addSequence({
        name: name.trim(),
        description: description.trim(),
        objective,
        audience: audience.trim(),
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status,
        stepsDetail: steps,
        settings,
      });

      addActivity("Séquence créée", name.trim());
      toast.success(`Séquence "${name.trim()}" créée`);

      navigate({ to: "/app/sequences" });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "La création a échoué.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (steps.some((s) => s.content.trim() || s.subject?.trim()) || name.trim()) {
      if (!confirm("Voulez-vous vraiment quitter ? Les modifications seront perdues.")) {
        return;
      }
    }
    navigate({ to: "/app/sequences" });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(steps);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setSteps(items);
  };

  const durationDays = steps.reduce((max, s) => Math.max(max, s.delay), 0);

  return (
    <div className="max-w-3xl">
      <button
        type="button"
        onClick={handleCancel}
        className="mb-6 inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Séquences
      </button>
      <PageHeader eyebrow="Séquences" title="Nouvelle séquence." />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4 rounded-xl bg-surface/50 p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="size-4 text-primary" /> Partir d'un brouillon IA
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Décrivez votre offre et votre cible. L'IA propose les étapes, les objets et les
                délais.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAiOpen((v) => !v)}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[13px] transition-colors hover:bg-surface/70"
            >
              {aiOpen ? "Masquer" : "Ouvrir"}
              <ChevronDown
                className={`size-3.5 transition-transform ${aiOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {aiOpen && (
            <div className="space-y-3">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                placeholder="Ex : Nous vendons une plateforme de maintenance prédictive aux directeurs industriels d'ETI françaises. Objectif : décrocher un audit de 30 minutes."
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
              <div className="flex flex-wrap items-center gap-2">
                <CustomSelect
                  label="Ton"
                  value={aiTone}
                  onChange={setAiTone}
                  options={TONES}
                  variant="pill"
                />
                <CustomSelect
                  label="Étapes"
                  value={String(aiStepCount)}
                  onChange={(v) => setAiStepCount(Number(v))}
                  options={[3, 4, 5, 6, 7].map((n) => ({
                    value: String(n),
                    label: `${n} étapes`,
                  }))}
                  variant="pill"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="ml-auto"
                >
                  {isGenerating ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Rédaction...
                    </>
                  ) : (
                    <>
                      <Sparkles /> Proposer les étapes
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Les étapes actuelles seront remplacées. Les champs déjà remplis sont gardés.
              </p>
            </div>
          )}
        </section>

        <Section title="Informations" subtitle="Elles servent à personnaliser les messages.">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[13px] font-medium">
                Nom de la séquence <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="CTO industrie, premier contact"
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[13px] font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="À quoi sert cette séquence ?"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium">Objectif</label>
              <CustomSelect
                label="Objectif"
                value={objective}
                onChange={setObjective}
                options={[
                  { value: "Prise de rendez-vous", label: "Prise de rendez-vous" },
                  { value: "Démonstration produit", label: "Démonstration produit" },
                  { value: "Réactivation", label: "Réactivation client" },
                  { value: "Événement / webinar", label: "Événement / webinar" },
                  { value: "Recrutement", label: "Recrutement" },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium">Statut à la création</label>
              <CustomSelect
                label="Statut"
                value={status}
                onChange={(v) => setStatus(v as "draft" | "active")}
                options={[
                  { value: "draft", label: "Brouillon" },
                  { value: "active", label: "Active" },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[13px] font-medium">
                Audience cible
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="CTO d'ETI industrielles, 200-2000 salariés"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[13px] font-medium">Tags</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="cold-outreach, industrie, Q1"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </Section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-4 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Étapes</h2>
              <p className="mt-1 text-[13px] text-muted-foreground tabular-nums">
                {steps.length} étape{steps.length > 1 ? "s" : ""} · durée {durationDays} jour
                {durationDays > 1 ? "s" : ""}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addStep}>
              <Plus /> Ajouter une étape
            </Button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="steps">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {steps.map((step, index) => (
                    <Draggable key={step.id} draggableId={step.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`border-t border-border bg-card py-4 first:border-t-0 ${
                            snapshot.isDragging
                              ? "rounded-lg border border-primary/30 px-4 shadow-float"
                              : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              {...provided.dragHandleProps}
                              className="mt-1 cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="size-4 text-muted-foreground" />
                            </div>

                            <div className="flex-1 space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="mr-1 text-[13px] font-medium">
                                  Étape {index + 1}
                                </span>

                                <CustomSelect
                                  label="Type"
                                  value={step.type}
                                  onChange={(value) =>
                                    updateStep(step.id, "type", value as Step["type"])
                                  }
                                  options={STEP_TYPES.map((t) => ({
                                    value: t.value,
                                    label: t.label,
                                    description: `Canal ${t.label}`,
                                  }))}
                                  variant="pill"
                                />

                                <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="size-3.5" />
                                  <CustomSelect
                                    label="Jours"
                                    value={String(step.delay)}
                                    onChange={(value) =>
                                      updateStep(step.id, "delay", Number(value))
                                    }
                                    options={DEFAULT_DELAYS.map((d) => ({
                                      value: String(d),
                                      label: `J${d > 0 ? `+${d}` : ""}`,
                                    }))}
                                    variant="pill"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeStep(step.id)}
                                  aria-label={`Supprimer l'étape ${index + 1}`}
                                  title="Supprimer l'étape"
                                  className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>

                              {step.type === "email" && (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={step.subject || ""}
                                    onChange={(e) => updateStep(step.id, "subject", e.target.value)}
                                    placeholder="Objet de l'email"
                                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                  <textarea
                                    value={step.content}
                                    onChange={(e) => updateStep(step.id, "content", e.target.value)}
                                    placeholder="Texte de l'email"
                                    rows={3}
                                    className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                </div>
                              )}

                              {step.type === "linkedin" && (
                                <textarea
                                  value={step.content}
                                  onChange={(e) => updateStep(step.id, "content", e.target.value)}
                                  placeholder="Message LinkedIn"
                                  rows={3}
                                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                              )}

                              {step.type === "call" && (
                                <textarea
                                  value={step.content}
                                  onChange={(e) => updateStep(step.id, "content", e.target.value)}
                                  placeholder="Script d'appel ou notes"
                                  rows={2}
                                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </section>

        <Section
          title="Options d'envoi"
          subtitle="Horaires, quota par jour, suivi et priorité."
          action={
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-[13px] transition-colors hover:bg-surface/70"
            >
              {advancedOpen ? "Masquer" : "Afficher"}
              <ChevronDown
                className={`size-3.5 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
              />
            </button>
          }
        >
          {advancedOpen && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium">Limite quotidienne</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={settings.dailyLimit}
                    onChange={(e) => setSetting("dailyLimit", Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium">Début d'envoi</label>
                  <input
                    type="time"
                    value={settings.sendWindowStart}
                    onChange={(e) => setSetting("sendWindowStart", e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium">Fin d'envoi</label>
                  <input
                    type="time"
                    value={settings.sendWindowEnd}
                    onChange={(e) => setSetting("sendWindowEnd", e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium">Jours d'envoi</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d) => {
                    const active = settings.sendDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          active
                            ? "bg-foreground text-background border-transparent"
                            : "border-border hover:bg-surface"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium">Fuseau horaire</label>
                  <CustomSelect
                    label="Fuseau"
                    value={settings.timezone}
                    onChange={(v) => setSetting("timezone", v)}
                    options={[
                      { value: "Europe/Paris", label: "Europe/Paris" },
                      { value: "Europe/London", label: "Europe/London" },
                      { value: "America/New_York", label: "America/New_York" },
                      { value: "Asia/Singapore", label: "Asia/Singapore" },
                    ]}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium">Priorité</label>
                  <CustomSelect
                    label="Priorité"
                    value={settings.priority}
                    onChange={(v) => setSetting("priority", v as SequenceSettings["priority"])}
                    options={[
                      { value: "low", label: "Basse" },
                      { value: "normal", label: "Normale" },
                      { value: "high", label: "Haute" },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {[
                  {
                    key: "stopOnReply" as const,
                    label: "Arrêter la séquence à la première réponse",
                  },
                  { key: "trackOpens" as const, label: "Suivre les ouvertures" },
                  { key: "trackClicks" as const, label: "Suivre les clics" },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className="flex cursor-pointer items-center justify-between gap-4 py-2"
                  >
                    <span className="text-sm">{opt.label}</span>
                    <input
                      type="checkbox"
                      checked={settings[opt.key]}
                      onChange={(e) => setSetting(opt.key, e.target.checked)}
                      className="size-4 accent-current"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </Section>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleCancel}>
            Annuler
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Création...
              </>
            ) : (
              <>
                <Save /> Créer la séquence
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
