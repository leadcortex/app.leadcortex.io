//frontend\components\ai-assistant\provider-logos.tsx
import React from "react";
import { Wind as WindIcon, Zap as ZapIcon } from "lucide-react";
import { PROVIDER_ICONS } from "@/components/provider-icons";

type LogoProps = {
  className?: string;
  size?: number;
};

function PerplexityProviderIcon({ className, size = 16 }: LogoProps) {
  const Raw = (
    PROVIDER_ICONS as Record<
      string,
      React.ComponentType<{ className?: string; strokeWidth?: number }>
    >
  )["Perplexity"];
  if (!Raw) return null;
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Raw className="size-full" />
    </span>
  );
}

export const PROVIDER_LOGOS: Record<string, React.ComponentType<LogoProps>> = {
  OpenAI: OpenAILogo,
  Anthropic: AnthropicLogo,
  Google: GeminiLogo,
  Gemini: GeminiLogo,
  DeepSeek: DeepSeekLogo,
  Perplexity: PerplexityProviderIcon,
  Mistral: MistralLogo,
  Groq: GroqLogo,
};

export function getProviderLogo(provider?: string) {
  if (!provider) return null;
  return PROVIDER_LOGOS[provider] ?? null;
}

export function OpenAILogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 004.981 4.18a5.985 5.985 0 00-3.998 2.9 6.046 6.046 0 00.743 7.097 5.98 5.98 0 00.51 4.911 6.051 6.051 0 006.515 2.9A5.985 5.985 0 0013.26 24a6.056 6.056 0 005.772-4.206 5.99 5.99 0 003.997-2.9 6.056 6.056 0 00-.747-7.073zM13.26 22.43a4.476 4.476 0 01-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 00.392-.681v-6.737l2.02 1.168a.071.071 0 01.038.052v5.583a4.504 4.504 0 01-4.494 4.494zM3.6 18.304a4.47 4.47 0 01-.535-3.014l.142.085 4.783 2.759a.771.771 0 00.78 0l5.843-3.369v2.332a.08.08 0 01-.033.062L9.74 19.95a4.5 4.5 0 01-6.14-1.646zM2.34 7.896a4.485 4.485 0 012.366-1.973V11.6a.766.766 0 00.388.676l5.815 3.355-2.02 1.168a.076.076 0 01-.071 0l-4.83-2.786A4.504 4.504 0 012.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 01.071 0l4.83 2.791a4.494 4.494 0 01-.676 8.105v-5.678a.79.79 0 00-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 00-.785 0L9.409 9.23V6.897a.066.066 0 01.028-.061l4.83-2.787a4.5 4.5 0 016.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 01-.038-.057V6.075a4.5 4.5 0 017.375-3.453l-.142.08L8.704 5.46a.795.795 0 00-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z" />
    </svg>
  );
}

export function AnthropicLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      className={className}
      aria-hidden="true"
    >
      <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
    </svg>
  );
}

export function GeminiLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C12.55 6.55 17.45 11.45 24 12C17.45 12.55 12.55 17.45 12 24C11.45 17.45 6.55 12.55 0 12C6.55 11.45 11.45 6.55 12 0Z" />
    </svg>
  );
}

export function DeepSeekLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1.366-2.082c-.379-.406-.753-.818-1.017-1.237-.51-.807-.909-1.703-1.516-2.446-.744-.91-1.568-1.716-2.51-2.395-.203-.146-.385-.302-.487-.366-.178-.11-.343-.238-.442-.36-.313-.382-.02-.918.452-1.041.485-.127.986-.175 1.484-.135.62.05 1.23.19 1.83.4.47.166.914.39 1.33.68.34.237.63.54.868.894.28.417.474.88.58 1.365.15.685.09 1.383-.06 2.062-.13.59-.35 1.155-.664 1.68-.11.185-.25.37-.45.478z" />
    </svg>
  );
}

export function MistralLogo({ className, size = 16 }: LogoProps) {
  return (
    <WindIcon
      className={className}
      strokeWidth={1.8}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

export function GroqLogo({ className, size = 16 }: LogoProps) {
  return (
    <ZapIcon
      className={className}
      strokeWidth={1.8}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
