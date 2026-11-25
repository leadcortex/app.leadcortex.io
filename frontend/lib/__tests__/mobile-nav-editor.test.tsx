// frontend/lib/__tests__/mobile-nav-editor.test.tsx

import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MobileNavDrilldown,
  MobileNavEditor,
  MobileNavEditorView,
} from "@/components/settings/panels/mobile-nav-editor";
import { DEFAULT_NAV_LAYOUT } from "@/lib/mobile/nav-layout";

const render = (keys: string[], forceBubble = false) =>
  renderToStaticMarkup(
    <MobileNavEditorView layout={{ keys, forceBubble }} onChange={() => {}} />,
  );

describe("MobileNavEditorView", () => {
  it("avec 4 sections, les boutons de retrait sont désactivés", () => {
    const html = render(["people", "companies", "home", "hub"]);
    expect(html).toContain('aria-label="Retirer Prospects" disabled=""');
  });

  it("montre la bulle pour Academy et « Autre » verrouillé en dernier", () => {
    const html = render(DEFAULT_NAV_LAYOUT.keys);
    expect(html).toContain('data-cell="bubble"');
    expect(html.indexOf('data-key="academy"')).toBeLessThan(html.indexOf('data-key="people"'));
    expect(html).toContain('data-key="other"');
    expect(html.lastIndexOf("data-key=")).toBe(html.indexOf('data-key="other"'));
    expect(render(["emails", "people", "companies", "home", "hub"])).not.toContain(
      'data-cell="bubble"',
    );
  });

  it("propose les pages absentes, désactivées quand la barre est pleine", () => {
    const four = render(["people", "companies", "home", "hub"]);
    expect(four).toContain('aria-label="Ajouter Emails"');
    expect(four).not.toContain('aria-label="Ajouter Prospects"');
    expect(four).not.toContain('aria-label="Ajouter Emails" disabled=""');
    expect(render(DEFAULT_NAV_LAYOUT.keys)).toContain('aria-label="Ajouter Emails" disabled=""');
  });

  it("interrupteur de bulle seulement avec 5 sections ; Rétablir désactivé par défaut", () => {
    const BUBBLE = 'aria-label="Mettre la 1re section dans une bulle ronde"';
    expect(render(["people", "companies", "home", "hub"])).not.toContain(BUBBLE);
    expect(render(["emails", "people", "companies", "home", "hub"])).toContain(BUBBLE);
    expect(render(DEFAULT_NAV_LAYOUT.keys)).toMatch(/Rétablir la barre par défaut<\/button>/);
    const resetAttrs = (html: string) =>
      html.split("<button").find((b) => b.includes("Rétablir la barre par défaut"))!.split(">")[0];
    expect(resetAttrs(render(DEFAULT_NAV_LAYOUT.keys))).toContain('disabled=""');
    expect(resetAttrs(render(["people", "companies", "home", "hub"]))).not.toContain('disabled=""');
  });
});

describe("MobileNavEditor", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("affiche le réglage enregistré sur l'appareil", () => {
    const stored = { keys: ["emails", "people", "home", "hub"], forceBubble: false };
    vi.stubGlobal("window", {
      localStorage: { getItem: (k: string) => (k === "lc.layout.mobileNav" ? JSON.stringify(stored) : null) },
    });
    const html = renderToStaticMarkup(<MobileNavEditor />);
    expect(html).toContain('data-key="emails"');
    expect(html).not.toContain('data-key="academy"');
  });
});

describe("MobileNavDrilldown", () => {
  it("affiche un bouton retour, le titre et l'éditeur", () => {
    const html = renderToStaticMarkup(<MobileNavDrilldown onBack={() => {}} />);
    expect(html).toContain('aria-label="Retour à l&#x27;affichage"');
    expect(html).toContain("Barre de navigation");
    expect(html).toContain('data-key="other"');
  });
});
