//frontend\lib\workflow\types.ts
import type { CategoryKey } from "@/data/workflow-blocks-catalog";

export type Port = { id: string; label: string };

export type WNode = {
  id: string;
  blockId: string;
  category: CategoryKey;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  inputs: Port[];
  outputs: Port[];
  config: Record<string, string | number | boolean>;
  muted?: boolean;
  collapsed?: boolean;
  noteH?: number;
  fieldsH?: number;
  w?: number;
  status?: "idle" | "running" | "success" | "error";
};

export type WEdge = {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
};

export type WComment = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  targetId: string | null;
  pointer: boolean;
};

export type WDoc = {
  nodes: WNode[];
  edges: WEdge[];
  comments: WComment[];
};

export type Viewport = { x: number; y: number; zoom: number };

export type CanvasSettings = {
  bounded: boolean;
  width: number;
  height: number;
  snap: boolean;
  gridSize: number;
  showGrid: boolean;
  showMinimap: boolean;
};

export type ChatAttachment = { id: string; label: string; category: CategoryKey };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  attachments?: ChatAttachment[];
};
