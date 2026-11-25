// frontend/lib/__tests__/mobile-nav-prefs.test.tsx

import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  readMobileNavLayout,
  useMobileNavLayout,
  writeMobileNavLayout,
} from "@/lib/core/layout-prefs";

function LayoutProbe() {
  return <span>{useMobileNavLayout().keys.join(",")}</span>;
}

describe("useMobileNavLayout", () => {
  it("renvoie le réglage enregistré dès le premier rendu", () => {
    fakeWindow({
      "lc.layout.mobileNav": JSON.stringify({ keys: ["emails", "people", "home", "hub"] }),
    });
    expect(renderToStaticMarkup(<LayoutProbe />)).toBe("<span>emails,people,home,hub</span>");
  });
});

function fakeWindow(store: Record<string, string>) {
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    },
    dispatchEvent: () => true,
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("readMobileNavLayout", () => {
  it("reprend l'ancien réglage « masquer Academy » quand rien n'est encore enregistré", () => {
    fakeWindow({ "lc.layout.hideAcademyMobile": "1" });
    expect(readMobileNavLayout().keys).toEqual(["people", "companies", "home", "hub"]);
  });

  it("relit ce qui a été enregistré (prioritaire sur l'ancien réglage)", () => {
    fakeWindow({ "lc.layout.hideAcademyMobile": "1" });
    const layout = { keys: ["emails", "people", "home", "hub", "academy"], forceBubble: true };
    writeMobileNavLayout(layout);
    expect(readMobileNavLayout()).toEqual(layout);
  });
});
