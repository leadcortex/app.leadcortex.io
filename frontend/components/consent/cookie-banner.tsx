// frontend/components/consent/cookie-banner.tsx

import { Link } from "@tanstack/react-router";
import { X } from "@/components/icons";
import { useEffect, useRef, useState } from "react";
import {
  NECESSARY_INVENTORY,
  enabledCategories,
  hasOptionalTrackers,
  type ConsentCategory,
} from "@/lib/consent/consent-config";
import {
  acceptAll,
  closeConsentPreferences,
  initConsent,
  openConsentPreferences,
  rejectAll,
  savePreferences,
  useConsentState,
  type ConsentChoices,
  type ConsentState,
} from "@/lib/consent/consent-store";

const choiceButton =
  "inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const secondaryButton =
  "inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-all hover:bg-surface active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function CookieConsent() {
  const consent = useConsentState();

  useEffect(() => {
    initConsent();
  }, []);

  if (!consent.ready) return null;
  if (consent.panelOpen) return <PreferencesDialog consent={consent} />;
  if (!consent.decided && hasOptionalTrackers()) return <ConsentBanner />;
  return null;
}

function ConsentBanner() {
  const purposes = enabledCategories()
    .map((category) => category.label.toLowerCase())
    .join(", ");

  return (
    <section
      role="region"
      aria-label="Gestion des cookies"
      className="fixed inset-x-3 bottom-3 z-[70] pb-[env(safe-area-inset-bottom)] sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-md"
    >
      <div className="rounded-2xl border border-border bg-background p-5 shadow-2xl">
        <h2 className="font-display text-xl italic tracking-tight text-foreground">
          Vos choix sur les cookies
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          LeadCortex utilise des cookies strictement nécessaires au fonctionnement du service. Avec
          votre accord, nous utilisons aussi des traceurs pour : {purposes}. Vous pouvez accepter,
          refuser ou personnaliser vos choix, et les modifier à tout moment depuis le lien « Gérer
          mes cookies » en bas de page.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Ne rien faire revient à refuser. La liste des services concernés est disponible dans «
          Personnaliser ».{" "}
          <Link
            to="/legal/cookies"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Politique de cookies
          </Link>
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={rejectAll} className={choiceButton}>
            Tout refuser
          </button>
          <button type="button" onClick={acceptAll} className={choiceButton}>
            Tout accepter
          </button>
          <button
            type="button"
            onClick={openConsentPreferences}
            className={`${secondaryButton} col-span-2`}
          >
            Personnaliser
          </button>
        </div>
      </div>
    </section>
  );
}

function PreferencesDialog({ consent }: { consent: ConsentState }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<ConsentChoices>(consent.choices);
  const categories = enabledCategories();

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'button, a[href], summary, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("disabled"));

    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeConsentPreferences();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeConsentPreferences();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-dialog-title"
        className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-border bg-background p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="consent-dialog-title"
              className="font-display text-2xl italic tracking-tight text-foreground"
            >
              Gestion des cookies
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              Vous gardez la main : vos choix sont conservés 6 mois, puis nous vous les
              redemandons. Vous pouvez les modifier à tout moment.
            </p>
          </div>
          <button
            type="button"
            onClick={closeConsentPreferences}
            aria-label="Fermer la gestion des cookies"
            className="-mr-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">Strictement nécessaires</h3>
              <span className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                Toujours actifs
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              Indispensables à la connexion, à la sécurité et à l'affichage de l'application. Ils
              ne nécessitent pas votre consentement.
            </p>
            <details className="group mt-2">
              <summary className="cursor-pointer text-xs font-medium text-foreground/80 underline underline-offset-2 hover:text-foreground">
                Voir le détail
              </summary>
              <ul className="mt-3 space-y-3">
                {NECESSARY_INVENTORY.map((item) => (
                  <li key={item.name} className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-mono text-[11px] text-foreground">{item.name}</span>
                    {" — "}
                    {item.purpose} <span className="italic">Durée : {item.duration}.</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>

          {categories.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-[13px] leading-relaxed text-muted-foreground">
              Actuellement, LeadCortex n'utilise aucun traceur soumis à consentement : ni mesure
              d'audience, ni publicité, ni service tiers déposant des cookies. Si cela change, nous
              vous demanderons votre accord avant tout dépôt.
            </p>
          ) : (
            categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                checked={draft[category.id] === true}
                onChange={(next) => setDraft((prev) => ({ ...prev, [category.id]: next }))}
              />
            ))
          )}
        </div>

        {categories.length === 0 ? (
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <Link
              to="/legal/cookies"
              onClick={closeConsentPreferences}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Lire la politique de cookies
            </Link>
            <button type="button" onClick={closeConsentPreferences} className={choiceButton}>
              Fermer
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button type="button" onClick={rejectAll} className={choiceButton}>
              Tout refuser
            </button>
            <button type="button" onClick={acceptAll} className={choiceButton}>
              Tout accepter
            </button>
            <button
              type="button"
              onClick={() => savePreferences(draft)}
              className={`${secondaryButton} col-span-2`}
            >
              Enregistrer mes choix
            </button>
            <Link
              to="/legal/cookies"
              onClick={closeConsentPreferences}
              className="col-span-2 mt-1 text-center text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Lire la politique de cookies
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  checked,
  onChange,
}: {
  category: ConsentCategory;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const labelId = `consent-${category.id}-label`;

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 id={labelId} className="text-sm font-semibold text-foreground">
          {category.label}
        </h3>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={labelId}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            checked ? "bg-foreground" : "bg-surface"
          }`}
        >
          <span
            aria-hidden="true"
            className={`inline-block size-4 rounded-full transition-transform ${
              checked ? "translate-x-[22px] bg-background" : "translate-x-[3px] bg-muted-foreground"
            }`}
          />
        </button>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        {category.description}
      </p>
      {category.providers.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-medium text-foreground/80 underline underline-offset-2 hover:text-foreground">
            Services concernés
          </summary>
          <ul className="mt-3 space-y-2">
            {category.providers.map((provider) => (
              <li key={provider.name} className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">{provider.name}</span>
                {" — "}
                {provider.purpose}{" "}
                <a
                  href={provider.privacyUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Politique de confidentialité
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
