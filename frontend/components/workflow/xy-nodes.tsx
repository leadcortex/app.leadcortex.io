//frontend\components\workflow\xy-nodes.tsx
import React, { memo } from "react";
import type { WNode } from "@/lib/workflow/types";

type EditorNode = WNode & { preview?: "chips" | "metric" | string };
export type WorkflowNodeData = EditorNode;

export function NodeShell({
  data,
  selected,
  footer,
  children,
}: {
  data: WorkflowNodeData;
  selected?: boolean;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border bg-node/40 p-2 text-sm ${selected ? "ring-2 ring-primary" : ""}`}
      style={{ width: 220 }}
    >
      <div className="mb-2 font-semibold truncate">{data.title || data.blockId}</div>
      <div className="mb-2">{children}</div>
      {footer ? <div className="mt-2 text-xs text-muted-foreground">{footer}</div> : null}
    </div>
  );
}

function Chips({ values }: { values: string[] }) {
  if (!values || !values.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {values.slice(0, 4).map((v) => (
        <span
          key={v}
          className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground"
        >
          {v}
        </span>
      ))}
      {values.length > 4 ? (
        <span className="text-[10px] text-muted-foreground">+{values.length - 4}</span>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <span className="font-mono text-sm text-foreground">{value}</span>
    </div>
  );
}

function str(cfg: Record<string, unknown>, key: string, fallback = ""): string {
  const v = cfg ? (cfg as any)[key] : undefined;
  return v === undefined || v === null ? fallback : String(v);
}

function list(cfg: Record<string, unknown> | undefined, ...keys: string[]): string[] {
  if (!cfg) return [];
  for (const k of keys) {
    const v = (cfg as any)[k];
    if (Array.isArray(v)) return v as string[];
  }
  return [];
}

function preview(data: WorkflowNodeData) {
  const cfg = data.config as Record<string, unknown> | undefined;
  switch (data.preview) {
    case "chips": {
      const values = list(cfg, "segments", "signals", "criteria", "providers");
      return values.length ? <Chips values={values} /> : null;
    }
    case "metric": {
      if (data.blockId === "logic.wait") {
        const unit = str(cfg || {}, "unit", "days");
        const suffix = unit === "hours" ? "h" : unit === "weeks" ? "sem." : "j";
        return <Metric label="Délai" value={`${str(cfg || {}, "amount", "1")} ${suffix}`} />;
      }
      if (data.blockId === "ai.score")
        return <Metric label="Modèle" value={str(cfg || {}, "model", "balanced")} />;
      return <Metric label="Cascade" value={`${list(cfg, "providers").length} sources`} />;
    }
    default:
      return null;
  }
}

export const TriggerNode = memo(function TriggerNode({
  data,
  selected,
}: {
  data: WorkflowNodeData;
  selected?: boolean;
}) {
  return (
    <NodeShell data={data} selected={selected} footer={"Point d'entrée"}>
      {preview(data)}
    </NodeShell>
  );
});

export const ActionNode = memo(function ActionNode({
  data,
  selected,
}: {
  data: WorkflowNodeData;
  selected?: boolean;
}) {
  return (
    <NodeShell data={data} selected={selected}>
      {preview(data)}
    </NodeShell>
  );
});

export const BranchNode = memo(function BranchNode({
  data,
  selected,
}: {
  data: WorkflowNodeData;
  selected?: boolean;
}) {
  const cfg = data.config as Record<string, unknown> | undefined;
  const op = str(cfg || {}, "operator", "gte");
  const symbol = op === "gte" ? "≥" : op === "lte" ? "≤" : op === "eq" ? "=" : "∋";
  const ratio = Number(str(cfg || {}, "ratio", "50"));
  const expression =
    data.blockId === "logic.condition"
      ? `${str(cfg || {}, "field", "champ")} ${symbol} ${str(cfg || {}, "value")}`
      : data.blockId === "logic.split"
        ? `${ratio}% / ${100 - ratio}%`
        : null;
  return (
    <NodeShell data={data} selected={selected}>
      {expression ? (
        <code className="block truncate rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-foreground">
          {expression}
        </code>
      ) : null}
    </NodeShell>
  );
});

export const EmailNode = memo(function EmailNode({
  data,
  selected,
}: {
  data: WorkflowNodeData;
  selected?: boolean;
}) {
  const subject =
    str(data.config as any, "subject") || str(data.config as any, "note") || "Sans objet";
  const body = str(data.config as any, "body") || str(data.config as any, "note");
  return (
    <NodeShell data={data} selected={selected} footer={"Variables dynamiques actives"}>
      <div className="rounded-lg border border-border/70 bg-background/60 p-2">
        <p className="truncate text-[11px] font-medium text-foreground">{subject}</p>
        <p className="mt-1 line-clamp-3 whitespace-pre-line text-[10px] leading-snug text-muted-foreground">
          {body || "Aucun contenu."}
        </p>
      </div>
    </NodeShell>
  );
});

export const MediaNode = memo(function MediaNode({
  data,
  selected,
}: {
  data: WorkflowNodeData;
  selected?: boolean;
}) {
  const src = str(data.config as any, "asset");
  return (
    <NodeShell data={data} selected={selected} footer={src ? "Visuel attaché" : "Aucun visuel"}>
      {src ? (
        <img
          src={src}
          alt={str(data.config as any, "alt", "Aperçu")}
          className="h-24 w-full rounded-lg object-cover"
          draggable={false}
        />
      ) : (
        <div className="grid h-24 place-items-center rounded-lg border border-dashed border-border bg-muted/50 px-2 text-center text-[10px] leading-snug text-muted-foreground">
          Déposez une image ici
          <br />
          ou choisissez-la dans le panneau
        </div>
      )}
    </NodeShell>
  );
});

export const NoteNode = memo(function NoteNode({
  data,
  selected,
}: {
  data: WorkflowNodeData;
  selected?: boolean;
}) {
  return (
    <div
      style={{ width: 220 }}
      className={`relative rounded-xl border bg-warning/12 p-3 text-[11px] leading-snug shadow-[var(--shadow-node)] transition-colors ${selected ? "border-primary" : "border-warning/40"}`}
    >
      <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-warning-foreground/70">
        Note
      </p>
      <p className="whitespace-pre-line text-foreground/80">
        {str(data.config as any, "text", "Double-cliquez pour annoter.")}
      </p>
    </div>
  );
});

export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  branch: BranchNode,
  email: EmailNode,
  media: MediaNode,
  note: NoteNode,
} as const;

export default nodeTypes;
