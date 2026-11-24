// frontend/components/landing/landing-features.tsx

import { useEffect, useRef } from "react";
import { ArrowRight } from "./landing-icons";
import { SiteLink, routes } from "./landing-link";
import { Reveal } from "./landing-reveal";
import { eyebrow } from "./landing-styles";

const backgroundBlue = "/images/site/features/blue.avif";
const backgroundGreen = "/images/site/features/green.avif";
const backgroundOrange = "/images/site/features/orange.avif";
const backgroundPink = "/images/site/features/pink.avif";
const tabAgent = "/images/site/tabs/agent.webp";
const tabSignals = "/images/site/tabs/signals.webp";
const tabLeads = "/images/site/tabs/leads.webp";
const tabMultichannel = "/images/site/tabs/multichannel.webp";

const features = [
  {
    t: "Décrivez votre cible. L'IA trouve les prospects.",
    d: ["En langage naturel, avec les signaux d'achat."],
    img: tabSignals,
    bg: backgroundBlue,
  },
  {
    t: "Emails et téléphones vérifiés.",
    d: ["Vous ne payez que ce qui aboutit."],
    img: tabLeads,
    bg: backgroundGreen,
  },
  {
    t: "Des messages écrits pour chaque prospect.",
    d: ["Pas de « Bonjour {Prénom} »."],
    img: tabAgent,
    bg: backgroundPink,
  },
  {
    t: "Du signal au premier message, en automatique.",
    d: ["Un canevas visuel, en glisser-déposer."],
    img: tabMultichannel,
    bg: backgroundOrange,
  },
];

function FeatureCard({ f, i }: { f: (typeof features)[number]; i: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const next = el.nextElementSibling;
      const progress = next
        ? Math.max(
            0,
            Math.min(
              1,
              (window.innerHeight * 0.8 - next.getBoundingClientRect().top) /
                (window.innerHeight * 0.7),
            ),
          )
        : 0;
      el.style.setProperty("--stack-scale", String(1 - 0.08 * progress));
      el.style.setProperty("--stack-rotate", `${(i % 2 ? 3 : -3) * progress}deg`);
      el.style.setProperty("--stack-y", `${progress * 45}px`);
      el.style.setProperty("--stack-progress", String(progress));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame);
    };
  }, [i]);
  return (
    <div ref={ref} className="lc-feature-card">
      <div className="lc-feature-inner">
        <div className="lc-feature-copy">
          <div className="lc-feature-badge">
            <img src={f.bg} alt="" />
            <span className="lc-feature-badge-number font-mono">0{i + 1}</span>
          </div>
          <h3>{f.t}</h3>
          {f.d.map((text) => (
            <p key={text}>{text}</p>
          ))}
          <SiteLink to={routes.product} className="lc-feature-link">
            En savoir plus
            <ArrowRight size={17} />
          </SiteLink>
        </div>
        <div className="lc-feature-media">
          <img src={f.bg} alt="" className="lc-feature-background" loading="lazy" />
          <img
            src={f.img}
            alt={f.t}
            loading="lazy"
            className="lc-feature-screen"
            width="1600"
            height="900"
          />
        </div>
      </div>
    </div>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="lc-features lc-container">
      <Reveal>
        <p className={eyebrow}>Fonctionnalités</p>
        <h2 className="mt-3 max-w-3xl">
          Des agents qui <em>travaillent pour vous</em>.
        </h2>
      </Reveal>
      <div className="lc-feature-stack">
        {features.map((f, i) => (
          <FeatureCard key={f.t} f={f} i={i} total={features.length} />
        ))}
      </div>
    </section>
  );
}
