// frontend/components/leadex-ia/leadex-page.tsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  FileUp,
  History,
  Loader2,
  MessageSquarePlus,
  PlayCircle,
  Send,
  ShieldAlert,
  Sparkles,
  Square,
  X,
} from "@/components/icons";
import { cn } from "@/lib/core/utils";
import { BrandLogoMark } from "@/components/brand/brand-logo-mark";
import { MessageContent } from "@/components/ai-assistant/message-content";
import {
  LEADEX_ACTIONS,
  LEADEX_CATEGORY_LABELS,
  LEADEX_CATEGORY_ORDER,
  getLeadexAction,
} from "./leadex-catalog";
import type { LeadexAction, LeadexJob, LeadexMessage, LeadexRisk } from "./leadex-types";

const RISK_STYLES: Record<
  LeadexRisk,
  { label: string; className: string; icon: typeof ShieldAlert }
> = {
  safe: {
    label: "Sûr",
    className: "border-success/30 bg-success/10 text-success",
    icon: CheckCircle2,
  },
  moderate: {
    label: "Modéré",
    className: "border-warning/30 bg-warning/10 text-warning",
    icon: Clock,
  },
  destructive: {
    label: "Destructif",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: ShieldAlert,
  },
};

let uid = 0;
const nextId = () => `lx_${Date.now()}_${uid++}`;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </p>
  );
}

