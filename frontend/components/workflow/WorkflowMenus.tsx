//frontend\components\workflow\WorkflowMenus.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CircleHelp,
  Eye,
  FileJson,
  FileSearch,
  FileText,
  History,
  Keyboard,
  LayoutTemplate,
  Moon,
  PanelRight,
  Pencil,
  Search,
  Sun,
  Upload,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { useWorkflow } from "@/lib/workflow/store";
import type { WDoc } from "@/lib/workflow/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { CanvasSettingsFields } from "./LeftPanel";
import { MobileGearMenu } from "./MobileGearMenu";
import type { MenuEntry, MenuSection } from "./menu-model";

export type WorkflowDialog =
  | "export"
  | "import"
  | "search"
  | "analyzer"
  | "shortcuts"
  | "templates"
  | "history"
  | "canvas"
  | null;

type WorkflowMenusProps = {
  showLeft?: boolean;
  showRight?: boolean;
  onToggleLeft?: () => void;
  onToggleRight?: () => void;
  onOpenPalette: () => void;

  mobile?: boolean;

  onOpenMobileDrawer?: () => void;
};

function renderDesktopEntries(entries: MenuEntry[]): React.ReactNode {
  return entries.map((entry, index) => {
    switch (entry.kind) {
      case "separator":
        return <MenubarSeparator key={index} />;
      case "label":
        return (
          <MenubarLabel key={index} className="text-[10px] uppercase text-muted-foreground">
            {entry.label}
          </MenubarLabel>
        );
      case "check":
        return (
          <MenubarCheckboxItem
            key={index}
            checked={entry.checked}
            onCheckedChange={entry.onCheckedChange}
          >
            {entry.label}
            {entry.shortcut && <MenubarShortcut>{entry.shortcut}</MenubarShortcut>}
          </MenubarCheckboxItem>
        );
      case "sub": {
        const Icon = entry.icon;
        return (
          <MenubarSub key={index}>
            <MenubarSubTrigger>
              {Icon && <Icon className="mr-2 h-4 w-4" />} {entry.label}
            </MenubarSubTrigger>
            <MenubarSubContent className="w-52">
              {renderDesktopEntries(entry.children)}
            </MenubarSubContent>
          </MenubarSub>
        );
      }
      case "item": {
        const Icon = entry.icon;
        return (
          <MenubarItem key={index} disabled={entry.disabled} onSelect={entry.onSelect}>
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {entry.label}
            {entry.shortcut && <MenubarShortcut>{entry.shortcut}</MenubarShortcut>}
          </MenubarItem>
        );
      }
    }
  });
}

const shortcutGroups = [
  {
    title: "Fichier et recherche",
    rows: [
      ["Exporter / enregistrer", "Ctrl S"],
      ["Rechercher un élément", "Ctrl F"],
      ["Centre des raccourcis", "Ctrl /"],
    ],
  },
  {
    title: "Édition",
    rows: [
      ["Annuler", "Ctrl Z"],
      ["Rétablir", "Ctrl Y"],
      ["Copier / coller", "Ctrl C / V"],
      ["Dupliquer", "Ctrl D"],
      ["Tout sélectionner", "Ctrl A"],
      ["Supprimer", "Suppr"],
    ],
  },
  {
    title: "Canevas",
    rows: [
      ["Ajouter un bloc", "Shift A"],
      ["Naviguer", "Espace + glisser"],
      ["Sélection / main / intelligent", "V / H / S"],
      ["Ajuster à la vue", "F"],
      ["Zoom avant / arrière", "Ctrl + / −"],
      ["Basculer la mini-carte", "M"],
    ],
  },
];

function isWorkflowDocument(value: unknown): value is WDoc {
  if (!value || typeof value !== "object") return false;
  const doc = value as Partial<WDoc>;
  return Array.isArray(doc.nodes) && Array.isArray(doc.edges) && Array.isArray(doc.comments);
}

