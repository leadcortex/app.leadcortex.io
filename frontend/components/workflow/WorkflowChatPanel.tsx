"use client";

/**
 * Chat du canevas de workflow.
 *
 * Réutilise les primitives visuelles de l'assistant latéral :
 *  - `MessageContent` (blocs de code + tableaux + Markdown inline)
 *  - `MessageActions` (copie réponse + copie code + audio + feedback + régénérer + coût)
 *  - `MessageScrollRail` (navigation rapide)
 *  - `SelectionQuoteButton` (citation dans le prochain prompt)
 *  - `MessageSearch` (Ctrl/⌘+F)
 *  - `DensityToggle` (comfortable / compact)
 *  - `useTypewriter` (streaming simulé)
 *  - `useFileDrop` (drag-and-drop de fichiers)
 *
 * Parle au store du workflow (`chat`, `attachments`, `sendChat`,
 * `removeAttachment`) — aucune donnée dupliquée.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Paperclip, Search, Send, Sparkles, X } from "lucide-react";
import { useWorkflow } from "@/lib/workflow/store";
import { categoryMap } from "@/lib/workflow/geometry";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/components/ai-assistant/message-content";
import { MessageActions } from "@/components/ai-assistant/message-actions";
import { MessageScrollRail } from "@/components/ai-assistant/message-scroll-rail";
import { MessageSearch } from "@/components/ai-assistant/message-search";
import {
  DensityToggle,
  persistDensity,
  readDensity,
  type ChatDensity,
} from "@/components/ai-assistant/density-toggle";
import {
  SelectionQuoteButton,
  useTextSelection,
} from "@/components/ai-assistant/selection-quote";
import {
  getFeedbackValue,
  hashMessage,
  persistFeedback,
  type AssistantMessage,
  type FeedbackValue,
} from "@/components/ai-assistant/assistant-engine";
import { useTypewriter } from "@/hooks/use-typewriter";
import { useFileDrop } from "@/hooks/use-file-drop";

/** Durée minimale du streaming simulé (ms). */
const STREAM_MIN_MS = 600;
/** Vitesse du streaming (caractères / seconde). */
const STREAM_CPS = 220;
/** Délai entre prompt envoyé et première réponse (ms). */
const THINKING_DELAY_MS = 420;

function AgentText({
  text,
  streaming,
  onStreamEnd,
}: {
  text: string;
  streaming: boolean;
  onStreamEnd: () => void;
}) {
  const shown = useTypewriter(text, { enabled: streaming });
  useEffect(() => {
    if (streaming && shown === text) onStreamEnd();
  }, [streaming, shown, text, onStreamEnd]);
  return <MessageContent text={streaming ? shown : text} />;
}

