//frontend\lib\workflow\store.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type {
  CanvasSettings,
  ChatAttachment,
  ChatMessage,
  Viewport,
  WComment,
  WDoc,
  WEdge,
  WNode,
} from "./types";
import {
  computeTreeLayout,
  connect as connectEdge,
  insertNodeOnEdge as insertNodeOnEdgeDoc,
  docBounds,
  makeComment,
  makeNode,
  nodeHeight,
  nodeWidth,
  NODE_W,
  uid,
} from "./geometry";

function seedDoc(): WDoc {
  return { nodes: [], edges: [], comments: [] };
}

type Ctx = {
  doc: WDoc;
  getDoc: () => WDoc;
  setDoc: (fn: (d: WDoc) => WDoc, commit?: boolean) => void;
  selection: string[];
  setSelection: (ids: string[]) => void;
  toggleSelect: (id: string, additive: boolean) => void;
  viewport: Viewport;
  setViewport: React.Dispatch<React.SetStateAction<Viewport>>;
  size: { w: number; h: number };
  setSize: (s: { w: number; h: number }) => void;
  settings: CanvasSettings;
  setSettings: React.Dispatch<React.SetStateAction<CanvasSettings>>;
  addBlock: (blockId: string, x?: number, y?: number) => string;
  addComment: (x?: number, y?: number, targetId?: string | null) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  copySelection: () => void;
  paste: () => void;
  groupSelected: () => void;
  disconnectNode: (id: string) => void;
  connect: (e: Omit<WEdge, "id">) => void;
  updateNode: (id: string, patch: Partial<WNode>) => void;
  updateComment: (id: string, patch: Partial<WComment>) => void;
  focusOn: (id: string) => void;
  fitView: () => void;
  autoLayout: () => void;
  arranging: boolean;
  insertNodeOnEdge: (edgeId: string, nodeId: string) => void;
  undo: () => void;
  redo: () => void;
  chat: ChatMessage[];
  attachments: ChatAttachment[];
  attachNode: (id: string) => void;
  removeAttachment: (id: string) => void;
  sendChat: (text: string) => void;
  centerWorld: () => { x: number; y: number };
  codeEditorNodeId: string | null;
  openCodeEditor: (id: string) => void;
  closeCodeEditor: () => void;
  draggingBlockId: string | null;
  setDraggingBlockId: (id: string | null) => void;
};

