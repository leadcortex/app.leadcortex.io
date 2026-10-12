//frontend\components\ai-assistant\assistant-sidebar.tsx
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  GripVertical,
  History,
  Image as ImageIcon,
  Link2,
  Loader2,
  Paperclip,
  Plus,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { BrandLogoMark } from "@/components/brand-logo-mark";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSidebarSide, oppositeSide } from "@/lib/layout-prefs";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useFileDrop } from "@/hooks/use-file-drop";
import { useAssistantStream } from "@/hooks/use-assistant-stream";

import {
  getGreeting,
  getFeedbackValue,
  hashMessage,
  pageLabel,
  persistFeedback,
  type AssistantAttachment,
  type AssistantMessage,
  type FeedbackValue,
} from "./assistant-engine";
import { ModelSelector, useModelSelector } from "./model-selector";
import { getModelCapabilities } from "./assistant-engine-extensions";
import { ASSISTANT_OPEN_EVENT, type AssistantOpenDetail } from "./assistant-bus";

import { MessageContent } from "./message-content";
import { MessageActions } from "./message-actions";
import { PromptActions } from "./prompt-actions";
import { PromptRail } from "./prompt-rail";
import { MessageSearch } from "./message-search";
import { EditPromptSheet } from "./edit-prompt-sheet";
import { HistoryPanel } from "./history-panel";
import { AttachmentPillRow } from "./attachment-pill";
import { persistDensity, readDensity, type ChatDensity } from "./density-toggle";
import { demoConversation } from "./message-demo";
import { PromptLibraryPanel } from "./prompt-library-panel";
import { ShareMenu } from "./share-menu";
import { ChatSettingsMenu } from "./chat-settings-menu";
import { VoiceInputButton } from "./voice-input-button";
import { PinnedMessagesBar } from "./pinned-messages-bar";
import { ShortcutsHelp, useAssistantShortcuts } from "./shortcuts-help";
import { OnboardingHintBubble } from "./onboarding-tour";
import { AssistantErrorBoundary } from "./assistant-error-boundary";

import {
  createConversationId,
  deriveTitle,
  saveConversation,
  type Conversation,
} from "./conversation-store";
import { pushRecent } from "@/lib/prompt-library-store";
import { clearPins, loadPins, togglePin } from "@/lib/pinned-messages-store";
import { loadOnboarding, saveOnboarding } from "@/lib/assistant-onboarding";

/* ─── Constantes ─────────────────────────────────────────────────────── */

const SNAP_WIDTH = 300;
const DEFAULT_WIDTH = 380;
const MAX_WIDTH = 620;
const STORAGE_KEY = "lc.assistant.width";

const LABEL_STORAGE_KEY = "lc.assistant.labelY";
const MOBILE_LABEL_GAP = 8;

const TEXTAREA_MIN_PX = 52;
const TEXTAREA_MAX_PX = 168;

let uid = 0;
const nextId = () => `m${Date.now()}_${uid++}`;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/* ═══════════════════════════════════════════════════════════════════════
   ASSISTANT SIDEBAR (panneau + label + logique de drag/redimensionnement)
   ═══════════════════════════════════════════════════════════════════════ */

