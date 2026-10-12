//frontend\lib\__tests__\assistant-engine.test.ts
import { describe, expect, it } from "vitest";
import {
  hashMessage,
  parseMessageSegments,
  pageLabel,
} from "@/components/ai-assistant/assistant-engine";

describe("pageLabel", () => {
  it("renvoie un libellé exact pour les routes connues", () => {
    expect(pageLabel("/app")).toBe("Dashboard");
    expect(pageLabel("/app/people")).toBe("Prospects");
    expect(pageLabel("/app/workflows")).toBe("Workflows");
  });

  it("renvoie le préfixe le plus long pour les sous-routes", () => {
    expect(pageLabel("/app/people/123")).toBe("Prospects");
    expect(pageLabel("/app/companies/abc/edit")).toBe("Entreprises");
  });

  it("retombe sur « Espace de travail » pour une route inconnue", () => {
    expect(pageLabel("/unknown")).toBe("Espace de travail");
    expect(pageLabel("")).toBe("Espace de travail");
  });
});

describe("hashMessage", () => {
  it("produit le même hash pour le même contenu + rôle", () => {
    const a = hashMessage("Bonjour", "user");
    const b = hashMessage("Bonjour", "user");
    expect(a).toBe(b);
  });

  it("produit des hash différents pour des rôles différents", () => {
    expect(hashMessage("Bonjour", "user")).not.toBe(hashMessage("Bonjour", "agent"));
  });

  it("produit des hash différents pour des contenus différents", () => {
    expect(hashMessage("Bonjour", "user")).not.toBe(hashMessage("Bonsoir", "user"));
  });
});

describe("parseMessageSegments", () => {
  it("retourne un seul segment texte quand il n'y a pas de fence", () => {
    const segs = parseMessageSegments("Bonjour le monde\nDeuxième ligne");
    expect(segs).toHaveLength(1);
    expect(segs[0]).toMatchObject({ type: "text" });
  });

  it("extrait un bloc de code entouré de texte", () => {
    const src = "Avant\n```ts\nconst x = 1;\n```\nAprès";
    const segs = parseMessageSegments(src);
    expect(segs.map((s) => s.type)).toEqual(["text", "code", "text"]);
    const code = segs.find((s) => s.type === "code");
    expect(code).toMatchObject({ type: "code", language: "ts", content: "const x = 1;" });
  });

  it("extrait un tableau markdown", () => {
    const src = "Résumé :\n\n| Col A | Col B |\n|-------|-------|\n| 1 | 2 |\n| 3 | 4 |\n\nFin.";
    const segs = parseMessageSegments(src);
    const table = segs.find((s) => s.type === "table");
    expect(table).toBeDefined();
    if (table?.type === "table") {
      expect(table.headers).toEqual(["Col A", "Col B"]);
      expect(table.rows).toEqual([
        ["1", "2"],
        ["3", "4"],
      ]);
    }
  });

  it("gère plusieurs blocs de code successifs", () => {
    const src = "```js\na\n```\n\n```py\nb\n```";
    const segs = parseMessageSegments(src);
    expect(segs.filter((s) => s.type === "code")).toHaveLength(2);
  });

  it("retourne un tableau vide pour un texte vide", () => {
    expect(parseMessageSegments("")).toEqual([]);
  });
});