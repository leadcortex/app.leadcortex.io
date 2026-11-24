// frontend/components/settings/panels/KnowledgeLibraryDialog.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Trash2, Upload } from "@/components/icons";
import { toast } from "sonner";
import { FileKindIcon, getFileKind } from "@/components/ai-assistant/file-type-icons";
import {
  deleteKnowledgeFile,
  KNOWLEDGE_FILE_ACCEPT,
  listKnowledgeFiles,
  MAX_KNOWLEDGE_FILE_BYTES,
  saveKnowledgeFile,
  type KnowledgeFileSummary,
} from "@/lib/ai/knowledge-library";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function KnowledgeLibraryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [files, setFiles] = useState<KnowledgeFileSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      setFiles(await listKnowledgeFiles());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Impossible de charger la bibliothèque.",
      );
    }
  }, []);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const uploadFiles = async (selected: FileList | null) => {
    if (!selected?.length) return;
    setBusy(true);
    let added = 0;
    const errors: string[] = [];

    for (const file of Array.from(selected)) {
      try {
        await saveKnowledgeFile(file);
        added += 1;
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Erreur inconnue.";
        errors.push(`${file.name} : ${reason}`);
      }
    }

    await refresh();
    if (added)
      toast.success(`${added} fichier${added > 1 ? "s" : ""} ajouté${added > 1 ? "s" : ""}.`);
    if (errors.length) toast.error(errors.slice(0, 3).join(" · "));
    setBusy(false);
  };

  const removeFile = async (file: KnowledgeFileSummary) => {
    try {
      await deleteKnowledgeFile(file.id);
      setFiles((current) => current.filter((entry) => entry.id !== file.id));
      toast.success(`« ${file.name} » supprimé de la bibliothèque.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de supprimer ce fichier.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[80] max-h-[85vh] overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            Bibliothèque de connaissances
          </DialogTitle>
          <DialogDescription>
            Ajoutez vos fichiers de référence. Leur contenu texte sera joint aux demandes de
            l’assistant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-border bg-secondary/20 p-3">
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="mr-1.5 size-3.5" />
              Ajouter des fichiers
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept={KNOWLEDGE_FILE_ACCEPT}
              multiple
              hidden
              onChange={(event) => {
                void uploadFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </div>

          <div className="max-h-[45vh] space-y-1 overflow-y-auto">
            {files.length ? (
              files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 rounded-lg border border-border/70 bg-background px-2.5 py-2"
                >
                  <FileKindIcon kind={getFileKind(file.name)} name={file.name} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatSize(file.size)} · ajouté le{" "}
                      {new Date(file.updatedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Supprimer ${file.name}`}
                    onClick={() => void removeFile(file)}
                    className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-border/70 px-4 py-8 text-center text-xs text-muted-foreground">
                <FileKindIcon kind="folder" size={36} className="mx-auto mb-2" />
                Aucun fichier dans la bibliothèque pour le moment.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
