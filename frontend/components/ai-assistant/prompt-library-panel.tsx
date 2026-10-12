"use client";

/**
 * Panneau Bibliothèque de prompts.
 *
 * Trois zones :
 *  1. Actions rapides — « Enregistrer le brouillon courant », « Vider les
 *     récents ».
 *  2. Mes templates — liste filtrée par tag optionnel ; chaque ligne a un
 *     bouton « utiliser » et un menu discret « modifier / supprimer ».
 *  3. Récents — derniers prompts envoyés, dédupliqués ; un clic les remet
 *     dans le champ.
 *
 * Desktop : Dialog centré. Mobile : MobileSheet tiré du bas.
 *
 * L'édition d'un template s'effectue dans une sous-vue (même panneau) pour
 * éviter deux modales empilées.
 */
import { useEffect, useMemo, useState } from "react";
import {
  BookmarkPlus,
  Check,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  createTemplateId,
  deleteTemplate,
  filterTemplates,
  loadRecents,
  loadTemplates,
  previewBody,
  pushRecent,
  upsertTemplate,
  type PromptTemplate,
  type RecentPrompt,
} from "@/lib/prompt-library-store";

type View =
  | { kind: "list" }
  | { kind: "edit"; draft: PromptTemplate }
  | { kind: "create"; draft: PromptTemplate };

function emptyDraft(tag: string | null): PromptTemplate {
  const now = Date.now();
  return {
    id: createTemplateId(),
    title: "",
    body: "",
    tag,
    createdAt: now,
    updatedAt: now,
  };
}