const WorkflowCtx = createContext<Ctx | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [doc, setDocState] = useState<WDoc>(seedDoc);
  const [selection, setSelection] = useState<string[]>([]);
  const [viewport, setViewportState] = useState<Viewport>({ x: 60, y: 40, zoom: 0.9 });
  const [size, setSize] = useState({ w: 1200, h: 800 });
  const [settings, setSettings] = useState<CanvasSettings>(() => ({
    bounded: true,
    // être espacés sans jamais se sentir à l'étroit, tout en gardant des
    // "murs" physiques infranchissables (cf. clampViewport).
    width: 8000,
    height: 5200,
    snap: true,
    gridSize: 50,
    showGrid: true,
    // Minicarte désactivée par défaut sur mobile pour ne pas encombrer
    showMinimap: typeof window === "undefined" ? true : window.innerWidth >= 768,
  }));

  /**
   * "Murs" du canevas : la vue ne peut jamais sortir de la surface de travail.
   * Le zoom minimum est celui qui laisse la surface remplir le viewport, et la
   * translation est bornée pour qu'aucun bord ne laisse apparaître le vide.
   */
  const boundsRef = useRef({ size, settings });
  boundsRef.current = { size, settings };

  const setViewport = useCallback<Dispatch<SetStateAction<Viewport>>>((action) => {
    setViewportState((prev) => {
      const raw =
        typeof action === "function" ? (action as (v: Viewport) => Viewport)(prev) : action;
      const { size: s, settings: st } = boundsRef.current;
      if (!st.bounded || s.w <= 0 || s.h <= 0) return raw;
      const minFit = Math.min(2.5, Math.max(s.w / st.width, s.h / st.height));
      const zoom = Math.min(2.5, Math.max(minFit, raw.zoom));
      const worldW = st.width * zoom;
      const worldH = st.height * zoom;
      const clampAxis = (value: number, world: number, view: number) =>
        world <= view ? (view - world) / 2 : Math.min(0, Math.max(view - world, value));
      return {
        zoom,
        x: clampAxis(raw.x, worldW, s.w),
        y: clampAxis(raw.y, worldH, s.h),
      };
    });
  }, []);

  useEffect(() => {
    setViewport((v) => v);
  }, [size.w, size.h, settings.width, settings.height, settings.bounded, setViewport]);

  const [chat, setChat] = useState<ChatMessage[]>([
    {
      id: "seed_msg_1",
      role: "assistant",
      text: "Bonjour 👋 Je suis l'assistant du canevas. Glisse un bloc ici pour que je l'analyse, ou demande-moi d'optimiser une branche.",
    },
  ]);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [codeEditorNodeId, setCodeEditorNodeId] = useState<string | null>(null);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const clipboard = useRef<WDoc | null>(null);
  const past = useRef<WDoc[]>([]);
  const future = useRef<WDoc[]>([]);
  const docRef = useRef<WDoc>(doc);

  const setDoc = useCallback((fn: (d: WDoc) => WDoc, commit = true) => {
    const current = docRef.current;
    const next = fn(current);
    if (next === current) return;
    if (commit) {
      past.current = [...past.current.slice(-49), current];
      future.current = [];
    }
    docRef.current = next;
    setDocState(next);
  }, []);

  const getDoc = useCallback(() => docRef.current, []);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current = [...future.current, docRef.current];
    docRef.current = prev;
    setDocState(prev);
  }, []);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current = [...past.current, docRef.current];
    docRef.current = next;
    setDocState(next);
  }, []);

  const centerWorld = useCallback(
    () => ({
      x: (size.w / 2 - viewport.x) / viewport.zoom,
      y: (size.h / 2 - viewport.y) / viewport.zoom,
    }),
    [size, viewport],
  );

  const addBlock = useCallback(
    (blockId: string, x?: number, y?: number) => {
      const c = centerWorld();
      const node = makeNode(blockId, x ?? c.x - NODE_W / 2, y ?? c.y - 40);
      setDoc((d) => ({ ...d, nodes: [...d.nodes, node] }));
      setSelection([node.id]);
      return node.id;
    },
    [centerWorld, setDoc],
  );

  const addComment = useCallback(
    (x?: number, y?: number, targetId: string | null = null) => {
      const c = centerWorld();
      const cm = makeComment(x ?? c.x, y ?? c.y, targetId);
      setDoc((d) => ({ ...d, comments: [...d.comments, cm] }));
      setSelection([cm.id]);
    },
    [centerWorld, setDoc],
  );

  const deleteSelected = useCallback(() => {
    setDoc((d) => {
      const ids = new Set(selection);
      return {
        nodes: d.nodes.filter((n) => !ids.has(n.id)),
        comments: d.comments.filter((c) => !ids.has(c.id)),
        edges: d.edges.filter((e) => !ids.has(e.id) && !ids.has(e.source) && !ids.has(e.target)),
      };
    });
    setSelection([]);
  }, [selection, setDoc]);

  const cloneSelection = useCallback((src: WDoc, ids: string[], dx: number, dy: number) => {
    const map = new Map<string, string>();
    const nodes = src.nodes
      .filter((n) => ids.includes(n.id))
      .map((n) => {
        const id = uid("node");
        map.set(n.id, id);
        return { ...n, id, x: n.x + dx, y: n.y + dy };
      });
    const comments = src.comments
      .filter((c) => ids.includes(c.id))
      .map((c) => ({ ...c, id: uid("cmt"), x: c.x + dx, y: c.y + dy }));
    const edges = src.edges
      .filter((e) => map.has(e.source) && map.has(e.target))
      .map((e) => ({
        ...e,
        id: uid("edge"),
        source: map.get(e.source)!,
        target: map.get(e.target)!,
      }));
    return { nodes, comments, edges };
  }, []);

  const duplicateSelected = useCallback(() => {
    if (!selection.length) return;
    let newIds: string[] = [];
    setDoc((d) => {
      const cl = cloneSelection(d, selection, 40, 40);
      newIds = [...cl.nodes.map((n) => n.id), ...cl.comments.map((c) => c.id)];
      return {
        nodes: [...d.nodes, ...cl.nodes],
        comments: [...d.comments, ...cl.comments],
        edges: [...d.edges, ...cl.edges],
      };
    });
    setTimeout(() => setSelection(newIds), 0);
  }, [cloneSelection, selection, setDoc]);

  const copySelection = useCallback(() => {
    const ids = new Set(selection);
    clipboard.current = {
      nodes: doc.nodes.filter((n) => ids.has(n.id)),
      comments: doc.comments.filter((c) => ids.has(c.id)),
      edges: doc.edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
    };
  }, [doc, selection]);

  const paste = useCallback(() => {
    const clip = clipboard.current;
    if (!clip || (!clip.nodes.length && !clip.comments.length)) return;
    const ids = [...clip.nodes.map((n) => n.id), ...clip.comments.map((c) => c.id)];
    let newIds: string[] = [];
    setDoc((d) => {
      const cl = cloneSelection(clip, ids, 60, 60);
      newIds = [...cl.nodes.map((n) => n.id), ...cl.comments.map((c) => c.id)];
      return {
        nodes: [...d.nodes, ...cl.nodes],
        comments: [...d.comments, ...cl.comments],
        edges: [...d.edges, ...cl.edges],
      };
    });
    setTimeout(() => setSelection(newIds), 0);
  }, [cloneSelection, setDoc]);

  const groupSelected = useCallback(() => {
    if (selection.length < 2) return;
    setDoc((d) => {
      const items = [
        ...d.nodes
          .filter((n) => selection.includes(n.id))
          .map((n) => ({
            x: n.x,
            y: n.y,
            w: nodeWidth(n),
            h: nodeHeight(n),
          })),
        ...d.comments
          .filter((c) => selection.includes(c.id))
          .map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h })),
      ];
      if (items.length < 2) return d;
      const x1 = Math.min(...items.map((i) => i.x)) - 32;
      const y1 = Math.min(...items.map((i) => i.y)) - 64;
      const x2 = Math.max(...items.map((i) => i.x + i.w)) + 32;
      const y2 = Math.max(...items.map((i) => i.y + i.h)) + 32;
      const group: WComment = {
        id: uid("group"),
        x: x1,
        y: y1,
        w: x2 - x1,
        h: y2 - y1,
        text: "## Groupe",
        targetId: null,
        pointer: false,
      };
      return { ...d, comments: [group, ...d.comments] };
    });
  }, [selection, setDoc]);

  const disconnectNode = useCallback(
    (id: string) =>
      setDoc((d) => ({ ...d, edges: d.edges.filter((e) => e.source !== id && e.target !== id) })),
    [setDoc],
  );

  const connect = useCallback((e: Omit<WEdge, "id">) => setDoc((d) => connectEdge(d, e)), [setDoc]);

  const updateNode = useCallback(
    (id: string, patch: Partial<WNode>) =>
      setDoc((d) => {
        const nodes = d.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n));
        if (!patch.inputs && !patch.outputs) return { ...d, nodes };
        const node = nodes.find((n) => n.id === id)!;
        const ins = new Set(node.inputs.map((p) => p.id));
        const outs = new Set(node.outputs.map((p) => p.id));
        const edges = d.edges.filter(
          (e) =>
            (e.target !== id || ins.has(e.targetPort)) &&
            (e.source !== id || outs.has(e.sourcePort)),
        );
        return { ...d, nodes, edges };
      }, false),
    [setDoc],
  );

  const updateComment = useCallback(
    (id: string, patch: Partial<WComment>) =>
      setDoc(
        (d) => ({ ...d, comments: d.comments.map((c) => (c.id === id ? { ...c, ...patch } : c)) }),
        false,
      ),
    [setDoc],
  );

  const focusOn = useCallback(
    (id: string) => {
      const n = doc.nodes.find((x) => x.id === id);
      const c = doc.comments.find((x) => x.id === id);
      const box = n
        ? { x: n.x, y: n.y, w: nodeWidth(n), h: nodeHeight(n) }
        : c
          ? { x: c.x, y: c.y, w: c.w, h: c.h }
          : null;
      if (!box) return;
      setViewport((v) => {
        const zoom = Math.max(0.6, Math.min(1.4, v.zoom));
        return {
          zoom,
          x: size.w / 2 - (box.x + box.w / 2) * zoom,
          y: size.h / 2 - (box.y + box.h / 2) * zoom,
        };
      });
      setSelection([id]);
    },
    [doc, size],
  );

  const fitView = useCallback(() => {
    const b = docBounds(doc);
    const w = b.maxX - b.minX + 160;
    const h = b.maxY - b.minY + 160;
    const zoom = Math.max(0.15, Math.min(1.5, Math.min(size.w / w, size.h / h)));
    setViewport({
      zoom,
      x: size.w / 2 - (b.minX + (b.maxX - b.minX) / 2) * zoom,
      y: size.h / 2 - (b.minY + (b.maxY - b.minY) / 2) * zoom,
    });
  }, [doc, size]);

  const [arranging, setArranging] = useState(false);
  const layoutFrame = useRef<number | null>(null);

  const autoLayout = useCallback(() => {
    if (layoutFrame.current !== null) {
      cancelAnimationFrame(layoutFrame.current);
      layoutFrame.current = null;
    }
    setDoc((d) => {
      const targets = computeTreeLayout(d);
      if (!targets) return d;
      const starts = new Map(d.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
      const hasMove = d.nodes.some((n) => {
        const t = targets.get(n.id);
        return t && (Math.round(t.x) !== n.x || Math.round(t.y) !== n.y);
      });
      if (!hasMove) return d;

      const DURATION = 480;
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();

      setArranging(true);
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / DURATION);
        const e = easeOutCubic(t);
        setDoc(
          (dd) => ({
            ...dd,
            nodes: dd.nodes.map((n) => {
              const s = starts.get(n.id);
              const target = targets.get(n.id);
              if (!s || !target) return n;
              return {
                ...n,
                x: Math.round(s.x + (target.x - s.x) * e),
                y: Math.round(s.y + (target.y - s.y) * e),
              };
            }),
          }),
          false,
        );
        if (t < 1) {
          layoutFrame.current = requestAnimationFrame(tick);
        } else {
          layoutFrame.current = null;
          setArranging(false);
        }
      };
      layoutFrame.current = requestAnimationFrame(tick);

      return { ...d };
    });
  }, [setDoc]);

  const insertNodeOnEdge = useCallback(
    (edgeId: string, nodeId: string) => {
      setDoc((d) => insertNodeOnEdgeDoc(d, edgeId, nodeId));
    },
    [setDoc],
  );

  const attachNode = useCallback(
    (id: string) => {
      const n = doc.nodes.find((x) => x.id === id);
      if (!n) return;
      setAttachments((a) =>
        a.some((x) => x.id === id) ? a : [...a, { id, label: n.title, category: n.category }],
      );
    },
    [doc],
  );

  const removeAttachment = useCallback(
    (id: string) => setAttachments((a) => a.filter((x) => x.id !== id)),
    [],
  );

  const sendChat = useCallback(
    (text: string) => {
      const atts = attachments;
      const userMsg: ChatMessage = {
        id: uid("msg"),
        role: "user",
        text,
        ...(atts.length ? { attachments: atts } : {}),
      };
      setChat((c) => [...c, userMsg]);
      setAttachments([]);
      const names = atts.map((a) => a.label);
      const reply = names.length
        ? `J'ai analysé ${names.length > 1 ? "les blocs" : "le bloc"} **${names.join("**, **")}**.\n\nCe bloc reçoit les leads en entrée, applique sa configuration puis transmet le résultat sur sa sortie. Suggestion : ajoute une condition en aval pour filtrer les enregistrements incomplets avant l'envoi.`
        : "Décris-moi la branche à optimiser, ou glisse un bloc du canevas ici pour que je l'inspecte (simulation locale, aucun appel réseau).";
      setTimeout(
        () => setChat((c) => [...c, { id: uid("msg"), role: "assistant", text: reply }]),
        420,
      );
    },
    [attachments],
  );

  useEffect(
    () => () => {
      if (layoutFrame.current !== null) cancelAnimationFrame(layoutFrame.current);
    },
    [],
  );

  const toggleSelect = useCallback((id: string, additive: boolean) => {
    setSelection((s) =>
      additive ? (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]) : [id],
    );
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      doc,
      getDoc,
      setDoc,
      selection,
      setSelection,
      toggleSelect,
      viewport,
      setViewport,
      size,
      setSize,
      settings,
      setSettings,
      addBlock,
      addComment,
      deleteSelected,
      duplicateSelected,
      copySelection,
      paste,
      groupSelected,
      disconnectNode,
      connect,
      updateNode,
      updateComment,
      focusOn,
      fitView,
      autoLayout,
      arranging,
      insertNodeOnEdge,
      undo,
      redo,
      chat,
      attachments,
      attachNode,
      removeAttachment,
      sendChat,
      centerWorld,
      codeEditorNodeId,
      openCodeEditor: setCodeEditorNodeId,
      closeCodeEditor: () => setCodeEditorNodeId(null),
      draggingBlockId,
      setDraggingBlockId,
    }),
    [
      doc,
      getDoc,
      setDoc,
      selection,
      toggleSelect,
      viewport,
      size,
      settings,
      addBlock,
      addComment,
      deleteSelected,
      duplicateSelected,
      copySelection,
      paste,
      groupSelected,
      disconnectNode,
      connect,
      updateNode,
      updateComment,
      focusOn,
      fitView,
      autoLayout,
      arranging,
      insertNodeOnEdge,
      undo,
      redo,
      chat,
      attachments,
      attachNode,
      removeAttachment,
      sendChat,
      centerWorld,
      codeEditorNodeId,
      draggingBlockId,
    ],
  );

  return <WorkflowCtx.Provider value={value}>{children}</WorkflowCtx.Provider>;
}

export function useWorkflow() {
  const ctx = useContext(WorkflowCtx);
  if (!ctx) throw new Error("useWorkflow must be used inside WorkflowProvider");
  return ctx;
}