export function LeadexPage() {
  const [selectedAction, setSelectedAction] = useState<LeadexAction | null>(null);
  const [messages, setMessages] = useState<LeadexMessage[]>([]);
  const [input, setInput] = useState("");
  const [jobs, setJobs] = useState<LeadexJob[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, LeadexAction[]>();
    for (const id of LEADEX_CATEGORY_ORDER) {
      const items = LEADEX_ACTIONS.filter((a) => a.category === id);
      if (items.length) map.set(id, items);
    }
    return map;
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, 52), 168);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > 168 ? "auto" : "hidden";
  }, [input]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamingText, streaming]);

  const selectAction = useCallback((action: LeadexAction) => {
    setSelectedAction(action);
    setMobileCatalogOpen(false);
    if (action.examples[0]) {
      setInput(action.examples[0]);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, []);

  const simulateStream = useCallback((prompt: string) => {
    setStreaming(true);
    setStreamingText("");
    const answer = [
      `**Leadex IA** — action reçue.`,
      ``,
      `J'ai identifié ta demande : *« ${prompt} »*.`,
      ``,
      `Étapes prévues :`,
      `- Analyse des filtres et du lot cible`,
      `- Exécution de l'opération en tâche de fond`,
      `- Rapport final avec le nombre d'éléments traités`,
      ``,
      `Le moteur d'exécution sera branché sur le backend dans la prochaine itération.`,
    ].join("\n");

    let i = 0;
    const timer = window.setInterval(() => {
      i += 8;
      setStreamingText(answer.slice(0, i));
      if (i >= answer.length) {
        window.clearInterval(timer);
        setStreaming(false);
        setStreamingText("");
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "agent",
            text: answer,
            createdAt: Date.now(),
            actionId: selectedAction?.id,
          },
        ]);
      }
    }, 24);
  }, [selectedAction]);

  const send = useCallback(() => {
    const value = input.trim();
    if (!value || streaming) return;
    const userMessage: LeadexMessage = {
      id: nextId(),
      role: "user",
      text: value,
      createdAt: Date.now(),
      actionId: selectedAction?.id,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const job: LeadexJob = {
      id: nextId(),
      actionId: selectedAction?.id ?? "free-prompt",
      actionLabel: selectedAction?.label ?? value.slice(0, 60),
      status: "running",
      progress: 0,
      total: 100,
      startedAt: Date.now(),
      steps: [
        { id: "analyze", label: "Analyse du lot cible", status: "running", startedAt: Date.now() },
        { id: "execute", label: "Exécution de l'opération", status: "pending" },
        { id: "report", label: "Génération du rapport", status: "pending" },
      ],
    };
    setJobs((prev) => [job, ...prev].slice(0, 8));

    simulateStream(value);
  }, [input, streaming, selectedAction, simulateStream]);

  const stopStream = useCallback(() => {
    setStreaming(false);
    setStreamingText("");
  }, []);

  const startNew = useCallback(() => {
    setMessages([]);
    setSelectedAction(null);
    setInput("");
    setStreamingText("");
    setStreaming(false);
  }, []);

  const hasMessages = messages.length > 0 || streaming;

  return (
    <div className="flex h-full min-h-0 w-full">
      <aside
        className={cn(
          "hidden w-[300px] shrink-0 flex-col border-r border-border/70 bg-surface/20 md:flex",
          mobileCatalogOpen && "flex",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-3.5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[12px] font-semibold leading-tight">Catalogue</p>
              <p className="text-[10px] text-muted-foreground">
                {LEADEX_ACTIONS.length} actions prêtes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileCatalogOpen(false)}
            className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary/60 hover:text-foreground md:hidden"
            aria-label="Fermer le catalogue"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {Array.from(grouped.entries()).map(([category, actions]) => (
            <div key={category} className="mb-2.5 last:mb-0">
              <SectionLabel>{LEADEX_CATEGORY_LABELS[category as keyof typeof LEADEX_CATEGORY_LABELS]}</SectionLabel>
              <ul className="flex flex-col gap-1">
                {actions.map((a) => {
                  const risk = RISK_STYLES[a.risk];
                  const RiskIcon = risk.icon;
                  const active = selectedAction?.id === a.id;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => selectAction(a)}
                        className={cn(
                          "group flex w-full flex-col gap-1 rounded-lg border px-2 py-1.5 text-left transition-colors",
                          active
                            ? "border-primary/60 bg-primary/[0.05]"
                            : "border-transparent hover:border-border hover:bg-background",
                        )}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-[11.5px] font-medium leading-tight">{a.label}</span>
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1 py-px text-[9px] font-semibold uppercase tracking-wider",
                              risk.className,
                            )}
                          >
                            <RiskIcon className="size-2.5" strokeWidth={2.2} />
                            {risk.label}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-[10.5px] leading-snug text-muted-foreground">
                          {a.description}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="shrink-0 border-t border-border/60 px-3 py-2">
          <SectionLabel>Jobs récents</SectionLabel>
          {jobs.length === 0 ? (
            <p className="px-1 text-[11px] text-muted-foreground">
              Aucun job exécuté pour l&apos;instant.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {jobs.map((j) => (
                <li
                  key={j.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5"
                >
                  {j.status === "running" ? (
                    <Loader2 className="size-3 shrink-0 animate-spin text-primary" />
                  ) : (
                    <CheckCircle2 className="size-3 shrink-0 text-success" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[11px]">{j.actionLabel}</span>
                  <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground">
                    {j.progress}/{j.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {mobileCatalogOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 md:hidden"
          onClick={() => setMobileCatalogOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 px-3 py-2.5 md:px-4 md:py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10">
              <BrandLogoMark size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-tight md:text-[14px]">Leadex IA</p>
              <p className="truncate text-[10.5px] text-muted-foreground md:text-[11px]">
                Agent fixe · opérations en masse
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setMobileCatalogOpen((v) => !v)}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground md:hidden"
              aria-label="Ouvrir le catalogue"
            >
              <PlayCircle className="size-4" />
            </button>
            <button
              type="button"
              onClick={startNew}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              aria-label="Nouvelle conversation"
              title="Nouvelle conversation"
            >
              <MessageSquarePlus className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setMessages([])}
              className="hidden size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground md:grid"
              aria-label="Historique"
              title="Historique (à venir)"
            >
              <History className="size-4" />
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1">
          <div
            ref={listRef}
            className="h-full overflow-y-auto overscroll-contain px-3 py-4 scrollbar-none md:px-6 md:py-6"
          >
            {!hasMessages ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="relative">
                  <span className="absolute inset-0 -z-10 rounded-full bg-primary/15 blur-2xl" />
                  <BrandLogoMark size={56} />
                </span>
                <h2 className="mt-4 text-[15px] font-semibold leading-tight md:text-[16px]">
                  Leadex IA, votre agent bulk
                </h2>
                <p className="mt-1.5 max-w-[42ch] text-[12px] leading-relaxed text-muted-foreground md:text-[12.5px]">
                  Choisissez une action dans le catalogue (import, enrichissement, scoring,
                  séquences, emails, export…) ou posez directement votre question.
                </p>
                <div className="mt-5 grid w-full max-w-xl grid-cols-1 gap-2 md:grid-cols-2">
                  {LEADEX_ACTIONS.slice(0, 4).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => selectAction(a)}
                      className="flex flex-col gap-1 rounded-xl border border-border bg-background px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-secondary/30"
                    >
                      <span className="flex items-center gap-1.5">
                        <Bot className="size-3.5 text-primary" />
                        <span className="text-[12px] font-medium leading-tight">{a.label}</span>
                      </span>
                      <span className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                        {a.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
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
                    <div
                      className={cn(
                        "min-w-0 max-w-[85%] space-y-1",
                        m.role === "user" &&
                          "rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground",
                      )}
                    >
                      {m.role === "agent" ? (
                        <MessageContent text={m.text} />
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-[12.5px] leading-relaxed">
                          {m.text}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {streaming && (
                  <div className="flex w-full gap-2 justify-start">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-primary/10">
                      <BrandLogoMark size={14} />
                    </span>
                    <div className="min-w-0 max-w-[85%]">
                      {streamingText ? (
                        <MessageContent text={streamingText} />
                      ) : (
                        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                          <Loader2 className="size-3.5 animate-spin" />
                          Leadex IA réfléchit…
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-border/70 p-2.5 md:p-3">
          <div className="mx-auto w-full max-w-3xl">
            {selectedAction && (
              <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/[0.05] px-2 py-1.5">
                <Sparkles className="size-3 shrink-0 text-primary" />
                <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-primary">
                  {selectedAction.label}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedAction(null)}
                  className="grid size-5 shrink-0 place-items-center rounded text-primary/70 hover:bg-primary/10 hover:text-primary"
                  aria-label="Retirer l'action"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-background transition-colors focus-within:border-primary/50">
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
                placeholder={
                  selectedAction
                    ? `Décrivez votre demande pour « ${selectedAction.label} »…`
                    : "Demandez à Leadex IA une opération en masse…"
                }
                className="block w-full resize-none overflow-y-auto bg-transparent px-3 pt-2.5 text-[12.5px] leading-relaxed outline-none placeholder:text-muted-foreground"
                style={{ minHeight: 52, maxHeight: 168 }}
              />
              <div className="flex items-center gap-1 px-2 pb-2">
                <button
                  type="button"
                  onClick={() => setMobileCatalogOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground md:hidden"
                >
                  <FileUp className="size-3.5" />
                  Actions
                </button>
                {streaming && (
                  <button
                    type="button"
                    onClick={stopStream}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Square className="size-3" />
                    Arrêter
                  </button>
                )}
                <button
                  type="button"
                  onClick={send}
                  disabled={!input.trim() || streaming}
                  aria-label="Envoyer"
                  className={cn(
                    "grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40",
                    !streaming && "ml-auto",
                  )}
                >
                  {streaming ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" strokeWidth={1.6} />
                  )}
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              Leadex IA peut traiter de gros volumes — vérifiez les actions destructives avant de
              lancer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
