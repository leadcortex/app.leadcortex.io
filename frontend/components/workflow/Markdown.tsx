//frontend\components\workflow\Markdown.tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyPrefix}-${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`"))
      out.push(
        <code key={key} className="break-all rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>,
      );
    else out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];

  const flush = (key: string) => {
    if (!list.length) return;
    blocks.push(
      <ul key={key} className="ml-4 list-disc space-y-0.5">
        {list.map((l, i) => (
          <li key={i}>{inline(l, `${key}-${i}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ""));
      return;
    }
    flush(`l${i}`);
    if (!line.trim()) return;
    if (line.startsWith("### "))
      blocks.push(
        <h4 key={i} className="text-[12px] font-semibold">
          {inline(line.slice(4), `h${i}`)}
        </h4>,
      );
    else if (line.startsWith("## "))
      blocks.push(
        <h3 key={i} className="text-[13px] font-bold">
          {inline(line.slice(3), `h${i}`)}
        </h3>,
      );
    else if (line.startsWith("# "))
      blocks.push(
        <h2 key={i} className="text-[14px] font-bold">
          {inline(line.slice(2), `h${i}`)}
        </h2>,
      );
    else blocks.push(<p key={i}>{inline(line, `p${i}`)}</p>);
  });
  flush("last");

  return <div className={cn("min-w-0 break-words", className)}>{blocks}</div>;
}