export function WorkflowChatPanel({ className }: { className?: string }) {
  const { chat, attachments, sendChat, removeAttachment } = useWorkflow();
  const [input, setInput] = useState("");
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackValue>>({});
  const [streamingIds, setStreamingIds] = useState<Set<string>>(() => new Set());
  const [thinking, setThinking] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [density, setDensity] = useState<ChatDensity>(readDensity);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Adaptation des messages du store → forme attendue par les primitives. */
  const messages = useMemo<AssistantMessage[]>(
    () =>
      chat.map((m, i) => ({
        id: m.id,
        role: m.role === "assistant" ? "agent" : "user",
        text: m.text,
        createdAt: Date.now() - (chat.length - i) * 1000,
      })),
    [chat],
  );

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [chat, thinking]);

  useEffect(() => {
    persistDensity(density);
  }, [density]);

  /* Raccourci global Ctrl/⌘+F pour ouvrir la recherche in-chat. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        // Ne s'active que si le focus est dans ce panneau (ou nulle part).
        const active = document.activeElement as HTMLElement | null;
        const inThisPanel = listRef.current?.contains(active) || !active;
        if (inThisPanel) {
          e.preventDefault();
          setSearchOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Restaure les feedbacks persistés pour les réponses déjà notées. */
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

  const handleFeedback = useCallback(
    (messageId: string, value: FeedbackValue) => {
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
    },
    [messages],
  );

  /**
   * Envoi : pousse le message utilisateur dans le store, puis déclenche un
   * streaming simulé sur la réponse qui sera ajoutée par le store.
   *
   * Le store ajoute lui-même la réponse via `sendChat`, avec un délai de
   * 420 ms (déjà dans `store.tsx`). On profite de ce délai pour basculer
   * `thinking`, puis on marque le nouvel id de réponse comme « streaming »
   * dès qu'il apparaît.
   */
  const pendingReplyIds = useRef<Set<string>>(new Set());

  const send = useCallback(() => {
    const value = input.trim();
    if (!value) return;
    const before = new Set(chat.map((m) => m.id));
    sendChat(value);
    setInput("");
    setThinking(true);
    // Repère les nouveaux messages assistant pour le streaming.
    const timer = window.setInterval(() => {
      const current = chat.find((m) => m.role === "assistant" && !before.has(m.id));
      if (current) {
        window.clearInterval(timer);
        setThinking(false);
        setStreamingIds((s) => {
          const n = new Set(s);
          n.add(current.id);
          return n;
        });
        pendingReplyIds.current.add(current.id);
        const durationMs = Math.max(STREAM_MIN_MS, (current.text.length / STREAM_CPS) * 1000);
        window.setTimeout(() => {
          setStreamingIds((s) => {
            if (!s.has(current.id)) return s;
            const n = new Set(s);
            n.delete(current.id);
            return n;
          });
        }, durationMs + 300);
      }
    }, 60);
    // Filet de sécurité : si au bout de 5 s rien n'est arrivé, on arrête.
    window.setTimeout(() => {
      window.clearInterval(timer);
      setThinking(false);
    }, 5000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, sendChat, chat]);

  const jumpToMessage = useCallback((id: string) => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-message-id="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const markStreamEnd = useCallback((id: string) => {
    setStreamingIds((s) => {
      if (!s.has(id)) return s;
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  }, []);

  const { selection, clearSelection } = useTextSelection();

  const quoteIntoInput = useCallback(
    (text: string) => {
      const quoted = text
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n");
      setInput((prev) => (prev ? `${prev}\n\n${quoted}\n\n` : `${quoted}\n\n`));
      clearSelection();
      textareaRef.current?.focus();
    },
    [clearSelection],
  );

  /* Drag-and-drop de fichiers sur la zone de conversation. */
  const { isDragging, bind: dropBind } = useFileDrop({
    onDrop: (files) => {
      // Le store du canevas ne gère que des blocs. On informe l'utilisateur
      // qu'un fichier n'a pas de sens ici et on ne l'ajoute pas : le clic
      // "paperclip" du composeur reste le seul canal d'ajout côté canevas.
      void files;
      // eslint-disable-next-line no-console
      console.info(
        "[workflow-chat] Drop de fichiers ignoré — ce chat traite des blocs, pas des fichiers.",
      );
    },
  });

  /* Dernier message agent — cible du bouton Régénérer. */
  const lastAgentId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]!.role === "agent") return messages[i]!.id;
    }
    return null;
  }, [messages]);

  /* Classes de densité — un seul jeu de deux lignes, pas de feuille externe. */
  const spacing = density === "compact" ? "space-y-1.5 py-2" : "space-y-3 py-3";
  const bubbleText = density === "compact" ? "text-[12px] leading-snug" : "text-[12.5px] leading-relaxed";

  return (
    <div className={cn("flex h-full min-w-0 flex-col overflow-hidden bg-panel", className)}>
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-3.5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-semibold leading-tight">
            Assistant du canevas
          </p>
          <p className="truncate text-[10.5px] text-muted-foreground">
            Simulé localement · glisse un bloc pour l'analyser
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Rechercher dans la conversation (Ctrl+F)"
          title="Rechercher (Ctrl+F)"
          className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
        >
          <Search className="size-3.5" strokeWidth={1.8} />
        </button>
        <DensityToggle density={density} onChange={setDensity} />
      </header>

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
            "h-full overflow-y-auto overscroll-contain scrollbar-none px-3 pr-7",
            spacing,
          )}
        >
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
                <div className="min-w-0 max-w-[85%] space-y-1.5">
                  <div
                    className={cn(
                      bubbleText,
                      m.role === "user" &&
                        "rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground",
                    )}
                  >
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    ) : (
                      <AgentText
                        text={m.text}
                        streaming={streamingIds.has(m.id)}
                        onStreamEnd={() => markStreamEnd(m.id)}
                      />
                    )}
                  </div>
                </div>
              </div>

              {m.role === "agent" && m.text && !streamingIds.has(m.id) && (
                <MessageActions
                  message={m}
                  feedback={feedbackMap[m.id] ?? null}
                  onFeedback={(v) => handleFeedback(m.id, v)}
                  onRegenerate={
                    m.id === lastAgentId
                      ? () => {
                          // Relance sur le dernier prompt utilisateur.
                          const lastUser = [...messages]
                            .reverse()
                            .find((x) => x.role === "user");
                          if (lastUser) {
                            setInput(lastUser.text);
                            textareaRef.current?.focus();
                          }
                        }
                      : undefined
                  }
                />
              )}
            </div>
          ))}

          {thinking && (
            <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              <span>L'assistant analyse le canevas…</span>
            </div>
          )}
        </div>

        <MessageScrollRail messages={messages} scrollRef={listRef} onJump={jumpToMessage} />

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
              <p className="text-[10.5px] opacity-75">(côté canevas : glisse plutôt un bloc)</p>
            </div>
          </div>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="border-t border-border bg-secondary/20 p-2">
          <p className="mb-1.5 px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            Blocs joints ({attachments.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {attachments.map((a) => {
              const color = categoryMap[a.category]?.color ?? "var(--muted-foreground)";
              return (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 text-[11px]"
                >
                  <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: color }} />
                  <span className="max-w-[120px] truncate">{a.label}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    aria-label={`Détacher ${a.label}`}
                    className="grid size-4 place-items-center rounded text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-t border-border p-2.5">
        <div className="rounded-2xl border border-border bg-background/70 transition-colors focus-within:border-primary/50">
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
            placeholder="Décris la branche à optimiser…"
            rows={2}
            className="block w-full resize-none bg-transparent px-3 pt-2.5 text-[12.5px] leading-relaxed outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-1 px-2 pb-2">
            <button
              type="button"
              onClick={send}
              aria-label="Envoyer"
              className="ml-auto grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              disabled={!input.trim()}
            >
              <Send className="size-4" strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </div>

      <SelectionQuoteButton selection={selection} onQuote={quoteIntoInput} />
    </div>
  );
}