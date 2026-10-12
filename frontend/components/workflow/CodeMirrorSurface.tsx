//frontend\components\workflow\CodeMirrorSurface.tsx
import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { autocompletion, completeAnyWord } from "@codemirror/autocomplete";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import { oneDark } from "@codemirror/theme-one-dark";
import type { Extension } from "@codemirror/state";
import { loadLanguageExtension, type CodeLanguageId } from "@/lib/workflow/code-languages";
import { findIssues } from "@/lib/workflow/code-lint";

export default function CodeMirrorSurface({
  value,
  language,
  onChange,
}: {
  value: string;
  language: CodeLanguageId;
  onChange: (next: string) => void;
}) {
  const [langExt, setLangExt] = useState<Extension | null>(null);

  useEffect(() => {
    let alive = true;
    setLangExt(null);
    loadLanguageExtension(language).then((ext) => {
      if (alive) setLangExt(ext);
    });
    return () => {
      alive = false;
    };
  }, [language]);

  const extensions = useMemo<Extension[]>(() => {
    const lint = linter((view): Diagnostic[] =>
      findIssues(view.state.doc.toString(), language).map((i) => ({
        from: Math.min(i.from, view.state.doc.length),
        to: Math.min(i.to, view.state.doc.length),
        severity: i.severity,
        message: i.message,
      })),
    );
    return [
      autocompletion({ override: [completeAnyWord], activateOnTyping: true }),
      lintGutter(),
      lint,
      ...(langExt ? [langExt] : []),
    ];
  }, [langExt, language]);

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={oneDark}
      extensions={extensions}
      onChange={onChange}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        foldGutter: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        highlightSelectionMatches: true,
      }}
      className="h-full text-[13px]"
      style={{ height: "100%" }}
    />
  );
}
