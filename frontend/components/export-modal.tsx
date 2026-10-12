//frontend\components\export-modal.tsx
import { useState, useMemo } from "react";
import { X, Download, FileSpreadsheet, FileText, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ColumnOption {
  key: string;
  label: string;
  selected: boolean;
}

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  entityType: "leads" | "companies" | "sequences" | "deals";
  availableColumns: ColumnOption[];
  totalItems: number;
  filteredCount: number;
  onExport: (options: ExportOptions) => Promise<void>;
}

export interface ExportOptions {
  format: "csv" | "excel";
  columns: string[];
  includeAll: boolean;
}

export function ExportModal({
  open,
  onOpenChange,
  title,
  entityType,
  availableColumns,
  totalItems,
  filteredCount,
  onExport,
}: ExportModalProps) {
  const [format, setFormat] = useState<"csv" | "excel">("csv");
  const [includeAll, setIncludeAll] = useState(false);
  const [columns, setColumns] = useState<ColumnOption[]>(availableColumns);
  const [isExporting, setIsExporting] = useState(false);

  const selectedCount = useMemo(() => columns.filter((c) => c.selected).length, [columns]);

  const exportCount = useMemo(() => {
    return includeAll ? totalItems : filteredCount;
  }, [includeAll, totalItems, filteredCount]);

  const toggleColumn = (key: string) => {
    setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, selected: !c.selected } : c)));
  };

  const toggleAllColumns = () => {
    const allSelected = columns.every((c) => c.selected);
    setColumns((prev) => prev.map((c) => ({ ...c, selected: !allSelected })));
  };

  const handleExport = async () => {
    const selectedKeys = columns.filter((c) => c.selected).map((c) => c.key);
    if (selectedKeys.length === 0) {
      toast.error("Sélectionnez au moins une colonne.");
      return;
    }

    setIsExporting(true);
    try {
      await onExport({
        format,
        columns: selectedKeys,
        includeAll,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-display text-2xl italic">Exporter {title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalItems} élément{totalItems > 1 ? "s" : ""} au total
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-md hover:bg-surface transition-colors"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Format d'export</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm",
                  format === "csv"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-surface",
                )}
              >
                <FileText className="size-4" />
                CSV
              </button>
              <button
                type="button"
                onClick={() => setFormat("excel")}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm",
                  format === "excel"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-surface",
                )}
              >
                <FileSpreadsheet className="size-4" />
                Excel
              </button>
            </div>
          </div>

          {}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Périmètre</label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm">
                <input
                  type="radio"
                  checked={!includeAll}
                  onChange={() => setIncludeAll(false)}
                  className="size-4 text-primary border-border rounded-full focus:ring-2 focus:ring-primary/20"
                />
                <span>
                  Résultats filtrés{" "}
                  <span className="text-muted-foreground text-xs font-mono">({filteredCount})</span>
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-sm">
                <input
                  type="radio"
                  checked={includeAll}
                  onChange={() => setIncludeAll(true)}
                  className="size-4 text-primary border-border rounded-full focus:ring-2 focus:ring-primary/20"
                />
                <span>
                  Tous les éléments{" "}
                  <span className="text-muted-foreground text-xs font-mono">({totalItems})</span>
                </span>
              </label>
            </div>
          </div>

          {}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                Colonnes ({selectedCount}/{columns.length})
              </label>
              <button
                type="button"
                onClick={toggleAllColumns}
                className="text-xs text-primary hover:underline"
              >
                {columns.every((c) => c.selected) ? "Désélectionner tout" : "Tout sélectionner"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto p-1 border border-border rounded-lg">
              {columns.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-surface cursor-pointer text-sm transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={col.selected}
                    onChange={() => toggleColumn(col.key)}
                    className="size-3.5 text-primary border-border rounded focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="truncate">{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          {}
          <div className="rounded-lg bg-surface/50 p-3 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">{exportCount}</span> lignes exportées ·{" "}
              <span className="font-medium text-foreground">{selectedCount}</span> colonnes
            </p>
            <p className="mt-0.5">
              Format: <span className="font-mono uppercase">{format}</span>
            </p>
          </div>
        </div>

        {}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-surface/30 rounded-b-2xl">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || selectedCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Export...
              </>
            ) : (
              <>
                <Download className="size-4" />
                Exporter
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
