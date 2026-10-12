//frontend\lib\workflow\console-bus.ts
/**
 * Bus de journalisation de la console de workflow.
 *
 * Trois flux indépendants alimentent le sélecteur en haut du terminal :
 *
 *  - `user`   : le terminal de l'utilisateur (ce qu'il tape lui-même) ;
 *  - `agent`  : le flux backend — chaque commande exécutée par l'agent IA y
 *               est retranscrite en direct, avec sa sortie ;
 *  - `errors` : la gestion des erreurs (diagnostics du graphe + erreurs
 *               d'exécution des commandes), toujours consultable même quand
 *               l'agent travaille.
 *
 * Module 100 % local (données simulées) : un simple store externe compatible
 * `useSyncExternalStore`, sans dépendance.
 */

import { makeLine, type LineKind, type TerminalLine } from "./terminal-commands";

export type ConsoleChannel = "user" | "agent" | "errors";

export type ConsoleEntry = TerminalLine & {
  at: number;

  source: "user" | "agent" | "system";
};

export const CHANNELS: { key: ConsoleChannel; label: string; short: string }[] = [
  { key: "errors", label: "Gestion des erreurs", short: "Erreurs" },
  { key: "user", label: "Terminal agent — côté utilisateur", short: "Vous" },
  { key: "agent", label: "Terminal agent — backend", short: "Backend" },
];

const MAX_ENTRIES = 800;

type State = Record<ConsoleChannel, ConsoleEntry[]>;

let state: State = { user: [], agent: [], errors: [] };
/** Diagnostics du graphe : recalculés à chaque validation, jamais empilés. */
let diagnostics: ConsoleEntry[] = [];
let running = false;

const listeners = new Set<() => void>();

let version = 0;
const emit = () => {
  version += 1;
  listeners.forEach((l) => l());
};

const toEntry = (line: TerminalLine, source: ConsoleEntry["source"]): ConsoleEntry => ({
  ...line,
  at: Date.now(),
  source,
});

export const consoleBus = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  version(): number {
    return version;
  },

  read(channel: ConsoleChannel): ConsoleEntry[] {
    if (channel === "errors") return [...diagnostics, ...state.errors];
    return state[channel];
  },

  /** Nombre de lignes « à traiter » affiché sur l'onglet Erreurs. */
  errorCount(): number {
    return [...diagnostics, ...state.errors].filter(
      (e) => e.kind === "error" || e.kind === "warning",
    ).length;
  },

  isRunning(): boolean {
    return running;
  },

  setRunning(value: boolean) {
    if (running === value) return;
    running = value;
    emit();
  },

  push(channel: ConsoleChannel, lines: TerminalLine[], source: ConsoleEntry["source"] = "system") {
    if (!lines.length) return;
    const entries = lines.map((l) => toEntry(l, source));
    state = { ...state, [channel]: [...state[channel], ...entries].slice(-MAX_ENTRIES) };

    // Toute erreur/avertissement remonte aussi dans le flux « erreurs » pour
    // que l'utilisateur n'ait jamais à fouiller les autres onglets.
    if (channel !== "errors") {
      const faulty = entries.filter((e) => e.kind === "error" || e.kind === "warning");
      if (faulty.length) {
        const tagged = faulty.map((e) => ({
          ...e,
          id: `${e.id}_err`,
          text: `[${channel === "agent" ? "backend" : "vous"}] ${e.text}`,
        }));
        state = { ...state, errors: [...state.errors, ...tagged].slice(-MAX_ENTRIES) };
      }
    }
    emit();
  },

  log(channel: ConsoleChannel, kind: LineKind, text: string, source?: ConsoleEntry["source"]) {
    consoleBus.push(channel, [makeLine(kind, text)], source);
  },

  /** Remplace les diagnostics du graphe (résultat de `validate`). */
  setDiagnostics(lines: TerminalLine[]) {
    diagnostics = lines.map((l) => toEntry(l, "system"));
    emit();
  },

  clear(channel: ConsoleChannel) {
    if (channel === "errors") diagnostics = [];
    state = { ...state, [channel]: [] };
    emit();
  },

  clearAll() {
    diagnostics = [];
    state = { user: [], agent: [], errors: [] };
    emit();
  },
};
