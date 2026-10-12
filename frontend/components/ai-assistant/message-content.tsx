"use client";

/**
 * Rendu d'un message assistant : découpe le texte en segments
 * (paragraphes, blocs de code, tableaux) et affiche chacun avec le bon
 * composant.
 *
 * Format reconnu dans le texte brut :
 *
 *   ```lang
 *   code…
 *   ```
 *
 *   | Col 1 | Col 2 |
 *   |-------|-------|
 *   | a     | b     |
 *
 * Tout le reste est rendu comme texte avec un mini-Markdown inline
 * (gras, italique, code inline) + listes à puces.
 */
import type { ReactNode } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import { ScrollableTable } from "@/components/ui/scrollable-table";
import { cn } from "@/lib/utils";
import { parseMessageSegments, type TableAlign } from "./assistant-engine";

/** Mini-Markdown inline : **gras**, *italique*, `code`. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`"))
      out.push(
        <code
          key={k++}
          className="rounded bg-secondary/70 px-1 py-0.5 font-mono text-[11px] text-foreground"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    else out.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function TextSegment({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (!para.length) return;
    const joined = para.join(" ");
    if (joined.trim()) blocks.push(<p key={`p${blocks.length}`}>{inline(joined)}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`l${blocks.length}`} className="ml-4 list-disc space-y-0.5">
        {list.map((l, i) => (
          <li key={i}>{inline(l)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      list.push(line.replace(/^\s*[-*]\s+/, ""));
      continue;
    }
    if (!line.trim()) {
      flushList();
      flushPara();
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      flushPara();
      blocks.push(
        <h4 key={`h${blocks.length}`} className="mt-2 text-[12.5px] font-semibold">
          {inline(line.slice(4))}
        </h4>,
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      flushPara();
      blocks.push(
        <h3 key={`h${blocks.length}`} className="mt-2 text-[13px] font-semibold">
          {inline(line.slice(3))}
        </h3>,
      );
      continue;
    }
    para.push(line);
  }
  flushList();
  flushPara();
  return <div className="space-y-1.5">{blocks}</div>;
}

export function MessageContent({ text, className }: { text: string; className?: string }) {
  const segments = parseMessageSegments(text);

  return (
    <div className={cn("space-y-1.5", className)}>
      {segments.map((s, i) => {
        switch (s.type) {
          case "code":
            return <CodeBlock key={i} code={s.content} language={s.language} />;
          case "table":
            return (
              <ScrollableTable
                key={i}
                headers={s.headers}
                rows={s.rows}
                align={s.align as TableAlign[] | undefined}
              />
            );
          case "text":
          default:
            return <TextSegment key={i} content={s.content} />;
        }
      })}
    </div>
  );
}