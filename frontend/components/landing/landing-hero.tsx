// frontend/components/landing/landing-hero.tsx

import { useEffect, useState } from "react";
import { Button } from "./landing-button";
import { ArrowRight } from "./landing-icons";
import { SiteLink, routes } from "./landing-link";

const heroImage = "/images/site/hero/hero.svg";
const heroImagePhone = "/images/site/hero/hero.svg";
const tabAgent = "/images/site/tabs/agent.webp";
const tabSignals = "/images/site/tabs/signals.webp";
const tabLeads = "/images/site/tabs/leads.webp";
const tabMultichannel = "/images/site/tabs/multichannel.webp";
const tabDeliverability = "/images/site/tabs/deliverability.webp";

const tabs = [
  { label: "Laissez l'IA s'en charger", img: tabAgent },
  { label: "Trouvez et enrichissez vos leads", img: tabLeads },
  { label: "Détectez les signaux d'achat", img: tabSignals },
  { label: "Engagez sur tous les canaux", img: tabMultichannel },
  { label: "Évitez les spams", img: tabDeliverability },
];

export function LandingHero() {
  const [t, setT] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setT((value) => (value + 1) % tabs.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [paused]);
  const active = tabs[t] ?? tabs[0];
  if (!active) return null;
  return (
    <section id="top" className="lc-hero">
      <div className="lc-hero-scene">
        <picture>
          <source media="(max-width: 600px)" srcSet={heroImagePhone} />
          <img
            src={heroImage}
            alt="Une base de recherche dans un paysage martien au coucher du soleil"
            fetchPriority="high"
            width="2880"
            height="1600"
          />
        </picture>
      </div>
      <div className="lc-hero-copy lc-container">
        <h1>
          Deux IA.
          <br />
          <em>Toute votre prospection.</em>
        </h1>
        <div>
          <p>L'une trouve vos prospects. L'autre leur écrit. Vous validez.</p>
          <p>Essai gratuit · Sans carte bancaire</p>
          <div className="lc-cta-row">
            <Button asChild variant="lcLight">
              <SiteLink to={routes.signup}>
                Démarrer gratuitement
                <ArrowRight />
              </SiteLink>
            </Button>
            <Button asChild variant="lcOutline">
              <SiteLink to={routes.product}>Voir le produit</SiteLink>
            </Button>
          </div>
        </div>
      </div>
      <div
        className="lc-container lc-product"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
      >
        <div className="lc-browser">
          <div className="lc-browser-header">
            <img src="/images/site/tabs/window-dots.svg" alt="" className="lc-window-dots" />
            <div className="lc-browser-tabs" role="tablist" aria-label="Fonctionnalités LeadCortex">
              {tabs.map((x, i) => (
                <button
                  key={x.label}
                  role="tab"
                  id={`product-tab-${i}`}
                  aria-selected={t === i}
                  aria-controls="product-panel"
                  tabIndex={t === i ? 0 : -1}
                  className={`lc-browser-tab ${t === i ? "active" : ""}`}
                  onClick={() => {
                    setT(i);
                    setPaused(true);
                  }}
                >
                  {x.label}
                </button>
              ))}
            </div>
          </div>

          <div id="product-panel" role="tabpanel" aria-labelledby={`product-tab-${t}`}>
            <div className="lc-product-panel">
              <img
                key={t}
                src={active.img}
                alt={active.label}
                width="1600"
                height="900"
                className="lc-tab-image"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
