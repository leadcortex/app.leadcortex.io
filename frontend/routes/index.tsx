// frontend/routes/index.tsx

import { createFileRoute } from "@tanstack/react-router";
import "@/components/landing/landing.css";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingCompetitors } from "@/components/landing/landing-competitors";
import { LandingIntegrations } from "@/components/landing/landing-integrations";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingPersonas } from "@/components/landing/landing-personas";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { LeadCortexTablet } from "@/components/landing/lead-cortex-tablet";
import { LandingDocs } from "@/components/landing/landing-docs";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Reveal } from "@/components/landing/landing-reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeadCortex — Équipe d'agents IA de prospection B2B" },
      {
        name: "description",
        content: "L'équipe d'agents IA qui trouve, enrichit et contacte vos prospects B2B.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function Divider() {
  return (
    <div className="lc-divider-custom" aria-hidden="true">
      <img src="/images/site/decor/separator.svg" alt="" />
    </div>
  );
}

function LandingPage() {
  return (
    <div className="lc-page text-foreground">
      <LandingNav />
      <main>
        <LandingHero />
        <Reveal>
          <LandingCompetitors />
        </Reveal>
        <Reveal>
          <LandingIntegrations />
        </Reveal>
        <LandingFeatures />
        <Divider />
        <Reveal>
          <LandingPersonas />
        </Reveal>
        <Divider />
        <Reveal>
          <LandingPricing />
        </Reveal>
        <Divider />
        <Reveal>
          <LeadCortexTablet />
        </Reveal>
        <Reveal>
          <LandingDocs />
        </Reveal>
        <Divider />
        <Reveal>
          <LandingFaq />
        </Reveal>
      </main>
      <LandingFooter />
    </div>
  );
}
