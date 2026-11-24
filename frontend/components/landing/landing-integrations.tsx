// frontend/components/landing/landing-integrations.tsx

const stack = [
  "Gmail",
  "Outlook",
  "LinkedIn",
  "WhatsApp",
  "Instagram",
  "Anthropic",
  "OpenAI",
  "Google",
  "Groq",
  "DeepSeek",
  "Mistral",
];

export function LandingIntegrations() {
  return (
    <section className="overflow-hidden py-16">
      <p className="px-6 text-center text-sm text-muted-foreground">
        Se branche à vos outils
      </p>
      <div className="lc-marquee mt-10" aria-hidden="true">
        <div className="lc-marquee-track">
          {[0, 1].map((copy) => (
            <div key={copy} className="lc-marquee-group">
              {stack.map((name) => (
                <span key={`${copy}-${name}`} className="lc-brand-chip">
                  {name}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