export function PromptLibraryPanel({
  open,
  onOpenChange,
  currentDraft,
  currentCtx,
  onUsePrompt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Texte actuellement dans le composeur — pour « Enregistrer le brouillon ». */
  currentDraft: string;
  /** Contexte de page courant (utilisé comme tag par défaut). */
  currentCtx: string;
  /** Applique le texte choisi dans le composeur. */
  onUsePrompt: (text: string) => void;
}) {
  const isMobile = useIsMobile();
  const [view, setView] = useState<View>({ kind: "list" });
  const [query, setQuery] = useState("");
  const [onlyCurrentTag, setOnlyCurrentTag] = useState(false);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [recents, setRecents] = useState<RecentPrompt[]>([]);
  const [flashId, setFlashId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTemplates(loadTemplates());
    setRecents(loadRecents());
    setView({ kind: "list" });
    setQuery("");
    setOnlyCurrentTag(false);
  }, [open]);

  const filtered = useMemo(
    () => filterTemplates(templates, query, onlyCurrentTag ? currentCtx : null),
    [templates, query, onlyCurrentTag, currentCtx],
  );

  const filteredRecents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return recents;
    return recents.filter((r) => r.text.toLowerCase().includes(needle));
  }, [recents, query]);

  const saveDraft = (draft: PromptTemplate) => {
    const trimmedBody = draft.body.trim();
    if (!trimmedBody) return;
    const now = Date.now();
    const title =
      draft.title.trim() || previewBody(trimmedBody, 34) || "Sans titre";
    const next = upsertTemplate({
      ...draft,
      title,
      body: trimmedBody,
      updatedAt: now,
    });
    setTemplates(next);
    setView({ kind: "list" });
    setFlashId(draft.id);
    window.setTimeout(() => setFlashId(null), 900);
  };

  const remove = (id: string) => {
    const next = deleteTemplate(id);
    setTemplates(next);
  };

  const useNow = (text: string) => {
    onUsePrompt(text);
    pushRecent(text, currentCtx);
    onOpenChange(false);
  };

  const listBody = (
    <div className="flex min-h-0 flex-col gap-3">
      {/* Actions rapides */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={!currentDraft.trim()}
          onClick={() => {
            setView({
              kind: "create",
              draft: { ...emptyDraft(currentCtx), body: currentDraft },
            });
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11.5px] font-medium transition-colors hover:border-primary/40 hover:bg-secondary/40 disabled:opacity-40"
        >
          <BookmarkPlus className="size-3.5" strokeWidth={1.8} />
          Enregistrer le brouillon
        </button>
        <button
          type="button"
          onClick={() => {
            setView({ kind: "create", draft: emptyDraft(currentCtx) });
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11.5px] font-medium transition-colors hover:border-primary/40 hover:bg-secondary/40"
        >
          <Plus className="size-3.5" strokeWidth={1.8} />
          Nouveau template
        </button>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2 text-[12px] outline-none focus:border-primary/50"
          />
        </div>
        <button
          type="button"
          onClick={() => setOnlyCurrentTag((v) => !v)}
          aria-pressed={onlyCurrentTag}
          title={`Filtrer sur « ${currentCtx} »`}
          className={cn(
            "shrink-0 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors",
            onlyCurrentTag
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:text-foreground",
          )}
        >
          {currentCtx}
        </button>
      </div>

      {/* Templates */}
      <section className="flex flex-col gap-1">
        <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Mes templates · {filtered.length}
        </p>
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-secondary/15 px-3 py-6 text-center text-[11.5px] text-muted-foreground">
            Aucun template. Enregistre ton premier prompt ci-dessus.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {filtered.map((t) => {
              const flashed = flashId === t.id;
              return (
                <li
                  key={t.id}
                  className={cn(
                    "group flex items-start gap-2 rounded-xl border border-border bg-background px-2.5 py-2 transition-colors",
                    flashed ? "border-primary/60 bg-primary/10" : "hover:border-primary/40",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => useNow(t.body)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[12px] font-medium">{t.title}</span>
                      {t.tag && (
                        <span className="shrink-0 rounded-full bg-secondary/70 px-1.5 py-0.5 text-[9.5px] uppercase tracking-wider text-muted-foreground">
                          {t.tag}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                      {previewBody(t.body, 110)}
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setView({ kind: "edit", draft: t })}
                      aria-label={`Modifier ${t.title}`}
                      className="grid size-6 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-secondary/60 hover:text-foreground group-hover:opacity-100"
                    >
                      <Pencil className="size-3" strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(t.id)}
                      aria-label={`Supprimer ${t.title}`}
                      className="grid size-6 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="size-3" strokeWidth={1.8} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Récents */}
      {filteredRecents.length > 0 && (
        <section className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Récents · {filteredRecents.length}
            </p>
            <button
              type="button"
              onClick={() => {
                setRecents([]);
                // On vide aussi le stockage
                import("@/lib/prompt-library-store").then((m) => m.clearRecents());
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              Vider
            </button>
          </div>
          <ul className="flex flex-col gap-0.5">
            {filteredRecents.map((r, i) => (
              <li key={`${r.at}-${i}`}>
                <button
                  type="button"
                  onClick={() => useNow(r.text)}
                  className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-secondary/50"
                >
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  <span className="min-w-0 flex-1">
                    <span className="block line-clamp-1 text-[11.5px] text-foreground/90">
                      {r.text}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );

  const editBody = (draft: PromptTemplate, mode: "create" | "edit") => (
    <div className="flex min-h-0 flex-col gap-3">
      <div>
        <label className="mb-1 block text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
          Titre
        </label>
        <input
          value={draft.title}
          onChange={(e) => setView({ kind: mode, draft: { ...draft, title: e.target.value } })}
          placeholder="Ex. « Résumé hebdo »"
          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-[12.5px] outline-none focus:border-primary/50"
        />
      </div>
      <div>
        <label className="mb-1 block text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
          Étiquette (optionnel)
        </label>
        <input
          value={draft.tag ?? ""}
          onChange={(e) =>
            setView({
              kind: mode,
              draft: { ...draft, tag: e.target.value.trim() || null },
            })
          }
          placeholder={currentCtx}
          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-[12.5px] outline-none focus:border-primary/50"
        />
      </div>
      <div>
        <label className="mb-1 block text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
          Prompt
        </label>
        <textarea
          value={draft.body}
          onChange={(e) => setView({ kind: mode, draft: { ...draft, body: e.target.value } })}
          rows={6}
          autoFocus={!isMobile}
          placeholder="Le texte qui sera inséré dans le composeur…"
          className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-[12.5px] leading-relaxed outline-none focus:border-primary/60"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setView({ kind: "list" })}
          className="rounded-lg border border-border px-3 py-1.5 text-[12px] hover:bg-secondary/60"
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={!draft.body.trim()}
          onClick={() => saveDraft(draft)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Check className="size-3.5" strokeWidth={2} />
          {mode === "edit" ? "Enregistrer" : "Créer"}
        </button>
      </div>
    </div>
  );

  const content =
    view.kind === "list" ? (
      listBody
    ) : view.kind === "create" ? (
      editBody(view.draft, "create")
    ) : (
      editBody(view.draft, "edit")
    );

  if (isMobile) {
    return (
      <MobileSheet
        open={open}
        onOpenChange={onOpenChange}
        title={view.kind === "list" ? "Prompts" : view.kind === "create" ? "Nouveau prompt" : "Modifier"}
        {...(view.kind !== "list"
          ? { onBack: () => setView({ kind: "list" }) }
          : {})}
        compact
      >
        <div className="px-3 pb-4 pt-2">{content}</div>
      </MobileSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <div className="mb-2 flex items-center justify-between">
          <DialogTitle className="text-[15px]">
            {view.kind === "list"
              ? "Bibliothèque de prompts"
              : view.kind === "create"
                ? "Nouveau template"
                : "Modifier le template"}
          </DialogTitle>
          {view.kind !== "list" && (
            <button
              type="button"
              onClick={() => setView({ kind: "list" })}
              aria-label="Retour à la liste"
              className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="max-h-[62vh] overflow-y-auto overscroll-contain pr-1">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}