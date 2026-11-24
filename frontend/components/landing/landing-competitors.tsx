// frontend/components/landing/landing-competitors.tsx

import {
  ApolloLogo,
  ClayLogo,
  HunterLogo,
  LemlistLogo,
} from "@/components/marketing/pricing-logos";

const competitors = [
  { id: "apollo", label: "Apollo", Logo: ApolloLogo },
  { id: "clay", label: "Clay", Logo: ClayLogo },
  { id: "lemlist", label: "Lemlist", Logo: LemlistLogo },
  { id: "hunter", label: "Hunter", Logo: HunterLogo },
];

const group = [...competitors, ...competitors, ...competitors];

export function LandingCompetitors() {
  return (
    <section className="lc-competitors" aria-label="L'alternative aux outils enterprise">
      <div className="lc-competitors-inner">
        <p className="lc-competitors-label">L'alternative aux outils enterprise</p>
        <div className="lc-marquee lc-competitors-marquee">
          <div className="lc-marquee-track">
            {[0, 1].map((copy) => (
              <ul key={copy} className="lc-marquee-group" aria-hidden={copy === 1}>
                {group.map(({ id, label, Logo }, i) => (
                  <li key={`${copy}-${id}-${i}`} title={label} className="lc-competitor">
                    <Logo className="lc-competitor-logo" />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
