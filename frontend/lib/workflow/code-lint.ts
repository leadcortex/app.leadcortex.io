//frontend\lib\workflow\code-lint.ts
/**
 * Validation syntaxique légère utilisée par l'éditeur de code avancé.
 *
 * Volontairement sans service de langage lourd : on couvre les erreurs les
 * plus fréquentes (JSON invalide, JavaScript non parsable, délimiteurs non
 * équilibrés) avec un diagnostic positionné sur la ligne fautive.
 */
import type { CodeLanguageId } from "./code-languages";

export type CodeIssue = {
  from: number;
  to: number;
  message: string;
  severity: "error" | "warning";
};

const PAIRS: Record<string, string> = { "(": ")", "[": "]", "{": "}" };

function checkBalance(code: string): CodeIssue[] {
  const stack: { ch: string; pos: number }[] = [];
  let i = 0;
  while (i < code.length) {
    const ch = code[i]!;
    const next = code[i + 1];
    if (ch === "/" && next === "/") {
      while (i < code.length && code[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (ch === "#") {
      while (i < code.length && code[i] !== "\n") i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === "\\") i++;
        i++;
      }
      i++;
      continue;
    }
    if (PAIRS[ch]) stack.push({ ch, pos: i });
    else if (ch === ")" || ch === "]" || ch === "}") {
      const open = stack.pop();
      if (!open || PAIRS[open.ch] !== ch) {
        return [
          { from: i, to: i + 1, message: `Délimiteur « ${ch} » inattendu.`, severity: "error" },
        ];
      }
    }
    i++;
  }
  const unclosed = stack[stack.length - 1];
  if (unclosed) {
    return [
      {
        from: unclosed.pos,
        to: unclosed.pos + 1,
        message: `Délimiteur « ${unclosed.ch} » jamais fermé.`,
        severity: "error",
      },
    ];
  }
  return [];
}

/** Position (offset) approximative d'une ligne/colonne renvoyée par un parseur. */
function offsetOfLine(code: string, line: number): number {
  const lines = code.split("\n");
  let offset = 0;
  for (let i = 0; i < Math.min(line - 1, lines.length); i++) offset += lines[i]!.length + 1;
  return offset;
}

/** Analyse le code et renvoie les problèmes détectés (liste vide = code valide). */
export function findIssues(code: string, language: CodeLanguageId): CodeIssue[] {
  if (!code.trim()) return [];

  if (language === "json") {
    try {
      JSON.parse(code);
      return [];
    } catch (error) {
      const message = error instanceof Error ? error.message : "JSON invalide";
      const posMatch = message.match(/position (\d+)/);
      const from = posMatch ? Math.min(code.length - 1, Number(posMatch[1])) : 0;
      return [{ from, to: Math.min(code.length, from + 1), message, severity: "error" }];
    }
  }

  if (language === "javascript" || language === "typescript") {
    const balance = checkBalance(code);
    if (balance.length) return balance;
    if (language === "javascript") {
      try {
        // Analyse syntaxique sans exécution : le corps n'est jamais appelé.
        new Function(code);
        return [];
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur de syntaxe";
        const lineMatch = message.match(/line (\d+)/i);
        const from = lineMatch ? offsetOfLine(code, Number(lineMatch[1])) : 0;
        return [{ from, to: Math.min(code.length, from + 1), message, severity: "error" }];
      }
    }
    return [];
  }

  if (language === "python") {
    const issues = checkBalance(code);
    if (issues.length) return issues;
    const lines = code.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (
        /^\s*(def|class|if|elif|else|for|while|try|except|finally|with)\b.*[^:\s]\s*$/.test(line)
      ) {
        const from = offsetOfLine(code, i + 1);
        return [
          {
            from,
            to: from + line.length,
            message: "Deux-points « : » manquants.",
            severity: "error",
          },
        ];
      }
    }
    return [];
  }

  return checkBalance(code);
}
