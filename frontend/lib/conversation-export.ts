//frontend\lib\conversation-export.ts
import type { AssistantMessage } from "@/components/ai-assistant/assistant-engine";

/**
 * Export d'une conversation au format Markdown ou JSON.
 *
 * Aucune dépendance : le rendu Markdown reconstruit fidèlement la
 * conversation (rôles, horodatage, pièces jointes, blocs de code, tableaux
 * — ces deux derniers étant déjà inclus dans le texte brut du message).
 */

export type ExportFormat = "markdown" | "json";

export type ExportMeta = {
  title: string;
  createdAt: number;
  exportedAt: number;
};

/** Nom de fichier propre, dérivé du titre (sans accents ni caractères interdits). */
export function filenameFor(title: string, format: ExportFormat): string {
  const safe = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 _-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48) || "conversation";
  const ext = format === "json" ? "json" : "md";
  const date = new Date().toISOString().slice(0, 10);
  return `leadcortex-${safe}-${date}.${ext}`;
}

function fmtTs(ts: number): string {
  return new Date(ts).toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toMarkdown(messages: AssistantMessage[], meta: ExportMeta): string {
  const lines: string[] = [];
  lines.push(`# ${meta.title}`);
  lines.push("");
  lines.push(`> Exporté le ${fmtTs(meta.exportedAt)} · ${messages.length} message${messages.length > 1 ? "s" : ""}`);
  lines.push("");

  for (const m of messages) {
    const role = m.role === "user" ? "Vous" : "Assistant";
    lines.push(`## ${role} · ${fmtTs(m.createdAt)}${m.edited ? " · modifié" : ""}`);
    lines.push("");
    if (m.attachments?.length) {
      for (const a of m.attachments) {
        const kind = a.kind === "context" ? "contexte" : a.kind;
        lines.push(`- 📎 **${a.name}** _(${kind})_`);
      }
      lines.push("");
    }
    // Le texte du message peut lui-même contenir des blocs de code en fences
    // — on ne les retouche pas : Markdown les préserve tels quels.
    lines.push(m.text);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

export function toJson(messages: AssistantMessage[], meta: ExportMeta): string {
  const payload = {
    schema: "leadcortex.conversation.v1",
    exportedAt: meta.exportedAt,
    createdAt: meta.createdAt,
    title: meta.title,
    messageCount: messages.length,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      text: m.text,
      createdAt: m.createdAt,
      ...(m.edited ? { edited: true } : {}),
      ...(m.attachments?.length
        ? {
            attachments: m.attachments.map((a) => ({
              id: a.id,
              name: a.name,
              size: a.size,
              kind: a.kind,
            })),
          }
        : {}),
    })),
  };
  return JSON.stringify(payload, null, 2);
}

/** Déclenche le téléchargement d'un blob texte (aucune dépendance externe). */
export function downloadText(
  filename: string,
  content: string,
  mime = "text/plain;charset=utf-8",
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Copie un texte dans le presse-papier, avec fallback `<textarea>`. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}