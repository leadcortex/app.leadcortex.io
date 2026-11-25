// frontend/lib/__tests__/nav-layout.test.ts

import { describe, expect, it } from "vitest";
import {
  DEFAULT_NAV_LAYOUT,
  hasBubble,
  moveKey,
  normalizeLayout,
  addKey,
  buildBar,
  removeKey,
  type MobileNavLayout,
} from "@/lib/mobile/nav-layout";
import { isSectionActive } from "@/lib/mobile/nav-tree";

describe("normalizeLayout", () => {
  it("renvoie le défaut sans valeur", () => {
    expect(normalizeLayout(null)).toEqual(DEFAULT_NAV_LAYOUT);
    expect(normalizeLayout("n'importe quoi")).toEqual(DEFAULT_NAV_LAYOUT);
  });

  it("retire inconnus et doublons, coupe à 5, force un booléen", () => {
    expect(
      normalizeLayout({
        keys: ["people", "x", "people", "emails", "home", "hub", "tasks", "calls"],
        forceBubble: "yes",
      }),
    ).toEqual({ keys: ["people", "emails", "home", "hub", "tasks"], forceBubble: false });
  });

  it("complète à 4 avec les clés du défaut absentes, dans l'ordre du défaut", () => {
    expect(normalizeLayout({ keys: ["people"] }).keys).toEqual([
      "people",
      "academy",
      "companies",
      "home",
    ]);
  });
});

describe("hasBubble", () => {
  it("bulle seulement avec 5 sections et Academy en 1re ou bulle forcée", () => {
    const keys = ["emails", "people", "companies", "home", "hub"];
    expect(hasBubble(DEFAULT_NAV_LAYOUT)).toBe(true);
    expect(hasBubble({ keys, forceBubble: false })).toBe(false);
    expect(hasBubble({ keys, forceBubble: true })).toBe(true);
    expect(hasBubble({ keys: ["academy", "people", "home", "hub"], forceBubble: true })).toBe(false);
  });
});

describe("modifications", () => {
  const four: MobileNavLayout = { keys: ["people", "companies", "home", "hub"], forceBubble: false };

  it("removeKey retire avec 5 sections mais pas sous 4", () => {
    expect(removeKey(DEFAULT_NAV_LAYOUT, "academy").keys).toEqual(four.keys);
    expect(removeKey(four, "people")).toBe(four);
  });

  it("addKey ajoute en fin, sans doublon et sans dépasser 5", () => {
    expect(addKey(four, "emails").keys).toEqual([...four.keys, "emails"]);
    expect(addKey(four, "people")).toBe(four);
    expect(addKey(DEFAULT_NAV_LAYOUT, "emails")).toBe(DEFAULT_NAV_LAYOUT);
  });

  it("moveKey déplace une section", () => {
    expect(moveKey(DEFAULT_NAV_LAYOUT, 0, 4).keys).toEqual([
      "people",
      "companies",
      "home",
      "hub",
      "academy",
    ]);
  });
});

type Targets = { items: { to: string }[]; groups?: { items: { to: string }[] }[] };
const allTargets = (s: Targets) => [
  ...s.items.map((i) => i.to),
  ...(s.groups ?? []).flatMap((g) => g.items.map((i) => i.to)),
];

describe("buildBar", () => {
  it("reproduit la barre actuelle par défaut", () => {
    const { bubble, main } = buildBar(DEFAULT_NAV_LAYOUT);
    expect(bubble?.key).toBe("academy");
    expect(main.map((s) => s.key)).toEqual(["people", "companies", "home", "hub", "other"]);
    const other = main[main.length - 1]!;
    expect(other.opensSheet).toBe(true);
    expect(allTargets(other)).not.toContain("/app/people");
    expect(allTargets(other)).not.toContain("/app/academy");
    expect(allTargets(other)).toContain("/app/emails");
  });

  it("pages retirées dans « Autre » (Principales en 1er), Accueil retiré sans tout activer", () => {
    const { bubble, main } = buildBar({ keys: ["emails", "people", "hub", "tasks"], forceBubble: false });
    expect(bubble).toBeNull();
    const other = main[main.length - 1]!;
    expect(other.groups?.[0]?.label).toBe("Principales");
    expect(other.groups?.[0]?.items.map((i) => i.to)).toEqual(["/app/academy", "/app/companies", "/app"]);
    expect(allTargets(other)).not.toContain("/app/emails");
    expect(isSectionActive(other, "/app/companies")).toBe(true);
    expect(isSectionActive(other, "/app")).toBe(true);
    expect(isSectionActive(other, "/app/people")).toBe(false);
    const home = buildBar(DEFAULT_NAV_LAYOUT).main.find((x) => x.key === "home")!;
    expect(isSectionActive(home, "/app")).toBe(true);
    expect(isSectionActive(home, "/app/people")).toBe(false);
  });
});
