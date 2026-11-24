// frontend/components/landing/landing-nav.tsx

import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "./landing-button";
import { ArrowRight, ChevronDown, Menu, X } from "./landing-icons";
import { SiteLink, routes } from "./landing-link";

const navGroups = [
  {
    label: "Produit",
    links: [
      ["Vue d'ensemble", routes.product],
      ["Fonctionnalités", "#features"],
      ["Pour qui ?", "#personas"],
    ],
  },
  {
    label: "Ressources",
    links: [
      ["Documentation", routes.docs],
      ["Manifeste", routes.manifest],
      ["Sécurité", routes.security],
      ["Questions fréquentes", "#faq"],
      ["Support", routes.support],
    ],
  },
];

export function LandingNav() {
  const [mobile, setMobile] = useState(false);
  const [group, setGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) {
        setGroup(null);
        setMobile(false);
      }
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setGroup(null);
        setMobile(false);
      }
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <header className="lc-header">
      <nav ref={navRef} aria-label="Navigation principale" className="lc-nav">
        <BrandLogo />
        <div className="lc-desktop-links">
          {navGroups.map((item) => (
            <div className="lc-nav-group" key={item.label}>
              <Button
                variant="lcNav"
                aria-expanded={group === item.label}
                onClick={() => setGroup(group === item.label ? null : item.label)}
              >
                {item.label}
                <ChevronDown />
              </Button>
              {group === item.label && (
                <div className="lc-dropdown">
                  {item.links.map(([label, href]) => (
                    <SiteLink key={label} to={href} onClick={() => setGroup(null)}>
                      {label}
                      <ArrowRight size={15} />
                    </SiteLink>
                  ))}
                </div>
              )}
            </div>
          ))}
          <SiteLink className="lc-nav-link" to={routes.pricing}>
            Tarifs
          </SiteLink>
        </div>
        <div className="lc-nav-actions">
          <SiteLink className="lc-login" to={routes.login}>
            Connexion
          </SiteLink>
          <Button asChild variant="lcLight" className="lc-nav-demo">
            <SiteLink to={routes.product}>Voir le produit</SiteLink>
          </Button>
          <Button asChild variant="lcDark" className="lc-nav-try">
            <SiteLink to={routes.signup}>Essayer gratuitement</SiteLink>
          </Button>
          <Button
            variant="lcNav"
            size="icon"
            className="lc-menu-toggle"
            aria-label={mobile ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </Button>
        </div>
        {mobile && (
          <div className="lc-mobile-menu">
            {navGroups.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                {item.links.map(([label, href]) => (
                  <SiteLink key={label} to={href} onClick={() => setMobile(false)}>
                    {label}
                    <ArrowRight size={16} />
                  </SiteLink>
                ))}
              </div>
            ))}
            <SiteLink to={routes.pricing}>Tarifs</SiteLink>
            <SiteLink to={routes.login}>Connexion</SiteLink>
            <Button asChild variant="lcDark">
              <SiteLink to={routes.signup}>Essayer gratuitement</SiteLink>
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}
