// frontend/lib/__tests__/mobile-nav-bar-view.test.tsx

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MobileNavBarView } from "@/components/layout/mobile-nav-bar-view";

describe("MobileNavBarView", () => {
  it("affiche la bulle seulement si fournie et autant de colonnes que de cellules", () => {
    const items = [<b key="a">A</b>, <b key="b">B</b>, <b key="c">C</b>];
    const withBubble = renderToStaticMarkup(<MobileNavBarView bubble={<i>Z</i>} items={items} />);
    const without = renderToStaticMarkup(<MobileNavBarView bubble={null} items={items} />);

    expect(withBubble).toContain("<i>Z</i>");
    expect(withBubble).toContain("repeat(3, minmax(0, 1fr))");
    expect(without).not.toContain("rounded-full");
    expect(without).toContain("<b>A</b><b>B</b><b>C</b>");
  });
});
