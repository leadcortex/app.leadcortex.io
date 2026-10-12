//frontend\lib\__tests__\conversation-export.test.ts
import { describe, expect, it } from "vitest";
import { filenameFor, toJson, toMarkdown, type ExportMeta } from "@/lib/conversation-export";
import type { AssistantMessage } from "@/components/ai-assistant/assistant-engine";

const meta: ExportMeta = {
  title: "Résumé hebdo de prospection",
  createdAt: Date.UTC(2026, 0, 15, 9, 0),
  exportedAt: Date.UTC(2026, 0, 20, 10, 30),
};

const messages: AssistantMessage[] = [
  { id: "u1", role: "user", text: "Salut", createdAt: Date.UTC(2026, 0, 15, 9, 0) },
  {
    id: "a1",
    role: "agent",
    text: "Bonjour\n```ts\nconst a = 1;\n```",
    createdAt: Date.UTC(2026, 0, 15, 9, 1),
    attachments: [{ id: "att1", name: "doc.pdf", size: 1024, kind: "document" }],
  },
];

describe("filenameFor", () => {
  it("génère un nom sûr à partir du titre", () => {
    const name = filenameFor("Résumé — hebdo/2026", "markdown");
    expect(name).toMatch(/^leadcortex-Resume-hebdo2026-\d{4}-\d{2}-\d{2}\.md$/);
  });

  it("utilise l'extension .json quand le format est json", () => {
    expect(filenameFor("Test", "json")).toMatch(/\.json$/);
  });

  it("retombe sur « conversation » si le titre est vide", () => {
    expect(filenameFor("", "markdown")).toMatch(/^leadcortex-conversation-/);
  });
});

describe("toMarkdown", () => {
  it("contient le titre et les rôles traduits", () => {
    const md = toMarkdown(messages, meta);
    expect(md).toContain("# Résumé hebdo de prospection");
    expect(md).toContain("## Vous ·");
    expect(md).toContain("## Assistant ·");
  });

  it("préserve les fences de code", () => {
    const md = toMarkdown(messages, meta);
    expect(md).toContain("```ts\nconst a = 1;\n```");
  });

  it("inclut les pièces jointes", () => {
    const md = toMarkdown(messages, meta);
    expect(md).toContain("doc.pdf");
  });
});

describe("toJson", () => {
  it("produit un JSON valide avec le bon schéma", () => {
    const raw = toJson(messages, meta);
    const parsed = JSON.parse(raw);
    expect(parsed.schema).toBe("leadcortex.conversation.v1");
    expect(parsed.messageCount).toBe(2);
    expect(parsed.messages[1].attachments[0].name).toBe("doc.pdf");
  });

  it("marque les messages modifiés", () => {
    const edited: AssistantMessage[] = [{ ...messages[0]!, edited: true }];
    const parsed = JSON.parse(toJson(edited, meta));
    expect(parsed.messages[0].edited).toBe(true);
  });
});