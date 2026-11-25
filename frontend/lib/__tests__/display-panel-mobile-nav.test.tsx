// frontend/lib/__tests__/display-panel-mobile-nav.test.tsx

import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => true }));

import { DisplayPanel } from "@/components/settings/panels/DisplayPanel";

describe("DisplayPanel (mobile)", () => {
  it("ouvre directement la sous-page « Barre de navigation » quand demandé", () => {
    const html = renderToStaticMarkup(<DisplayPanel initialView="mobile-nav" />);
    expect(html).toContain('aria-label="Retour à l&#x27;affichage"');
    expect(html).toContain('data-key="other"');
  });
});