export function AssistantSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const ctx = pageLabel(pathname);
  const sidebarSide = useSidebarSide();
  const assistantSide = oppositeSide(sidebarSide);
  const isLeft = assistantSide === "left";

  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDrag, setMobileDrag] = useState<number | null>(null);

  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<AssistantAttachment[] | null>(null);

  const [labelY, setLabelY] = useState<number | null>(null);
  const [labelDragging, setLabelDragging] = useState(false);
  const labelMovedRef = useRef(false);
  const desktopLabelRef = useRef<HTMLButtonElement>(null);
  const mobileLabelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<AssistantOpenDetail>).detail ?? {};
      const isMobile = window.innerWidth < 768;
      if (isMobile) setMobileOpen(true);
      else setOpen(true);
      if (detail.prompt) setPendingPrompt(detail.prompt);
      if (detail.attachments && detail.attachments.length) {
        setPendingAttachments(detail.attachments);
      }
    };
    window.addEventListener(ASSISTANT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(ASSISTANT_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const v = Number(raw);
      if (!Number.isNaN(v)) setWidth(Math.min(MAX_WIDTH, Math.max(SNAP_WIDTH, v)));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(width));
  }, [width]);

  const getContentTop = useCallback(() => {
    const main = document.querySelector("main");
    if (main) {
      const rect = main.getBoundingClientRect();
      if (rect.top > 0) return rect.top;
    }
    const css = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--header-h") || "",
      10,
    );
    if (!Number.isNaN(css)) return css + 8;
    const header = document.querySelector("header");
    if (header) {
      const rect = header.getBoundingClientRect();
      if (rect.bottom > 0) return rect.bottom;
    }
    return 56;
  }, []);

  const getPenNavHeight = useCallback(() => {
    const css = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--pen-nav-h") || "",
      10,
    );
    return Number.isNaN(css) ? 64 : css;
  }, []);

  const clampLabelY = useCallback(
    (nextY: number, isMobile: boolean) => {
      const activeRef = isMobile ? mobileLabelRef : desktopLabelRef;
      const labelHeight = activeRef.current
        ? activeRef.current.getBoundingClientRect().height
        : 64;
      const contentTop = getContentTop();
      const top = contentTop + labelHeight / 2;
      const bottom =
        window.innerHeight -
        labelHeight / 2 -
        (isMobile ? getPenNavHeight() + MOBILE_LABEL_GAP : 0);
      return clamp(nextY, top, bottom);
    },
    [getContentTop, getPenNavHeight],
  );

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const raw = window.localStorage.getItem(LABEL_STORAGE_KEY);
    const initial =
      raw !== null && !Number.isNaN(Number(raw)) ? Number(raw) : window.innerHeight / 2;
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setLabelY(clampLabelY(initial, isMobile));
      });
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [clampLabelY]);

  useEffect(() => {
    const onResize = () => {
      setLabelY((y) => (y === null ? y : clampLabelY(y, window.innerWidth < 768)));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampLabelY]);

  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setDragging(true);
      const onMove = (ev: PointerEvent) => {
        const raw = isLeft ? ev.clientX : window.innerWidth - ev.clientX;
        if (raw < SNAP_WIDTH) {
          setOpen(false);
          return;
        }
        setWidth(Math.min(MAX_WIDTH, raw));
      };
      const onUp = () => {
        setDragging(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };
      document.body.style.userSelect = "none";
      document.body.style.cursor = "ew-resize";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [isLeft],
  );

  const startLabelDrag = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      labelMovedRef.current = false;
      setLabelDragging(true);
      const startY = e.clientY;
      const isMobile = window.innerWidth < 768;
      const onMove = (ev: PointerEvent) => {
        if (Math.abs(ev.clientY - startY) > 3) labelMovedRef.current = true;
        setLabelY(clampLabelY(ev.clientY, isMobile));
      };
      const onUp = () => {
        setLabelDragging(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };
      document.body.style.userSelect = "none";
      document.body.style.cursor = "ns-resize";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [clampLabelY],
  );

  useEffect(() => {
    if (labelY !== null && !labelDragging) {
      window.localStorage.setItem(LABEL_STORAGE_KEY, String(labelY));
    }
  }, [labelY, labelDragging]);

  useEffect(() => {
    let startX: number | null = null;
    let startY = 0;
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      if (mobileOpen) return;
      if (isLeft) {
        if (t.clientX < 32) {
          startX = t.clientX;
          startY = t.clientY;
        }
      } else {
        if (t.clientX > window.innerWidth - 32) {
          startX = t.clientX;
          startY = t.clientY;
        }
      }
    };
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (startX === null || !t) return;
      const dx = isLeft ? t.clientX - startX : startX - t.clientX;
      const dy = Math.abs(startY - t.clientY);
      if (dx > 10 && dy < 60) setMobileDrag(Math.min(dx, window.innerWidth * 0.75));
      if (dx > 60 && dy < 60) {
        setMobileOpen(true);
        setMobileDrag(null);
        startX = null;
      }
    };
    const onEnd = () => {
      startX = null;
      setMobileDrag(null);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [mobileOpen, isLeft]);

  const panelTouch = useRef<number | null>(null);
  const onPanelTouchStart = (e: React.TouchEvent) => {
    panelTouch.current = e.touches[0]?.clientX ?? null;
  };
  const onPanelTouchEnd = (e: React.TouchEvent) => {
    const start = panelTouch.current;
    const end = e.changedTouches[0]?.clientX;
    if (start !== null && end !== undefined) {
      const delta = isLeft ? start - end : end - start;
      if (delta > 70) setMobileOpen(false);
    }
    panelTouch.current = null;
  };

  const labelStyle = useMemo(() => {
    if (labelY === null) return { top: "50%" } as React.CSSProperties;
    return { top: labelY } as React.CSSProperties;
  }, [labelY]);

  const consumePending = useCallback(() => {
    setPendingPrompt(null);
    setPendingAttachments(null);
  }, []);

  const sideClasses = {
    desktopLabelPos: isLeft
      ? "left-0 rounded-r-xl border-r-0 border-l"
      : "right-0 rounded-l-xl border-l-0 border-r",
    panelPos: isLeft ? "left-0 border-r" : "right-0 border-l",
    asideRounded: isLeft ? "rounded-r-2xl" : "rounded-l-2xl",
    mobilePanelPos: isLeft ? "left-0" : "right-0",
    mobilePanelRounded: isLeft ? "rounded-r-2xl" : "rounded-l-2xl",
    mobilePanelBorder: isLeft ? "border-r" : "border-l",
    mobileHidden: isLeft ? "-translate-x-full" : "translate-x-full",
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="hidden md:block">
        {!open ? (
          <button
            ref={desktopLabelRef}
            onPointerDown={startLabelDrag}
            onClick={() => {
              if (!labelMovedRef.current) setOpen(true);
            }}
            aria-label="Ouvrir l'assistant IA"
            className={cn(
              "fixed z-40 flex -translate-y-1/2 cursor-ns-resize touch-none select-none flex-col items-center gap-2 border-border bg-surface/90 px-2 py-2.5 shadow-lg backdrop-blur transition-colors hover:bg-secondary/40",
              sideClasses.desktopLabelPos,
              labelDragging && "bg-secondary/60",
            )}
            style={labelStyle}
          >
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10">
              <BrandLogoMark size={18} />
            </span>
            <span className="text-[10px] tracking-widest text-muted-foreground [writing-mode:vertical-rl]">
              ASSISTANT IA
            </span>
            <GripVertical className="size-3 text-muted-foreground/60" />
            {isLeft ? (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronLeft className="size-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className={cn("fixed inset-y-0 z-40 flex", isLeft ? "left-0" : "right-0")}>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Redimensionner l'assistant IA"
              onPointerDown={startDrag}
              onDoubleClick={() => setOpen(false)}
              className={cn(
                "group relative my-5 w-0.5 shrink-0 cursor-ew-resize self-stretch rounded-full transition-colors",
                dragging ? "bg-primary/60" : "bg-border/60 hover:bg-primary/40",
                isLeft && "order-2",
              )}
            >
              <span className="absolute top-1/2 -left-0.5 h-5 w-2 -translate-y-1/2 rounded-full bg-border/80 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>

            <aside
              style={{ width }}
              className={cn(
                "relative h-full border-border bg-surface shadow-2xl",
                sideClasses.asideRounded,
                sideClasses.panelPos,
                !dragging && "transition-[width] duration-200 ease-out",
              )}
            >
              <AssistantErrorBoundary>
                <AssistantPanel
                  ctx={ctx}
                  onClose={() => setOpen(false)}
                  pendingPrompt={pendingPrompt}
                  pendingAttachments={pendingAttachments}
                  onPendingConsumed={consumePending}
                />
              </AssistantErrorBoundary>
            </aside>
          </div>
        )}
      </div>

      {mobileDrag !== null && !mobileOpen && (
        <div
          className={cn(
            "pointer-events-none fixed inset-y-0 z-40 w-1 bg-primary/60 md:hidden",
            isLeft ? "left-0" : "right-0",
          )}
          style={{ transform: `translateX(${isLeft ? mobileDrag : -mobileDrag}px)` }}
        />
      )}

      <div
        className={cn(
          "fixed inset-0 z-[60] transition-opacity duration-200 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
        <div
          onTouchStart={onPanelTouchStart}
          onTouchEnd={onPanelTouchEnd}
          style={{ width: "clamp(280px, 75vw, 92vw)" }}
          className={cn(
            "absolute inset-y-0 bottom-0 border-border bg-surface shadow-2xl transition-transform duration-250 ease-out",
            sideClasses.mobilePanelPos,
            sideClasses.mobilePanelRounded,
            sideClasses.mobilePanelBorder,
            mobileOpen ? "translate-x-0" : sideClasses.mobileHidden,
          )}
        >
          <AssistantErrorBoundary>
            <AssistantPanel
              ctx={ctx}
              mobile
              onClose={() => setMobileOpen(false)}
              pendingPrompt={pendingPrompt}
              pendingAttachments={pendingAttachments}
              onPendingConsumed={consumePending}
            />
          </AssistantErrorBoundary>
        </div>
      </div>

      {!mobileOpen && (
        <button
          ref={mobileLabelRef}
          onPointerDown={startLabelDrag}
          onClick={() => {
            if (!labelMovedRef.current) setMobileOpen(true);
          }}
          aria-label="Ouvrir l'assistant IA"
          className={cn(
            "fixed z-[60] flex -translate-y-1/2 cursor-ns-resize touch-none select-none flex-col items-center gap-1.5 border border-border bg-surface/90 px-2 py-2.5 shadow-lg backdrop-blur transition-colors md:hidden",
            isLeft ? "left-0 rounded-r-xl border-l-0" : "right-0 rounded-l-xl border-r-0",
            labelDragging && "bg-secondary/60",
          )}
          style={labelStyle}
        >
          <span className="grid size-7 place-items-center rounded-lg bg-primary/10">
            <BrandLogoMark size={18} />
          </span>
          <GripVertical className="size-3 text-muted-foreground/60" />
        </button>
      )}
    </TooltipProvider>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ASSISTANT PANEL
   ═══════════════════════════════════════════════════════════════════════ */

function AssistantPanel({
  ctx,
  onClose,
  mobile = false,
  pendingPrompt,
  pendingAttachments,
  onPendingConsumed,
}: {
  ctx: string;
  onClose: () => void;
  mobile?: boolean;
  pendingPrompt?: string | null;
  pendingAttachments?: AssistantAttachment[] | null;
  onPendingConsumed?: () => void;
}) {
  /* ─── État principal ───────────────────────────────────────────────── */
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<AssistantAttachment[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackValue>>({});
  const [editingPrompt, setEditingPrompt] = useState<{
    messageId: string;
    text: string;
  } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [density, setDensity] = useState<ChatDensity>(readDensity);
  const [conversationId, setConversationId] = useState<string>(() => createConversationId());
  const [conversationCreatedAt, setConversationCreatedAt] = useState<number>(() => Date.now());
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [onboarding, setOnboarding] = useState(() => loadOnboarding());

  /* ─── Refs ─────────────────────────────────────────────────────────── */
  const listRef = useRef<HTMLDivElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ─── Stores annexes ───────────────────────────────────────────────── */
  const { selectedConfig, updateSelection } = useModelSelector();
  const capabilities = useMemo(() => getModelCapabilities(selectedConfig), [selectedConfig]);
  const { firstName } = useCurrentUser();
  const greeting = useMemo(() => getGreeting(firstName), [firstName]);

  /* ─── Streaming ────────────────────────────────────────────────────── */
  const stream = useAssistantStream();
  const isStreaming = stream.phase === "thinking" || stream.phase === "streaming";
  const streamError = stream.phase === "error" ? stream.error : null;

  /* ─── Effets ───────────────────────────────────────────────────────── */

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming, stream.text]);

  useEffect(() => {
    persistDensity(density);
  }, [density]);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = clamp(el.scrollHeight, TEXTAREA_MIN_PX, TEXTAREA_MAX_PX);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > TEXTAREA_MAX_PX ? "auto" : "hidden";
  }, [input]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    const timer = window.setTimeout(() => {
      const clean = messages.filter((m) => m.text.trim().length > 0);
      if (!clean.length) return;
      const conv: Conversation = {
        id: conversationId,
        title: deriveTitle(clean),
        messages: clean,
        createdAt: conversationCreatedAt,
        updatedAt: Date.now(),
      };
      saveConversation(conv);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [messages, conversationId, conversationCreatedAt]);

  useEffect(() => {
    setPinnedIds(loadPins(conversationId));
  }, [conversationId]);

  useEffect(() => {
    if (!pendingPrompt) return;
    setInput(pendingPrompt);
    if (pendingAttachments?.length) {
      setAttachments((prev) => {
        const existing = new Set(prev.map((a) => a.id));
        const incoming = pendingAttachments.filter((a) => !existing.has(a.id));
        return incoming.length ? [...prev, ...incoming] : prev;
      });
    }
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      const len = el.value.length;
      try {
        el.setSelectionRange(len, len);
      } catch {
        /* no-op */
      }
      el.scrollTop = el.scrollHeight;
    });
    onPendingConsumed?.();
  }, [pendingPrompt, pendingAttachments, onPendingConsumed]);

  useEffect(() => {
    setFeedbackMap((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const m of messages) {
        if (m.role !== "agent") continue;
        if (next[m.id] !== undefined) continue;
        const stored = getFeedbackValue(hashMessage(m.text, m.role));
        if (stored) {
          next[m.id] = stored;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [messages]);

  /* ─── Fichiers ─────────────────────────────────────────────────────── */

  const filesToAttachments = useCallback(
    (files: File[]): AssistantAttachment[] =>
      files.map((f) => {
        const isImage = f.type.startsWith("image/");
        return {
          id: nextId(),
          name: f.name,
          size: f.size,
          kind: isImage ? "image" : "document",
          ...(isImage ? { url: URL.createObjectURL(f) } : {}),
        };
      }),
    [],
  );

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setAttachments((a) => [...a, ...filesToAttachments(Array.from(files))]);
  };

  const { isDragging, bind: dropBind } = useFileDrop({
    onDrop: (files) => setAttachments((a) => [...a, ...filesToAttachments(files)]),
  });

  const addContext = () => {
    setAttachments((a) => {
      if (a.some((x) => x.kind === "context" && x.name === ctx)) return a;
      return [...a, { id: nextId(), name: ctx, size: 0, kind: "context" }];
    });
  };

  /* ─── Envoi / streaming ────────────────────────────────────────────── */

  const launchStream = useCallback(
    (prompt: string, atts: AssistantAttachment[]) => {
      stream.start({
        prompt,
        context: ctx,
        attachments: atts,
        history: messages.slice(-6),
        onDone: (fullText) => {
          setMessages((m) => [
            ...m,
            {
              id: nextId(),
              role: "agent",
              text: fullText,
              createdAt: Date.now(),
            },
          ]);
        },
        onError: (msg) => {
          toast.error(msg);
        },
      });
    },
    [ctx, messages, stream],
  );

  const send = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value && attachments.length === 0) return;
    const sent = attachments;
    setMessages((m) => [
      ...m,
      {
        id: nextId(),
        role: "user",
        text: value,
        createdAt: Date.now(),
        attachments: sent,
      },
    ]);
    setInput("");
    setAttachments([]);
    pushRecent(value, ctx);
    if (!onboarding.welcomeSeen) {
      setOnboarding(saveOnboarding({ welcomeSeen: true }));
    }
    launchStream(value, sent);
  };

  /* ─── Actions annexes ──────────────────────────────────────────────── */

  const startNewConversation = () => {
    stream.abort();
    setMessages([]);
    setFeedbackMap({});
    setConversationId(createConversationId());
    setConversationCreatedAt(Date.now());
  };

  const loadConversation = (conv: Conversation) => {
    stream.abort();
    setMessages(conv.messages);
    setFeedbackMap({});
    setConversationId(conv.id);
    setConversationCreatedAt(conv.createdAt);
  };

  const loadDemo = () => {
    stream.abort();
    setMessages(demoConversation());
    setFeedbackMap({});
    setConversationId(createConversationId());
    setConversationCreatedAt(Date.now());
  };

  const handleRelaunch = (messageId: string) => {
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx < 0) return;
    const userMsg = messages[idx]!;
    if (userMsg.role !== "user") return;
    setMessages(messages.slice(0, idx + 1));
    launchStream(userMsg.text, userMsg.attachments ?? []);
  };

  const handleRegenerate = (messageId: string) => {
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx < 0) return;
    const agentMsg = messages[idx]!;
    if (agentMsg.role !== "agent") return;
    const userMsg = [...messages.slice(0, idx)].reverse().find((m) => m.role === "user");
    if (!userMsg) return;
    const userIdx = messages.indexOf(userMsg);
    setMessages(messages.slice(0, userIdx + 1));
    launchStream(userMsg.text, userMsg.attachments ?? []);
  };

  const handleEditPrompt = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || msg.role !== "user") return;
    setEditingPrompt({ messageId, text: msg.text });
  };

  const handleSaveEditedPrompt = (newText: string) => {
    if (!editingPrompt) return;
    const idx = messages.findIndex((m) => m.id === editingPrompt.messageId);
    if (idx < 0) {
      setEditingPrompt(null);
      return;
    }
    const original = messages[idx]!;
    const edited: AssistantMessage = { ...original, text: newText, edited: true };
    setMessages([...messages.slice(0, idx), edited]);
    setEditingPrompt(null);
    launchStream(newText, original.attachments ?? []);
  };

  const handleFeedback = (messageId: string, value: FeedbackValue) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    setFeedbackMap((prev) => ({ ...prev, [messageId]: value }));
    if (value === null) return;
    persistFeedback({
      hash: hashMessage(msg.text, msg.role),
      role: msg.role,
      value,
      snippet: msg.text.slice(0, 140),
      at: Date.now(),
    });
  };

  const handlePinToggle = (messageId: string) => {
    const next = togglePin(conversationId, messageId);
    setPinnedIds(next);
  };

  const jumpToMessage = (id: string) => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-message-id="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useAssistantShortcuts({
    onToggleFocus: () => {},
    onOpenHelp: () => setHelpOpen(true),
    onNewConversation: startNewConversation,
  });

  const lastAgentId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]!;
      if (m.role === "agent") return m.id;
    }
    return null;
  }, [messages]);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    if (!onboarding.searchHintSeen) {
      setOnboarding(saveOnboarding({ searchHintSeen: true }));
    }
  }, [onboarding.searchHintSeen]);

  const spacing = density === "compact" ? "space-y-1.5 py-2" : "space-y-3 py-3";
  const bubbleText =
    density === "compact" ? "text-[12px] leading-snug" : "text-[12.5px] leading-relaxed";

  const showSearchHint =
    !onboarding.searchHintSeen && messages.length >= 3 && !searchOpen;

  return (
    <div className="flex h-full min-w-[280px] flex-col">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 border-b border-border px-2.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-label="Fermer l'assistant"
            title="Fermer l'assistant"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.8} />
          </button>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-tight">Assistant IA</p>
            <p className="truncate text-[11px] text-muted-foreground">Contexte : {ctx}</p>
          </div>
        </div>

        <div className="relative flex shrink-0 items-center gap-0">
          {showSearchHint && (
            <OnboardingHintBubble
              visible
              title="Recherche rapide"
              body="Ctrl+F cherche dans toute la conversation et saute au message."
              placement="bottom"
              onDismiss={() => setOnboarding(saveOnboarding({ searchHintSeen: true }))}
              className="right-0 top-full"
            />
          )}

          <IconBtn
            label="Nouvelle conversation (Ctrl+Shift+O)"
            size="size-7"
            onClick={startNewConversation}
          >
            <Plus className="size-4" strokeWidth={1.6} />
          </IconBtn>

          <IconBtn label="Historique" size="size-7" onClick={() => setHistoryOpen(true)}>
            <History className="size-4" strokeWidth={1.6} />
          </IconBtn>

          <ChatSettingsMenu
            density={density}
            onDensityChange={setDensity}
            onOpenSearch={openSearch}
            onOpenLibrary={() => setLibraryOpen(true)}
            onOpenHelp={() => setHelpOpen(true)}
            onLoadDemo={loadDemo}
          />
        </div>
      </header>

      {/* ─── Sélecteur de modèle + bouton Partager (même rangée) ─── */}
      <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
        <div className="min-w-0 flex-1">
          <ModelSelector selectedConfig={selectedConfig} onConfigChange={updateSelection} />
        </div>
        <ShareMenu
          variant="round"
          messages={messages}
          title={deriveTitle(messages)}
          createdAt={conversationCreatedAt}
        />
      </div>

      {/* ─── Bandeau d'épingles ─────────────────────────────────────── */}
      <PinnedMessagesBar
        messages={messages}
        pinnedIds={pinnedIds}
        onJump={jumpToMessage}
        onUnpin={(id) => handlePinToggle(id)}
        onClearAll={() => {
          clearPins(conversationId);
          setPinnedIds([]);
        }}
      />

      {/* ─── Liste des messages ─────────────────────────────────────── */}
      <div className="relative min-h-0 flex-1" {...dropBind}>
        <MessageSearch
          open={searchOpen}
          messages={messages}
          scrollRef={listRef}
          onClose={() => setSearchOpen(false)}
        />

        <div
          ref={listRef}
          data-density={density}
          className={cn(
            "h-full overflow-y-auto overscroll-contain scrollbar-none px-3 pr-10",
            spacing,
          )}
        >
          {messages.length === 0 && !isStreaming && (
            <EmptyState salutation={greeting.salutation} pitch={greeting.pitch} ctx={ctx} />
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              data-message-id={m.id}
              className={cn(
                "group/msg flex flex-col gap-1 rounded-xl",
                m.role === "user" ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "flex w-full gap-2",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {m.role === "agent" && (
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-primary/10">
                    <BrandLogoMark size={14} />
                  </span>
                )}

                <div className="min-w-0 max-w-[85%] space-y-1.5">
                  {m.attachments && m.attachments.length > 0 && (
                    <AttachmentPillRow
                      attachments={m.attachments}
                      align={m.role === "user" ? "end" : "start"}
                    />
                  )}
                  {m.text && (
                    <div
                      className={cn(
                        bubbleText,
                        m.role === "user" &&
                          "rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground",
                      )}
                    >
                      {m.role === "user" ? (
                        <>
                          <p className="whitespace-pre-wrap break-words">{m.text}</p>
                          {m.edited && (
                            <p className="mt-1 text-[9.5px] uppercase tracking-wider opacity-70">
                              modifié
                            </p>
                          )}
                        </>
                      ) : (
                        <MessageContent text={m.text} />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions agent — toujours visibles */}
              {m.role === "agent" && m.text && !isStreaming && (
                <MessageActions
                  message={m}
                  feedback={feedbackMap[m.id] ?? null}
                  onFeedback={(v) => handleFeedback(m.id, v)}
                  onRegenerate={
                    m.id === lastAgentId ? () => handleRegenerate(m.id) : undefined
                  }
                  className="ml-8"
                />
              )}

              {/* Actions utilisateur — toujours visibles */}
              {m.role === "user" && m.text && (
                <div className="mr-0 flex w-full items-center justify-end">
                  <PromptActions
                    message={m}
                    onRelaunch={() => handleRelaunch(m.id)}
                    onEdit={() => handleEditPrompt(m.id)}
                    disabled={isStreaming}
                  />
                </div>
              )}
            </div>
          ))}

          {isStreaming && (
            <div className="group/msg flex flex-col gap-1">
              <div className="flex w-full gap-2 justify-start">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-primary/10">
                  <BrandLogoMark size={14} />
                </span>
                <div className="min-w-0 max-w-[85%] space-y-1.5">
                  {stream.text ? (
                    <div className={cn(bubbleText)}>
                      <MessageContent text={stream.text} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>
                        <span className="font-medium text-foreground/80">
                          {capabilities.research.name}
                        </span>{" "}
                        cherche,{" "}
                        <span className="font-medium text-foreground/80">
                          {capabilities.work.name}
                        </span>{" "}
                        rédige · {ctx}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {streamError && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-[11.5px] text-destructive">
              <p className="font-medium">Erreur de génération</p>
              <p className="mt-0.5 text-destructive/85">{streamError}</p>
            </div>
          )}
        </div>

        {/* Rail de prompts utilisateur (DeepSeek-like) */}
        <PromptRail messages={messages} scrollRef={listRef} onJump={jumpToMessage} />

        {isDragging && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-2 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-primary/[0.06] backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-2 text-primary">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary/15">
                <Paperclip className="size-5" strokeWidth={1.8} />
              </span>
              <p className="text-[12.5px] font-medium">Déposez vos fichiers ici</p>
              <p className="text-[10.5px] opacity-75">PDF, images, CSV, DOCX…</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Composeur ─────────────────────────────────────────────── */}
      <div
        className="border-t border-border p-2.5"
        style={
          mobile
            ? {
                paddingBottom:
                  "calc(2.5 * 0.25rem + var(--pen-nav-h, 64px) + env(safe-area-inset-bottom))",
              }
            : undefined
        }
      >
        <div className="rounded-2xl border border-border bg-background/70 transition-colors focus-within:border-primary/50">
          {attachments.length > 0 && (
            <div className="rounded-t-2xl border-b border-border/60 bg-secondary/25 px-1.5 py-1.5">
              <AttachmentPillRow
                attachments={attachments}
                variant="input"
                align="start"
                onRemove={(id) => setAttachments((p) => p.filter((x) => x.id !== id))}
              />
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Demandez quelque chose à propos de ${ctx}...`}
            className="block w-full resize-none overflow-y-auto bg-transparent px-3 pt-2.5 text-[12.5px] leading-relaxed outline-none placeholder:text-muted-foreground"
            style={{ minHeight: TEXTAREA_MIN_PX, maxHeight: TEXTAREA_MAX_PX }}
          />
          <div className="flex items-center gap-1 px-2 pb-2">
            <AddMenu
              ctx={ctx}
              onPickDocument={() => fileInput.current?.click()}
              onPickImage={() => imageInput.current?.click()}
              onPickContext={addContext}
            />
            <VoiceInputButton disabled={isStreaming} />
            {isStreaming && (
              <button
                type="button"
                onClick={() => stream.abort()}
                className="ml-auto rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Arrêter
              </button>
            )}
            <button
              onClick={() => send()}
              aria-label="Envoyer"
              className={cn(
                "grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40",
                !isStreaming && "ml-auto",
              )}
              disabled={(!input.trim() && attachments.length === 0) || isStreaming}
            >
              <Send className="size-4" strokeWidth={1.6} />
            </button>
          </div>
        </div>
        <input
          ref={imageInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* ─── Modales / panneaux ─────────────────────────────────────── */}
      <EditPromptSheet
        open={!!editingPrompt}
        initialText={editingPrompt?.text ?? ""}
        onOpenChange={(open) => !open && setEditingPrompt(null)}
        onSubmit={handleSaveEditedPrompt}
      />

      <HistoryPanel
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        currentId={conversationId}
        onSelect={loadConversation}
        onNew={startNewConversation}
      />

      <PromptLibraryPanel
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        currentDraft={input}
        currentCtx={ctx}
        onUsePrompt={(text) => {
          setInput(text);
          requestAnimationFrame(() => textareaRef.current?.focus());
        }}
      />

      <ShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SOUS-COMPOSANTS LOCAUX
   ═══════════════════════════════════════════════════════════════════════ */

function IconBtn({
  label,
  onClick,
  children,
  size = "size-8",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  size?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground",
        size,
      )}
    >
      {children}
    </button>
  );
}

function AddMenu({
  ctx,
  onPickDocument,
  onPickImage,
  onPickContext,
}: {
  ctx: string;
  onPickDocument: () => void;
  onPickImage: () => void;
  onPickContext: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [
    {
      id: "document" as const,
      label: "Document",
      desc: "PDF, DOCX, CSV…",
      icon: FileText,
      onSelect: onPickDocument,
    },
    {
      id: "image" as const,
      label: "Image",
      desc: "PNG, JPG, capture d'écran",
      icon: ImageIcon,
      onSelect: onPickImage,
    },
    {
      id: "context" as const,
      label: "Contexte",
      desc: `Page · ${ctx}`,
      icon: Link2,
      onSelect: onPickContext,
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={open ? "Fermer le menu d'ajout" : "Ajouter du contenu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground",
          open && "bg-secondary/60 text-foreground",
        )}
      >
        <Plus
          className={cn("size-4 transition-transform duration-200 ease-out", open && "rotate-45")}
          strokeWidth={1.8}
        />
      </button>

      <div
        role="menu"
        className={cn(
          "absolute bottom-full left-0 z-30 mb-2 w-60 origin-bottom-left rounded-2xl border border-border bg-surface p-1 shadow-xl transition-all duration-150 ease-out",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-1 scale-95 opacity-0",
        )}
      >
        <p className="px-2.5 pb-1 pt-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Ajouter
        </p>
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              role="menuitem"
              type="button"
              onClick={() => {
                it.onSelect();
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-secondary/60"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" strokeWidth={1.7} />
              </span>
              <span className="min-w-0">
                <span className="block text-[12px] font-medium leading-tight">{it.label}</span>
                <span className="block truncate text-[10.5px] leading-tight text-muted-foreground">
                  {it.desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({
  salutation,
  pitch,
  ctx,
}: {
  salutation: string;
  pitch: string;
  ctx: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 pb-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-full bg-primary/15 blur-2xl" />
        <BrandLogoMark size={64} />
      </div>

      <h3 className="mt-6 text-[15px] font-semibold leading-tight tracking-tight text-foreground">
        {salutation}
      </h3>
      <p className="mt-2 max-w-[36ch] text-[12.5px] leading-relaxed text-muted-foreground">
        {pitch}
      </p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="size-1.5 rounded-full bg-primary" />
        Contexte · {ctx}
      </div>
    </div>
  );
}