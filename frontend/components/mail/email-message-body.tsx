// frontend/components/mail/email-message-body.tsx

import { useMemo } from "react";
import { cn } from "@/lib/core/utils";

const ALLOWED_TAGS = new Set([
  "a", "b", "strong", "i", "em", "u", "s", "p", "br", "hr",
  "ul", "ol", "li", "blockquote", "pre", "code",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "table", "thead", "tbody", "tr", "th", "td", "caption",
  "img", "div", "span",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height"],
};

function sanitizeHtml(raw: string): string {
  if (typeof window === "undefined") return raw;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${raw}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return "";

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) walk(child);

    const tag = node.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      const parent = node.parentNode;
      if (!parent) return;
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      parent.removeChild(node);
      return;
    }

    const allowed = ALLOWED_ATTRS[tag] ?? [];
    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();

      if (!allowed.includes(name) || name.startsWith("on")) {
        node.removeAttribute(attr.name);
        continue;
      }
      if ((name === "href" || name === "src") && /^(javascript|data):/i.test(value)) {
        node.removeAttribute(attr.name);
      }
    }

    if (tag === "a" && node.getAttribute("href")) {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noreferrer noopener");
    }
  };

  walk(root);
  return root.innerHTML;
}

function looksLikeHtml(text: string): boolean {
  return /<\/?(?:p|div|br|a|b|strong|i|em|u|ul|ol|li|table|blockquote|h[1-6])\b/i.test(text);
}

function splitQuotedLines(text: string): { body: string; quote: string | null } {
  const lines = text.split("\n");
  const quoteLines: string[] = [];
  const bodyLines: string[] = [];
  let inQuote = false;

  for (const line of lines) {
    if (line.startsWith(">")) {
      inQuote = true;
      quoteLines.push(line.replace(/^>\s?/, ""));
    } else if (inQuote) {
      if (line.trim().length === 0 && quoteLines.length > 0) {
        quoteLines.push("");
      } else {
        bodyLines.push(line);
        inQuote = false;
      }
    } else {
      bodyLines.push(line);
    }
  }

  if (bodyLines.length === 0 && quoteLines.length > 0) {
    return { body: quoteLines.join("\n"), quote: null };
  }

  return {
    body: bodyLines.join("\n").trimEnd(),
    quote: quoteLines.length > 0 ? quoteLines.join("\n").trimEnd() : null,
  };
}

export function EmailMessageBody({
  body,
  className,
  compact = false,
}: {
  body: string;
  className?: string;
  compact?: boolean;
}) {
  const isHtml = useMemo(() => looksLikeHtml(body), [body]);

  if (isHtml) {
    const safe = sanitizeHtml(body);
    return (
      <div
        className={cn(
          "prose prose-sm max-w-none break-words text-foreground/90",
          "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
          "[&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:my-2",
          "[&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border/60 [&_td]:p-1.5 [&_th]:border [&_th]:border-border/60 [&_th]:p-1.5 [&_th]:bg-surface/40",
          compact ? "text-[12.5px] leading-relaxed" : "text-[13px] leading-[1.7] md:text-[14px]",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  }

  const { body: mainBody, quote } = splitQuotedLines(body);

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "whitespace-pre-wrap break-words text-foreground/90",
          compact ? "text-[12.5px] leading-relaxed" : "text-[13px] leading-[1.7] md:text-[14px]",
        )}
      >
        {mainBody}
      </div>

      {quote && (
        <details className="group/quote rounded-lg border border-border/60 bg-surface/30">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-1.5 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
            <span className="inline-block transition-transform group-open/quote:rotate-90">
              ▸
            </span>
            Afficher le message cité
          </summary>
          <div className="border-t border-border/60 px-3 py-2 whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-muted-foreground">
            {quote}
          </div>
        </details>
      )}
    </div>
  );
}
