//frontend\components\workflow\Terminal.tsx
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ChevronDown,
  ChevronUp,
  TerminalSquare,
  Trash2,
  CornerDownLeft,
  Loader2,
} from "lucide-react";
import { useWorkflow } from "@/lib/workflow/store";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  COMMANDS,
  complete,
  makeLine,
  runCommand,
  tokenize,
  type TerminalLine,
} from "@/lib/workflow/terminal-commands";
import {
  CHANNELS,
  consoleBus,
  type ConsoleChannel,
  type ConsoleEntry,
} from "@/lib/workflow/console-bus";
import { TOKEN_CLASS, highlightCommand, highlightOutput } from "@/lib/workflow/command-highlight";
import { cn } from "@/lib/utils";

/**
 * Sur écran tactile, on ne donne jamais le focus au champ automatiquement :
 * cela ouvrirait le clavier virtuel et ferait sauter la mise en page.
 */
const canAutoFocus = () =>
  typeof window !== "undefined" && !window.matchMedia("(pointer: coarse)").matches;

export const TERMINAL_COLLAPSED_HEIGHT = 34;
const MIN_HEIGHT = 140;
const DEFAULT_HEIGHT = 260;

const KIND_CLASS: Record<TerminalLine["kind"], string> = {
  input: "text-term-prompt",
  info: "text-term-fg",
  muted: "text-term-muted",
  success: "text-term-success",
  warning: "text-term-warning",
  error: "text-term-error",
};

const BANNER: TerminalLine[] = [
  makeLine("muted", "workflow-console · autonome, 100 % local — aucune dépendance externe"),
  makeLine("muted", "Tape `help` pour les commandes, `book` pour le livre, `Tab` pour compléter."),
];

function SynTokens({ tokens }: { tokens: ReturnType<typeof highlightCommand> }) {
  return (
    <>
      {tokens.map((t, i) => (
        <span
          key={i}
          className={t.color ? undefined : TOKEN_CLASS[t.kind]}
          style={t.color ? { color: t.color } : undefined}
        >
          {t.text}
        </span>
      ))}
    </>
  );
}

/**
 * Une ligne du journal. Les saisies (et les commandes rejouées par l'agent)
 * passent par la grammaire des commandes ; les sorties neutres se contentent
 * d'une mise en valeur des identifiants. Les lignes typées (succès, erreur,
 * avertissement) gardent leur couleur d'état, plus lisible qu'un arc-en-ciel.
 */
function LogLine({ entry }: { entry: ConsoleEntry }) {
  const colored =
    entry.kind === "input" ? (
      <SynTokens tokens={highlightCommand(entry.text)} />
    ) : entry.kind === "info" ? (
      <SynTokens tokens={highlightOutput(entry.text)} />
    ) : (
      entry.text
    );

  return (
    <pre
      className={cn(
        "whitespace-pre-wrap break-words",
        entry.kind === "input" || entry.kind === "info" ? undefined : KIND_CLASS[entry.kind],
      )}
    >
      {colored}
    </pre>
  );
}

const InputOverlay = forwardRef<HTMLPreElement, { value: string; fontSize: number }>(
  function InputOverlay({ value, fontSize }, ref) {
    return (
      <pre
        ref={ref}
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre font-mono leading-normal"
        style={{ fontSize }}
      >
        <SynTokens tokens={highlightCommand(value)} />
      </pre>
    );
  },
);

