// frontend/lib/__tests__/hold-to-confirm-button.test.tsx

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HoldToConfirmButton } from "@/components/common/hold-to-confirm-button";

describe("HoldToConfirmButton", () => {
  it("affiche un bouton vide (non rempli) avec son libellé et la consigne de maintien", () => {
    const html = renderToStaticMarkup(
      <HoldToConfirmButton onConfirm={() => {}}>Révoquer</HoldToConfirmButton>,
    );
    expect(html).toContain("Révoquer");
    expect(html).toContain('title="Maintenez le bouton enfoncé pour confirmer"');
    expect(html).toContain("scaleX(0)");
  });

  it("peut être désactivé (ex. tant que le texte de confirmation n'est pas tapé)", () => {
    const html = renderToStaticMarkup(
      <HoldToConfirmButton onConfirm={() => {}} disabled>
        Supprimer
      </HoldToConfirmButton>,
    );
    expect(html).toMatch(/<button[^>]*disabled/);
  });
});
