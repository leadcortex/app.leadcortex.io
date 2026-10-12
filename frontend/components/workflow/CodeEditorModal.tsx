//frontend\components\workflow\CodeEditorModal.tsx
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Code2, Loader2, Save } from "lucide-react";
import {
  CODE_LANGUAGE_LABELS,
  resolveLanguage,
  type CodeLanguageId,
} from "@/lib/workflow/code-languages";
import { findIssues, type CodeIssue } from "@/lib/workflow/code-lint";
import { cn } from "@/lib/utils";
import { NodeSelect } from "./NodeSelect";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const CodeMirrorSurface = lazy(() => import("./CodeMirrorSurface"));

export type CodeEditorTarget = {
  nodeId: string;
  title: string;
  fieldKey: string;
  fieldLabel: string;
  languageKey?: string;
  language: CodeLanguageId;
  value: string;
};

export function CodeEditorModal({
  target,
  onClose,
  onSave,
}: {
  target: CodeEditorTarget | null;
  onClose: () => void;
  onSave: (patch: { code: string; language: CodeLanguageId }) => void;
}) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<CodeLanguageId>("javascript");
  const [dirty, setDirty] = useState(false);
  const openedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!target) {
      openedFor.current = null;
      return;
    }
    if (openedFor.current === target.nodeId) return;
    openedFor.current = target.nodeId;
    setCode(target.value);
    setLanguage(target.language);
    setDirty(false);
  }, [target]);

  const issues: CodeIssue[] = useMemo(() => findIssues(code, language), [code, language]);

  const save = useCallback(() => {
    onSave({ code, language });
    setDirty(false);
    onClose();
  }, [code, language, onClose, onSave]);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [target, save]);

  if (!target) return null;
  const lang = resolveLanguage(language);

  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="z-[80] flex h-[95dvh] max-h-[95dvh] flex-col gap-0 overflow-hidden p-0 sm:h-[90vh] sm:max-h-[90vh] sm:max-w-6xl"
        aria-describedby={undefined}
        onPointerDownOutside={(e) => {
          if (dirty) e.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">Éditeur de code — {target.title}</DialogTitle>

        {}
        <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border py-2.5 pl-3 pr-14 md:pl-4">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
            <Code2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{target.title}</p>
            <p className="truncate text-[10.5px] text-muted-foreground">
              {target.fieldLabel} · script.{lang.ext}
              {dirty ? " · modifié" : ""}
            </p>
          </div>

          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="hidden md:inline">Langage</span>
            <NodeSelect
              value={lang.label}
              onChange={(val) => {
                setLanguage(resolveLanguage(val).id);
                setDirty(true);
              }}
              options={CODE_LANGUAGE_LABELS}
              ariaLabel="Langage du script"
              size="default"
              className="w-auto min-w-[7.5rem]"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setCode(lang.snippet);
              setDirty(true);
            }}
            className="hidden h-7 rounded-md border border-border px-2.5 text-[11.5px] text-muted-foreground hover:text-foreground md:inline-flex md:items-center"
          >
            Insérer un modèle
          </button>

          <button
            type="button"
            onClick={save}
            className="inline-flex h-7 items-center gap-1.5 rounded-md bg-primary px-3 text-[11.5px] font-medium text-primary-foreground hover:brightness-110"
          >
            <Save className="h-3.5 w-3.5" /> Enregistrer
          </button>
        </header>

        {}
        <div className="wf-code-modal min-h-0 flex-1 overflow-hidden">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center gap-2 text-[12px] text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement de l'éditeur…
              </div>
            }
          >
            <CodeMirrorSurface
              value={code}
              language={language}
              onChange={(next) => {
                setCode(next);
                setDirty(true);
              }}
            />
          </Suspense>
        </div>

        {}
        <footer
          className={cn(
            "flex shrink-0 items-center gap-2 border-t border-border px-3 py-2 text-[11.5px]",
            issues.length ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {issues.length ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {issues.length} erreur{issues.length > 1 ? "s" : ""} · {issues[0]!.message}
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
              <span>Syntaxe valide</span>
            </>
          )}
          <span className="ml-auto hidden shrink-0 text-muted-foreground md:inline">
            {code ? code.split("\n").length : 0} lignes · Ctrl+S pour enregistrer
          </span>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