export function Terminal({
  docked = false,
  onHeightChange,
  onRegisterResize,
}: {
  docked?: boolean;
  onHeightChange?: (height: number) => void;

  onRegisterResize?: (adjust: (dy: number) => void) => void;
}) {
  const api = useWorkflow();
  const isMobile = useIsMobile();

  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [channel, setChannel] = useState<ConsoleChannel>("user");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIndex, setHistIndex] = useState(-1);
  const [hint, setHint] = useState<string | null>(null);

  const version = useSyncExternalStore(
    consoleBus.subscribe,
    consoleBus.version,
    consoleBus.version,
  );
  const entries = useMemo(() => consoleBus.read(channel), [channel, version]);
  const errorCount = useMemo(() => consoleBus.errorCount(), [version]);
  const agentRunning = useMemo(() => consoleBus.isRunning(), [version]);

  const banneredRef = useRef(false);
  useEffect(() => {
    if (banneredRef.current) return;
    banneredRef.current = true;
    if (consoleBus.read("user").length === 0) consoleBus.push("user", BANNER, "system");
  }, []);

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLPreElement>(null);

  const syncOverlayScroll = useCallback(() => {
    if (inputRef.current && overlayRef.current) {
      overlayRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  }, []);

  useLayoutEffect(() => {
    syncOverlayScroll();
  }, [input, syncOverlayScroll]);
  const apiRef = useRef(api);
  apiRef.current = api;

  const maxHeight = useCallback(() => {
    const vh = typeof window === "undefined" ? 800 : window.innerHeight;
    return Math.max(MIN_HEIGHT, Math.round(vh * (isMobile ? 0.55 : 0.75)));
  }, [isMobile]);

  const shellHeight = open ? height + TERMINAL_COLLAPSED_HEIGHT : TERMINAL_COLLAPSED_HEIGHT;

  useLayoutEffect(() => {
    onHeightChange?.(shellHeight);
  }, [shellHeight, onHeightChange]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [entries, open, channel]);

  const resizeRef = useRef<{ startY: number; startH: number } | null>(null);

  const onHandleDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      resizeRef.current = { startY: e.clientY, startH: height };
      const move = (ev: PointerEvent) => {
        const st = resizeRef.current;
        if (!st) return;
        const next = st.startH + (st.startY - ev.clientY);
        setHeight(Math.min(maxHeight(), Math.max(MIN_HEIGHT, next)));
      };
      const up = () => {
        resizeRef.current = null;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    },
    [height, maxHeight, open],
  );

  const adjustHeight = useCallback(
    (dy: number) => {
      setOpen(true);
      setHeight((h) => Math.min(maxHeight(), Math.max(MIN_HEIGHT, h + dy)));
    },
    [maxHeight],
  );

  useEffect(() => {
    onRegisterResize?.(adjustHeight);
  }, [adjustHeight, onRegisterResize]);

  const submit = useCallback((raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setHistory((h) => [...h.filter((x) => x !== value), value].slice(-100));
    setHistIndex(-1);
    setChannel("user");
    consoleBus.push("user", [makeLine("input", `❯ ${value}`)], "user");
    const out = runCommand(
      value,
      {
        ...apiRef.current,
        clear: () => consoleBus.clear("user"),
      },
      { source: "user" },
    );
    if (out.length) consoleBus.push("user", out, "user");
    setInput("");
    setHint(null);
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit(input);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const options = complete(input, apiRef.current.getDoc());
        if (!options.length) return;
        if (options.length === 1) {
          const tokens = tokenize(input);
          const trailing = /\s$/.test(input);
          if (trailing) setInput(`${input}${options[0]} `);
          else {
            tokens[tokens.length - 1] = options[0]!;
            setInput(`${tokens.join(" ")} `);
          }
          setHint(null);
        } else {
          setHint(options.slice(0, 12).join("  "));
        }
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!history.length) return;
        const idx = histIndex < 0 ? history.length - 1 : Math.max(0, histIndex - 1);
        setHistIndex(idx);
        setInput(history[idx] ?? "");
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (histIndex < 0) return;
        const idx = histIndex + 1;
        if (idx >= history.length) {
          setHistIndex(-1);
          setInput("");
        } else {
          setHistIndex(idx);
          setInput(history[idx] ?? "");
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        consoleBus.clear(channel);
      }
    },
    [channel, history, histIndex, input, submit],
  );

  /* Raccourci global : Ctrl/⌘ + ù ou Ctrl+` pour ouvrir/fermer la console. */
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.ctrlKey || ev.metaKey) && (ev.key === "`" || ev.key === "ù")) {
        ev.preventDefault();
        setOpen((v) => {
          if (!v && canAutoFocus()) setTimeout(() => inputRef.current?.focus(), 60);
          return !v;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const status = useMemo(
    () => `${api.doc.nodes.length} blocs · ${api.doc.edges.length} liens`,
    [api.doc.nodes.length, api.doc.edges.length],
  );

  const inputFontSize = isMobile ? 16 : 12;

  return (
    <div
      className={cn(
        "terminal-shell z-30 flex flex-col overflow-hidden border-x border-t border-term-border bg-term-bg text-term-fg",
        // Desktop : tuile arrondie façon Blender (marges latérales + coins
        // arrondis) pour ne plus "couper" les panneaux voisins.
        // Mobile : bande carrée pleine largeur, sans bordures latérales, qui se
        // lit comme un seul bloc avec la barre d'outils (au-dessus) et le dock
        // du chatbot (en dessous).
        // La console est l'élément élastique de la pile : si dock déplié +
        // console ouverte dépassent l'écran, c'est elle qui rétrécit (jamais
        // sous sa barre repliée), afin que la barre d'outils reste visible.
        docked
          ? "relative shrink border-x-0"
          : "absolute inset-x-2 rounded-xl border-b shadow-node",
      )}
      style={{
        height: shellHeight,
        ...(docked ? { minHeight: TERMINAL_COLLAPSED_HEIGHT } : { bottom: 8 }),
      }}
    >
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Redimensionner la console"
        onPointerDown={onHandleDown}
        onDoubleClick={() => setHeight(DEFAULT_HEIGHT)}
        className={cn(
          "group flex h-[34px] shrink-0 touch-none select-none items-center gap-2 px-2.5",
          open ? "cursor-ns-resize" : "cursor-pointer",
        )}
      >
        <TerminalSquare className="h-3.5 w-3.5 shrink-0 text-term-prompt" />
        <span className="shrink-0 font-mono text-[11px] font-semibold tracking-tight">console</span>

        {open ? (
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {CHANNELS.map((c) => (
              <button
                key={c.key}
                type="button"
                title={c.label}
                aria-pressed={channel === c.key}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setChannel(c.key);
                }}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10.5px] transition-colors",
                  channel === c.key
                    ? "bg-term-hover text-term-fg"
                    : "text-term-muted hover:bg-term-hover/60 hover:text-term-fg",
                )}
              >
                {c.short}
                {c.key === "errors" && errorCount > 0 && (
                  <span className="rounded bg-term-error/20 px-1 text-[9.5px] text-term-error">
                    {errorCount}
                  </span>
                )}
                {c.key === "agent" && agentRunning && (
                  <Loader2 className="h-3 w-3 animate-spin text-term-prompt" />
                )}
              </button>
            ))}
            <span className="ml-auto shrink-0 truncate pl-2 font-mono text-[10.5px] text-term-muted">
              {status}
            </span>
          </div>
        ) : (
          <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-term-muted">
            {`· rétractée — clic pour ouvrir (Ctrl+\`)${errorCount > 0 ? ` · ${errorCount} à traiter` : ""}`}
          </span>
        )}

        {open && (
          <button
            type="button"
            aria-label="Effacer le flux affiché"
            onClick={(e) => {
              e.stopPropagation();
              consoleBus.clear(channel);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="grid h-6 w-6 shrink-0 place-items-center rounded text-term-muted hover:bg-term-hover hover:text-term-fg"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          aria-label={open ? "Réduire la console" : "Ouvrir la console"}
          aria-expanded={open}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => {
              if (!v && canAutoFocus()) setTimeout(() => inputRef.current?.focus(), 60);
              return !v;
            });
          }}
          className="grid h-6 w-6 shrink-0 place-items-center rounded text-term-muted hover:bg-term-hover hover:text-term-fg"
        >
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
      </div>

      {open && (
        <>
          <div
            ref={logRef}
            onClick={() => canAutoFocus() && inputRef.current?.focus()}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-1 font-mono text-[12px] leading-[1.55]"
          >
            {entries.length === 0 && (
              <pre className="whitespace-pre-wrap text-term-muted">
                {channel === "errors"
                  ? "Aucune erreur ni avertissement. `validate` recalcule les diagnostics."
                  : channel === "agent"
                    ? "Le flux backend affichera chaque commande jouée par l'agent IA."
                    : "Tape `help` pour commencer."}
              </pre>
            )}
            {entries.map((e) => (
              <LogLine key={e.id} entry={e} />
            ))}
            {hint && <pre className="whitespace-pre-wrap text-term-muted">{hint}</pre>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex shrink-0 items-center gap-2 border-t border-term-border px-3 py-2"
          >
            <span className="shrink-0 font-mono text-[12px] text-term-prompt">❯</span>
            <div className="relative min-w-0 flex-1">
              <InputOverlay ref={overlayRef} value={input} fontSize={inputFontSize} />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                onScroll={syncOverlayScroll}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                enterKeyHint="send"
                placeholder="help · add trig-webhook · validate · compile"
                aria-label="Commande de workflow"

                style={{ fontSize: inputFontSize }}
                className="relative w-full bg-transparent font-mono leading-normal text-transparent caret-term-fg outline-none placeholder:text-term-muted"
              />
            </div>
            <button
              type="submit"
              aria-label="Exécuter"
              className="grid h-6 w-6 shrink-0 place-items-center rounded text-term-muted hover:bg-term-hover hover:text-term-fg"
            >
              <CornerDownLeft className="h-3.5 w-3.5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export const TERMINAL_COMMAND_COUNT = COMMANDS.length;
