// frontend/components/marketing/provider-icons.tsx

import { useId, type ComponentType } from "react";

export type ProviderIconProps = { className?: string };

// Logo Claude dessiné sur mesure (couleur = currentColor, s'adapte au contexte).
export const CLAUDE_SPARK_VIEWBOX = "0 0 226.77 226.77";
export const CLAUDE_SPARK_PATH =
  "M91.48,109.72L25.79,65.84c-8.89-13.59,5.54-23.47,13.12-17.63l49.73,37.3c.92.69,2.13-.36,1.58-1.36L55.95,21.38c-2.67-10.96,13.28-19.57,20.08-10.91l37.96,77.19c.44.9,1.79.64,1.87-.36l5.38-68.41c2.69-11.51,20.41-11.62,19.15,2.49l-10.5,59.84c-.2,1.15,1.26,1.83,2,.93l39.85-47.98c7.3-7.53,23.93.49,16.77,15.81l-35.15,50.03c-.67.96.17,2.25,1.32,2.01l53.92-11.25c10.37-.68,13.41,10.74,7.36,13.77l-68.17,15.56c-.59.14-.53,1,.07,1.05l62.59,5.12c14.25,3.27,10.83,19.09-2.49,18.38l-61.19-14.53c-.59-.14-.99.59-.54,1.01l51.31,48.21c1.8,4.39-3.05,9.03-6.57,7.08l-43.47-35.42c-.5-.41-1.18.2-.83.75l24.9,38.73c4.48,11.23-8.42,16.83-12.76,11.74l-33.84-52.55c-.49-.77-1.68-.48-1.76.43l-6.09,63.73c-1.8,7.04-19.4,5.46-17.11-6.52l12.59-64.02c.12-.62-.68-.99-1.07-.49l-46.25,58.51c-5.42,4.37-12.77-1.07-10.39-5.8l45.46-59.27c.44-.57-.25-1.32-.85-.93l-56.53,36.25c-11,6-18.9-5.59-11-11.46l58.37-35c1.53-.92.94-3.26-.84-3.35l-76.45-3.53c-7.59-2.19-7.72-12.16-.93-12.54l78.78,5.72c.93.07,1.35-1.15.57-1.66Z";

export const GOOGLE_G_PATH = "M18.1 6.9A8 8 0 1 0 20 12h-7.8";

export const ClaudeIcon = ({ className = "size-5" }: ProviderIconProps) => (
  <svg className={className} viewBox={CLAUDE_SPARK_VIEWBOX} fill="currentColor" aria-hidden="true">
    <path d={CLAUDE_SPARK_PATH} />
  </svg>
);

export const GoogleIcon = ({ className = "size-5" }: ProviderIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.2"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={GOOGLE_G_PATH} />
  </svg>
);

export const AnthropicIcon = ({ className = "size-5" }: ProviderIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    fillRule="evenodd"
    aria-hidden="true"
  >
    <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
  </svg>
);

export const OpenAIIcon = ({ className = "size-5" }: ProviderIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    fillRule="evenodd"
    aria-hidden="true"
  >
    <path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523z" />
  </svg>
);

export const GeminiIcon = ({ className = "size-5" }: ProviderIconProps) => {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975z"
        fill={`url(#${id})`}
      />
      <defs>
        <linearGradient id={id} x1="3" y1="19" x2="20" y2="4">
          <stop stopColor="#08B962" />
          <stop offset=".45" stopColor="#3186FF" />
          <stop offset="1" stopColor="#F94543" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const GroqIcon = ({ className = "size-5" }: ProviderIconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.036 2c-3.853-.035-7 3-7.036 6.781-.035 3.782 3.055 6.872 6.908 6.907h2.42v-2.566h-2.292c-2.407.028-4.38-1.866-4.408-4.23-.029-2.362 1.901-4.298 4.308-4.326h.1c2.407 0 4.358 1.915 4.365 4.278v6.305c0 2.342-1.944 4.25-4.323 4.279a4.375 4.375 0 01-3.033-1.252l-1.851 1.818A7 7 0 0012.029 22h.092c3.803-.056 6.858-3.083 6.879-6.816v-6.5C18.907 4.963 15.817 2 12.036 2z" />
  </svg>
);

export const MistralIcon = ({ className = "size-5" }: ProviderIconProps) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3.428 3.4h3.429v3.428H3.428zm13.714 0h3.43v3.428h-3.43z" fill="gold" />
    <path d="M3.428 6.828h6.857v3.429H3.429zm10.286 0h6.857v3.429h-6.857z" fill="#FFAF00" />
    <path d="M3.428 10.258h17.144v3.428H3.428z" fill="#FF8205" />
    <path
      d="M3.428 13.686h3.429v3.428H3.428zm6.858 0h3.429v3.428h-3.429zm6.856 0h3.43v3.428h-3.43z"
      fill="#FA500F"
    />
    <path d="M0 17.114h10.286v3.429H0zm13.714 0H24v3.429H13.714z" fill="#E10500" />
  </svg>
);

export const PerplexityIcon = ({ className = "size-5" }: ProviderIconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.785 0v7.272H22.5V17.62h-2.935V24l-7.037-6.194v6.145h-1.091v-6.152L4.392 24v-6.465H1.5V7.188h2.884V0l7.053 6.494V.19h1.09v6.49L19.786 0zm-7.257 9.044v7.319l5.946 5.234V14.44zm-1.099-.08l-5.946 5.398v7.235l5.946-5.234zm8.136 7.58h1.844V8.349H13.46l6.105 5.54zm-8.982-8.28H2.59v8.195h1.8v-2.576zM5.475 2.476v4.71h5.115zm13.219 0l-5.115 4.71h5.115z" />
  </svg>
);

export const PROVIDER_ICONS: Record<string, ComponentType<ProviderIconProps>> = {
  Claude: ClaudeIcon,
  Anthropic: AnthropicIcon,
  OpenAI: OpenAIIcon,
  Google: GoogleIcon,
  Gemini: GeminiIcon,
  Groq: GroqIcon,
  Mistral: MistralIcon,
  Perplexity: PerplexityIcon,
};
