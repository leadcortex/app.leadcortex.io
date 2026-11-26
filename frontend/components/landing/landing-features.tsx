// frontend/components/landing/landing-features.tsx

import { ArrowRight } from "./landing-icons";
import { SiteLink, routes } from "./landing-link";

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
    t: "Décrivez votre cible, l'IA trouve les prospects.",
    d: ["Écrivez-la comme à un collègue. Les résultats tiennent compte des signaux d'achat : recrutements, levées, changements de poste."],
    img: tabSignals,
    bg: backgroundBlue,
  },
  {
    t: "E-mails et téléphones vérifiés",
    d: ["Un crédit n'est décompté que si la donnée est trouvée."],
    img: tabLeads,
    bg: backgroundGreen,
  },
  {
    t: "Un message écrit pour chaque prospect",
    d: ["L'IA part du poste, de l'entreprise et des signaux du prospect. Vous relisez avant l'envoi."],
    img: tabAgent,
    bg: backgroundPink,
  },
  {
    t: "Du signal au premier message, sans intervention",
    d: ["Vous dessinez le scénario sur un canevas, en glisser-déposer."],
    img: tabMultichannel,
    bg: backgroundOrange,
  },
];

function FeatureCard({ f, i }: { f: (typeof features)[number]; i: number }) {
  return (
    <div className="lc-feature-card">
      <div className="lc-feature-inner">
        <div className="lc-feature-copy">
          <span className="lc-feature-index tabular-nums">0{i + 1}</span>
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
      <h2 className="max-w-3xl">
        Ce que font <em>les deux agents</em>.
      </h2>
      <div className="lc-feature-stack">
        {features.map((f, i) => (
          <FeatureCard key={f.t} f={f} i={i} />
        ))}
      </div>
    </section>
  );
}
