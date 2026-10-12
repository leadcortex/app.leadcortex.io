//frontend\lib\workflow\code-languages.ts
import type { Extension } from "@codemirror/state";

export type CodeLanguageId =
  "javascript" | "typescript" | "python" | "json" | "sql" | "html" | "css";

export type CodeLanguageDef = {
  id: CodeLanguageId;

  label: string;

  ext: string;
  snippet: string;
};

export const CODE_LANGUAGES: CodeLanguageDef[] = [
  {
    id: "javascript",
    label: "JavaScript",
    ext: "js",
    snippet: "// Reçoit `lead`, `company`, `context`\nreturn lead.score > 50;\n",
  },
  {
    id: "typescript",
    label: "TypeScript",
    ext: "ts",
    snippet:
      "type Lead = { score: number };\n\nexport function run(lead: Lead): boolean {\n  return lead.score > 50;\n}\n",
  },
  {
    id: "python",
    label: "Python",
    ext: "py",
    snippet: 'def run(lead, context):\n    return lead["score"] > 50\n',
  },
  {
    id: "json",
    label: "JSON",
    ext: "json",
    snippet: '{\n  "email": "lead.email",\n  "company": "company.name"\n}\n',
  },
  {
    id: "sql",
    label: "SQL",
    ext: "sql",
    snippet: "SELECT id, email\nFROM leads\nWHERE score > 50\nORDER BY score DESC;\n",
  },
  {
    id: "html",
    label: "HTML",
    ext: "html",
    snippet: '<div class="lead-card">\n  <h1>Bonjour {{lead.prenom}}</h1>\n</div>\n',
  },
  {
    id: "css",
    label: "CSS",
    ext: "css",
    snippet: ".lead-card {\n  padding: 16px;\n  border-radius: 12px;\n}\n",
  },
];

export const CODE_LANGUAGE_LABELS = CODE_LANGUAGES.map((l) => l.label);

export function resolveLanguage(value: unknown): CodeLanguageDef {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  return (
    CODE_LANGUAGES.find((l) => l.label.toLowerCase() === raw || l.id === raw) ?? CODE_LANGUAGES[0]!
  );
}

/**
 * Charge dynamiquement l'extension CodeMirror du langage. L'import est
 * paresseux : les grammaires ne sont jamais embarquées dans le rendu serveur
 * ni dans le bundle initial du canevas.
 */
export async function loadLanguageExtension(id: CodeLanguageId): Promise<Extension> {
  switch (id) {
    case "typescript": {
      const { javascript } = await import("@codemirror/lang-javascript");
      return javascript({ typescript: true });
    }
    case "python": {
      const { python } = await import("@codemirror/lang-python");
      return python();
    }
    case "json": {
      const { json } = await import("@codemirror/lang-json");
      return json();
    }
    case "sql": {
      const { sql } = await import("@codemirror/lang-sql");
      return sql();
    }
    case "html": {
      const { html } = await import("@codemirror/lang-html");
      return html();
    }
    case "css": {
      const { css } = await import("@codemirror/lang-css");
      return css();
    }
    case "javascript":
    default: {
      const { javascript } = await import("@codemirror/lang-javascript");
      return javascript();
    }
  }
}