function downloadJson(doc: WDoc) {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `workflow-leadcortex-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function WorkflowMenus({
  showLeft = false,
  showRight = false,
  onToggleLeft,
  onToggleRight,
  onOpenPalette,
  mobile = false,
  onOpenMobileDrawer,
}: WorkflowMenusProps) {
  const {
    doc,
    setDoc,
    settings,
    setSettings,
    viewport,
    setViewport,
    fitView,
    autoLayout,
    focusOn,
    undo,
    redo,
    copySelection,
    paste,
    duplicateSelected,
    deleteSelected,
    setSelection,
  } = useWorkflow();
  const [dialog, setDialog] = useState<WorkflowDialog>(null);
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    const openDialog = (event: Event) => {
      const key = (event as CustomEvent<WorkflowDialog>).detail;
      if (key) setDialog(key);
    };
    window.addEventListener("workflow:open-dialog", openDialog);
    return () => window.removeEventListener("workflow:open-dialog", openDialog);
  }, []);

  const searchResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return [
      ...doc.nodes.map((node) => ({ id: node.id, label: node.title, kind: "Bloc" })),
      ...doc.comments.map((comment) => ({
        id: comment.id,
        label: comment.text.replace(/[#*`]/g, "").split("\n").find(Boolean) ?? "Note",
        kind: "Note",
      })),
    ].filter((item) => item.label.toLowerCase().includes(needle));
  }, [doc.comments, doc.nodes, query]);

  const connectedIds = useMemo(
    () => new Set(doc.edges.flatMap((edge) => [edge.source, edge.target])),
    [doc.edges],
  );
  const isolatedNodes = doc.nodes.filter((node) => !connectedIds.has(node.id));
  const invalidEdges = doc.edges.filter(
    (edge) =>
      !doc.nodes.some((node) => node.id === edge.source) ||
      !doc.nodes.some((node) => node.id === edge.target),
  );

  const toggleTheme = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    setDark(next);
  };

  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isWorkflowDocument(parsed)) throw new Error("format");
      setDoc(() => parsed);
      setSelection([]);
      setDialog(null);
      toast.success("Workflow importé");
    } catch {
      toast.error("Ce fichier JSON n’est pas un workflow LeadCortex valide.");
    }
  };

  const zoom = (delta: number) =>
    setViewport((current) => ({
      ...current,
      zoom: Math.min(2.5, Math.max(0.15, current.zoom + delta)),
    }));

  const noop = () => undefined;

  const sections: MenuSection[] = [
    {
      key: "file",
      label: "Fichier",
      icon: FileText,
      contentClassName: "w-60",
      entries: [
        {
          kind: "item",
          label: "Nouveau depuis un modèle",
          icon: LayoutTemplate,
          onSelect: () => setDialog("templates"),
        },
        {
          kind: "item",
          label: "Importer un workflow",
          icon: Upload,
          onSelect: () => setDialog("import"),
        },
        {
          kind: "sub",
          label: "Exporter",
          icon: FileJson,
          children: [
            {
              kind: "item",
              label: "Document JSON",
              shortcut: "Ctrl S",
              onSelect: () => setDialog("export"),
            },
            { kind: "item", label: "Image PNG · bientôt", disabled: true, onSelect: noop },
            { kind: "item", label: "Rapport PDF · bientôt", disabled: true, onSelect: noop },
          ],
        },
        { kind: "separator" },
        {
          kind: "item",
          label: "Historique des versions",
          icon: History,
          onSelect: () => setDialog("history"),
        },
      ],
    },
    {
      key: "edit",
      label: "Édition",
      icon: Pencil,
      contentClassName: "w-56",
      entries: [
        { kind: "item", label: "Annuler", shortcut: "Ctrl Z", onSelect: undo },
        { kind: "item", label: "Rétablir", shortcut: "Ctrl Y", onSelect: redo },
        { kind: "separator" },
        { kind: "item", label: "Copier", shortcut: "Ctrl C", onSelect: copySelection },
        { kind: "item", label: "Coller", shortcut: "Ctrl V", onSelect: paste },
        { kind: "item", label: "Dupliquer", shortcut: "Ctrl D", onSelect: duplicateSelected },
        { kind: "item", label: "Supprimer", shortcut: "Suppr", onSelect: deleteSelected },
        { kind: "separator" },
        {
          kind: "item",
          label: "Rechercher un élément",
          icon: Search,
          shortcut: "Ctrl F",
          onSelect: () => setDialog("search"),
        },
        { kind: "item", label: "Alignement automatique", onSelect: autoLayout },
      ],
    },
    {
      key: "view",
      label: "Affichage",
      icon: Eye,
      contentClassName: "w-60",
      entries: [
        { kind: "label", label: "Canevas" },
        { kind: "item", label: "Zoom avant", shortcut: "Ctrl +", onSelect: () => zoom(0.1) },
        { kind: "item", label: "Zoom arrière", shortcut: "Ctrl −", onSelect: () => zoom(-0.1) },
        { kind: "item", label: "Ajuster à la vue", shortcut: "F", onSelect: fitView },
        {
          kind: "item",
          label: "Zoom à 100 %",
          shortcut: "Ctrl 0",
          onSelect: () => setViewport((current) => ({ ...current, zoom: 1 })),
        },
        { kind: "separator" },
        {
          kind: "check",
          label: "Grille visible",
          checked: settings.showGrid,
          onCheckedChange: (checked) => setSettings((s) => ({ ...s, showGrid: checked })),
        },
        {
          kind: "check",
          label: "Grille magnétique",
          checked: settings.snap,
          onCheckedChange: (checked) => setSettings((s) => ({ ...s, snap: checked })),
        },
        {
          kind: "check",
          label: "Mini-carte",
          shortcut: "M",
          checked: settings.showMinimap,
          onCheckedChange: (checked) => setSettings((s) => ({ ...s, showMinimap: checked })),
        },
        { kind: "separator" },

        ...(mobile
          ? ([
              {
                kind: "item",
                label: "Arborescence et bibliothèque",
                icon: PanelRight,
                onSelect: onOpenMobileDrawer ?? noop,
              },
            ] satisfies MenuEntry[])
          : ([
              {
                kind: "check",
                label: "Panneau gauche",
                checked: showLeft,
                onCheckedChange: () => onToggleLeft?.(),
              },
              {
                kind: "check",
                label: "Panneau droit",
                checked: showRight,
                onCheckedChange: () => onToggleRight?.(),
              },
            ] satisfies MenuEntry[])),
        {
          kind: "item",
          label: dark ? "Mode clair" : "Mode sombre",
          icon: dark ? Sun : Moon,
          onSelect: toggleTheme,
        },
      ],
    },
    {
      key: "tools",
      label: "Outils",
      icon: Wrench,
      contentClassName: "w-60",
      entries: [
        { kind: "item", label: "Ajouter un bloc", shortcut: "Shift A", onSelect: onOpenPalette },
        { kind: "item", label: "Paramètres du canevas", onSelect: () => setDialog("canvas") },
        { kind: "separator" },
        {
          kind: "item",
          label: "Analyser le workflow",
          icon: FileSearch,
          onSelect: () => setDialog("analyzer"),
        },
        { kind: "item", label: "Exécution pas-à-pas · bientôt", disabled: true, onSelect: noop },
      ],
    },
    {
      key: "help",
      label: "Aide",
      icon: CircleHelp,
      contentClassName: "w-60",
      entries: [
        {
          kind: "item",
          label: "Raccourcis clavier",
          icon: Keyboard,
          shortcut: "Ctrl /",
          onSelect: () => setDialog("shortcuts"),
        },
        {
          kind: "item",
          label: "À propos de l’éditeur",
          onSelect: () => toast.info("LeadCortex Workflow Studio · éditeur local"),
        },
      ],
    },
  ];

  return (
    <>
      {mobile ? (
        <MobileGearMenu sections={sections} />
      ) : (
        <Menubar className="h-7 border-0 bg-transparent p-0 shadow-none">
          {sections.map((section) => (
            <MenubarMenu key={section.key}>
              <MenubarTrigger className="h-7 px-2 text-[11.5px]">{section.label}</MenubarTrigger>
              <MenubarContent className={section.contentClassName}>
                {renderDesktopEntries(section.entries)}
              </MenubarContent>
            </MenubarMenu>
          ))}
        </Menubar>
      )}

      <Dialog open={dialog === "export"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exporter le workflow</DialogTitle>
            <DialogDescription>
              Le JSON conserve les blocs, connexions et notes et peut être réimporté.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-border bg-panel p-3">
            <div className="flex items-center gap-3">
              <FileJson className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Document JSON LeadCortex</p>
                <p className="text-xs text-muted-foreground">
                  {doc.nodes.length} blocs · {doc.edges.length} connexions · {doc.comments.length}{" "}
                  notes
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                downloadJson(doc);
                setDialog(null);
                toast.success("Export JSON téléchargé");
              }}
            >
              Exporter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "import"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer un workflow</DialogTitle>
            <DialogDescription>
              Sélectionnez un fichier JSON exporté depuis LeadCortex. Le canevas courant sera
              remplacé.
            </DialogDescription>
          </DialogHeader>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => importFile(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input bg-panel text-sm hover:bg-accent"
          >
            <Upload className="h-6 w-6 text-primary" />
            <span className="font-medium">Choisir un fichier JSON</span>
            <span className="text-xs text-muted-foreground">Format LeadCortex uniquement</span>
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "search"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechercher dans le workflow</DialogTitle>
            <DialogDescription>
              Trouvez un bloc ou une note puis centrez-le sur le canevas.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom du bloc ou contenu de la note…"
              className="h-9 w-full rounded-md border border-input bg-input-bg pl-9 pr-3 text-sm outline-none focus:border-ring"
            />
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  focusOn(item.id);
                  setDialog(null);
                }}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-accent"
              >
                <span className="truncate text-sm">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.kind}</span>
              </button>
            ))}
            {query && !searchResults.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun élément trouvé.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "analyzer"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Analyse du workflow</DialogTitle>
            <DialogDescription>
              Contrôle local de la structure actuelle, sans exécuter les actions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {[
              [doc.nodes.length, "Blocs"],
              [doc.edges.length, "Connexions"],
              [doc.comments.length, "Notes"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-md border border-border bg-panel p-3 text-center">
                <p className="text-xl font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-md border border-border p-3">
              {invalidEdges.length ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
              )}
              <div>
                <p className="text-sm font-medium">Intégrité des connexions</p>
                <p className="text-xs text-muted-foreground">
                  {invalidEdges.length
                    ? `${invalidEdges.length} connexion(s) invalide(s).`
                    : "Toutes les connexions sont valides."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-md border border-border p-3">
              <BarChart3 className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Blocs isolés</p>
                <p className="text-xs text-muted-foreground">
                  {isolatedNodes.length
                    ? `${isolatedNodes.length} bloc(s) ne sont reliés à aucune branche.`
                    : "Aucun bloc isolé détecté."}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "shortcuts"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Raccourcis clavier</DialogTitle>
            <DialogDescription>
              Les commandes essentielles de l’éditeur LeadCortex.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-3">
            {shortcutGroups.map((group) => (
              <section key={group.title}>
                <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.rows.map(([label, shortcut]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3 rounded px-2 py-1.5 hover:bg-accent"
                    >
                      <span className="text-xs">{label}</span>
                      <kbd className="shrink-0 rounded border border-border bg-panel px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {shortcut}
                      </kbd>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "canvas"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paramètres du canevas</DialogTitle>
            <DialogDescription>
              Définissez les limites physiques de l’espace de travail.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-border bg-panel p-3">
            <CanvasSettingsFields />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "templates" || dialog === "history"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "templates" ? "Modèles de workflows" : "Historique des versions"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "templates"
                ? "Les modèles permettront de démarrer depuis des scénarios de prospection prêts à adapter."
                : "Les versions permettront de comparer et restaurer des états enregistrés du workflow."}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-dashed border-input bg-panel px-4 py-10 text-center">
            <p className="text-sm font-medium">Fonction prévue</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cette interface est prête; la conservation des données sera connectée ultérieurement.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
