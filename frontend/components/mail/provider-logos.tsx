//frontend\components\mail\provider-logos.tsx
import type { SVGProps } from "react";

export type MailProvider = "gmail" | "outlook" | "yahoo" | "icloud" | "imap";

export const PROVIDER_LABELS: Record<MailProvider, string> = {
  gmail: "Gmail",
  outlook: "Outlook",
  yahoo: "Yahoo Mail",
  icloud: "iCloud Mail",
  imap: "IMAP / Autre",
};

export const PROVIDER_HINTS: Record<MailProvider, string> = {
  gmail: "Google Workspace ou @gmail.com",
  outlook: "Microsoft 365, Hotmail, Live",
  yahoo: "@yahoo.com, @ymail.com",
  icloud: "@icloud.com, @me.com",
  imap: "Serveur de messagerie personnalisé",
};

export const PROVIDER_COLORS: Record<MailProvider, string> = {
  gmail: "#EA4335",
  outlook: "#0F6CBD",
  yahoo: "#6001D2",
  icloud: "#3693F3",
  imap: "#6B7280",
};

export function GmailLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path fill="#4CAF50" d="M45 16.2l-5 2.75-5 4.75L35 40h7c1.657 0 3-1.343 3-3V16.2z" />
      <path fill="#1E88E5" d="M3 16.2l3.614 1.71L13 23.7V40H6c-1.657 0-3-1.343-3-3V16.2z" />
      <polygon
        fill="#E53935"
        points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"
      />
      <path
        fill="#C62828"
        d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859C9.132 8.301 8.228 8 7.298 8h0C4.924 8 3 9.924 3 12.298z"
      />
      <path
        fill="#FBC02D"
        d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341C38.868 8.301 39.772 8 40.702 8h0C43.076 8 45 9.924 45 12.298z"
      />
    </svg>
  );
}

export function OutlookLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <rect x="20" y="9" width="25" height="24" rx="2" fill="#0F6CBD" />
      <rect x="20" y="9" width="25" height="9" fill="#28A8EA" />
      <polygon points="20,18 32.5,26 45,18 45,22 32.5,29.5 20,22" fill="#0A2767" opacity="0.5" />
      <rect x="3" y="12" width="24" height="24" rx="2.5" fill="#0F6CBD" />
      <circle cx="15" cy="24" r="8.5" fill="#fff" />
      <circle cx="15" cy="24" r="5.5" fill="#0F6CBD" />
    </svg>
  );
}

export function YahooLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <rect x="3" y="3" width="42" height="42" rx="9" fill="#5F01D1" />
      <path d="M13 14h6.2l4.8 9 4.8-9H35l-8.7 15.3V37h-6v-7.7z" fill="#fff" />
      <rect x="30.5" y="30.5" width="6" height="6" fill="#fff" />
    </svg>
  );
}

export function ICloudLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <defs>
        <linearGradient id="icloud-grad" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#5FC0F8" />
          <stop offset="1" stopColor="#1C6DE3" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="42" height="42" rx="9" fill="url(#icloud-grad)" />
      <path
        d="M31.5 22.3c-.6-3.9-4-6.9-8.1-6.9-3.1 0-5.8 1.7-7.2 4.3-3.4.3-6.1 3.1-6.1 6.6 0 3.7 3 6.6 6.6 6.6h14.4c3.1 0 5.6-2.5 5.6-5.6 0-2.6-1.8-4.8-4.3-5.4-.3-.1-.6-.2-.9.4z"
        fill="#fff"
      />
    </svg>
  );
}

export function ImapLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <rect x="3" y="10" width="42" height="28" rx="4" fill="#6B7280" />
      <path
        d="M5 13.5l19 13 19-13"
        stroke="#fff"
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect
        x="5"
        y="13"
        width="38"
        height="22"
        rx="2"
        fill="none"
        stroke="#fff"
        strokeWidth="1.5"
        opacity="0.6"
      />
    </svg>
  );
}

export function ProviderLogo({
  provider,
  className,
}: {
  provider: MailProvider;
  className?: string;
}) {
  switch (provider) {
    case "gmail":
      return <GmailLogo className={className} />;
    case "outlook":
      return <OutlookLogo className={className} />;
    case "yahoo":
      return <YahooLogo className={className} />;
    case "icloud":
      return <ICloudLogo className={className} />;
    case "imap":
      return <ImapLogo className={className} />;
  }
}
