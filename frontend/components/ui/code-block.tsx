"use client";

/**
 * Bloc de code en lecture seule, style chat IA.
 *
 * Contraintes :
 *  - hauteur plafonnée (`maxHeight` ajustable, défaut 320 px) ;
 *  - **scroll interne** vertical et horizontal ;
 *  - en-tête collant (langage + nb de lignes + bouton copie) ;
 *  - coloration syntaxique légère (mots-clés, chaînes, commentaires,
 *    nombres) — pas de parseur lourd, aucun bundle supplémentaire.
 */
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";

const KEYWORDS: Record<string, Set<string>> = {
  javascript: new Set(
    "const let var function return if else for while class new await async import from export try catch throw typeof of in null true false undefined this".split(
      " ",
    ),
  ),
  typescript: new Set(
    "const let var function return if else for while class new await async import from export try catch throw typeof of in type interface implements extends public private readonly enum null true false undefined this".split(
      " ",
    ),
  ),
  python: new Set(
    "def class return if elif else for while import from as try except finally with lambda None True False and or not in is pass raise yield async await".split(
      " ",
    ),
  ),
  sql: new Set(
    "select from where group by order having limit insert into values update set delete join left right inner outer on as and or not null distinct count sum avg case when then end".split(
      " ",
    ),
  ),
  bash: new Set(
    "cd ls pwd mkdir rm cp mv echo export alias source sudo apt npm pnpm yarn git docker curl wget".split(
      " ",
    ),
  ),
  json: new Set(["true", "false", "null"]),
  html: new Set(["div", "span", "class", "id", "href", "src", "style"]),
  css: new Set(["important", "media", "import"]),
};

type Token = { text: string; cls: string };

const RE_TOKEN =
  /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/|--[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(\d+(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)/g;

function highlight(line: string, language: string): Token[] {
  const kw = KEYWORDS[language] ?? KEYWORDS.javascript!;
  const out: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  RE_TOKEN.lastIndex = 0;
  while ((m = RE_TOKEN.exec(line))) {
    if (m.index > last) out.push({ text: line.slice(last, m.index), cls: "" });
    const [raw, comment, str, num, word] = m;
    if (comment) out.push({ text: raw, cls: "text-emerald-500/85 italic" });
    else if (str) out.push({ text: raw, cls: "text-amber-300/90" });
    else if (num) out.push({ text: raw, cls: "text-fuchsia-300/90" });
    else if (word && kw.has(word)) out.push({ text: raw, cls: "text-sky-300/95 font-medium" });
    else out.push({ text: raw, cls: "" });
    last = m.index + raw.length;
  }
  if (last < line.length) out.push({ text: line.slice(last), cls: "" });
  return out;
}

export type CodeBlockProps = {
  code: string;
  language?: string;
  /** Hauteur maximale (px). Par défaut 320, plafonné à 60 vh via style. */
  maxHeight?: number;
  className?: string;
  /** Affiche les numéros de ligne (défaut : oui). */
  lineNumbers?: boolean;
};

export function CodeBlock({
  code,
  language = "text",
  maxHeight = 320,
  className,
  lineNumbers = true,
}: CodeBlockProps) {
  const lines = useMemo(() => code.replace(/\n$/, "").split("\n"), [code]);
  const displayLang = language === "text" ? "" : language;

  return (
    <div
      className={cn(
        "not-prose my-2 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.18_0.02_260)] text-zinc-100 shadow-sm",
        className,
      )}
    >
      {/* En-tête collant */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-white/[0.03] px-2.5 py-1.5">
        <span className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-zinc-400">
          <span className="inline-block size-1.5 rounded-full bg-emerald-400/80" />
          {displayLang || "code"}
        </span>
        <span className="text-[10px] tabular-nums text-zinc-500">
          {lines.length} ligne{lines.length > 1 ? "s" : ""}
        </span>
        <div className="ml-auto -mr-0.5">
          <CopyButton
            text={code}
            size="xs"
            variant="ghost"
            className="text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
            label="Copier le code"
            copiedLabel="Code copié"
          />
        </div>
      </div>

      {/* Corps scrollable — hauteur plafonnée */}
      <div
        className="min-h-0 overflow-auto overscroll-contain font-mono text-[11.5px] leading-[1.6]"
        style={{ maxHeight: `min(${maxHeight}px, 60vh)` }}
      >
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="align-top">
                {lineNumbers && (
                  <td className="sticky left-0 select-none bg-[oklch(0.18_0.02_260)] py-px pl-2.5 pr-2 text-right text-zinc-500/80 tabular-nums">
                    {i + 1}
                  </td>
                )}
                <td className="whitespace-pre py-px pr-3">
                  {highlight(line, language).map((t, j) => (
                    <span key={j} className={t.cls || undefined}>
                      {t.text}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}