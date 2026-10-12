//frontend\components\workflow\CodePreview.tsx
import { useMemo } from "react";
import { Code2 } from "lucide-react";
import type { CodeLanguageId } from "@/lib/workflow/code-languages";
import { cn } from "@/lib/utils";

type Token = { text: string; cls: string };

const KEYWORDS: Record<string, string[]> = {
  javascript:
    "const let var function return if else for while class new await async import from export try catch throw typeof of in null true false undefined".split(
      " ",
    ),
  typescript:
    "const let var function return if else for while class new await async import from export try catch throw typeof of in type interface implements extends public private readonly null true false undefined".split(
      " ",
    ),
  python:
    "def class return if elif else for while import from as try except finally with lambda None True False and or not in is pass raise yield".split(
      " ",
    ),
  sql: "select from where group by order having limit insert into values update set delete join left right inner outer on as and or not null distinct count sum avg".split(
    " ",
  ),
  json: "true false null".split(" "),
  html: "div span class id href src style script link meta html head body".split(" "),
  css: "important media import from to and not only".split(" "),
};

const RE_STRING = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/;
const RE_COMMENT = /(\/\/[^\n]*|#[^\n]*|--[^\n]*|\/\*[\s\S]*?\*\/)/;
const RE_NUMBER = /\b(\d+(?:\.\d+)?)\b/;
const RE_WORD = /([A-Za-z_$][\w$]*)/;

function tokenize(line: string, language: CodeLanguageId): Token[] {
  const keywords = KEYWORDS[language] ?? KEYWORDS["javascript"]!;
  const master = new RegExp(
    `${RE_COMMENT.source}|${RE_STRING.source}|${RE_NUMBER.source}|${RE_WORD.source}`,
    "g",
  );
  const out: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = master.exec(line))) {
    if (m.index > last) out.push({ text: line.slice(last, m.index), cls: "" });
    const [raw, comment, str, num, word] = m;
    if (comment)
      out.push({ text: raw, cls: "text-emerald-600/80 dark:text-emerald-400/80 italic" });
    else if (str) out.push({ text: raw, cls: "text-amber-600 dark:text-amber-300" });
    else if (num) out.push({ text: raw, cls: "text-fuchsia-600 dark:text-fuchsia-300" });
    else if (word)
      out.push({
        text: raw,
        cls: keywords.includes(word.toLowerCase())
          ? "text-sky-600 dark:text-sky-300 font-medium"
          : "",
      });
    last = m.index + raw.length;
  }
  if (last < line.length) out.push({ text: line.slice(last), cls: "" });
  return out;
}

export function CodePreview({
  code,
  language,
  height,
  placeholder,
  className,
  headerLabel,
  onEdit,
}: {
  code: string;
  language: CodeLanguageId;
  height: number;
  placeholder?: string;
  className?: string;
  /** Libellé affiché dans le petit bandeau interne (ex. "Code · JavaScript"). */
  headerLabel?: string;
  /** Affiche un bouton « Éditer » dans le bandeau interne, sans réserver
   *  d'espace supplémentaire au-dessus du conteneur. */
  onEdit?: () => void;
}) {
  const lines = useMemo(() => (code ? code.replace(/\n$/, "").split("\n") : []), [code]);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-md border border-input bg-[oklch(0.18_0.02_260)] font-mono text-[10.5px] leading-[1.55] text-zinc-100",
        className,
      )}
      style={{ height }}
    >
      {(headerLabel || onEdit) && (
        <div className="flex shrink-0 items-center justify-between gap-1 border-b border-white/10 px-2 py-1">
          <span className="truncate text-[9px] uppercase tracking-wide text-zinc-400">
            {headerLabel}
          </span>
          {onEdit && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-primary hover:bg-primary/30"
            >
              <Code2 className="h-2.5 w-2.5" /> Éditer
            </button>
          )}
        </div>
      )}
      <div
        className="wf-code-scroll min-h-0 flex-1 overflow-auto"
        onWheel={(e) => e.stopPropagation()}
      >
        {lines.length === 0 ? (
          <p className="px-2 py-1.5 italic text-zinc-500">
            {placeholder ?? "Aucun code — ouvre l'éditeur."}
          </p>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="align-top">
                  <td className="sticky left-0 select-none bg-[oklch(0.18_0.02_260)] pl-2 pr-2 text-right text-zinc-500">
                    {i + 1}
                  </td>
                  <td className="whitespace-pre pr-2">
                    {tokenize(line, language).map((t, j) => (
                      <span key={j} className={t.cls}>
                        {t.text}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
