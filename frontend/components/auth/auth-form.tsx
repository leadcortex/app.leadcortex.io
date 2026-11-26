// frontend/components/auth/auth-form.tsx

import { useId, useState, type ReactNode } from "react";
import { AlertCircle, Eye, EyeOff } from "@/components/icons";
import { BrandLogo } from "@/components/brand/brand-logo";
import { WavyImageFrame } from "@/components/marketing/wavy-image-frame";
import { cn } from "@/lib/core/utils";

const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    className="size-4 shrink-0"
    aria-hidden="true"
  >
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);

const LinkedInIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="size-4 shrink-0"
    aria-hidden="true"
  >
    <rect width="24" height="24" rx="4" fill="#0A66C2" />
    <path
      fill="#FFFFFF"
      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="size-4 shrink-0"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const HIDE_NATIVE_PW_UI =
  "[&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-contacts-auto-fill-button]:hidden";

const CONTROL =
  "flex h-11 w-full items-center rounded-lg border bg-background px-3 text-base md:h-10 md:text-sm placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

const SECONDARY_BUTTON =
  "flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors duration-150 ease-out hover:bg-surface/70 active:bg-surface disabled:cursor-not-allowed disabled:opacity-50 md:h-10";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100dvh-2rem)] auth-grid md:min-h-[calc(100dvh-3rem)] lg:grid-cols-2">
      <div className="flex flex-col p-4 md:p-12">
        <BrandLogo />
        <div className="flex flex-1 items-center py-12">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="font-display text-4xl italic tracking-tight md:text-5xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 LeadCortex</p>
      </div>

      <div className="relative hidden bg-background auth-side lg:block">
        <WavyImageFrame src="/images/auth/login-signup.webp" alt="Vagues sur une plage de sable" />
      </div>
    </div>
  );
}

export function SocialSignIn({
  onGoogle,
  busy,
}: {
  onGoogle: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  busy: boolean;
}) {
  const devOnly = !import.meta.env.DEV;
  const devTitle = import.meta.env.DEV ? "Ouvrir une session de test" : "Bientôt disponible";
  const openDevSession = () => window.location.assign("/auth/dev-login");

  return (
    <div className="space-y-2">
      <a href="/auth/google" onClick={onGoogle} aria-disabled={busy} className={SECONDARY_BUTTON}>
        <GoogleIcon />
        {busy ? "Connexion…" : "Continuer avec Google"}
      </a>
      <button
        type="button"
        disabled={devOnly}
        onClick={openDevSession}
        title={devTitle}
        className={SECONDARY_BUTTON}
      >
        <LinkedInIcon />
        Continuer avec LinkedIn
      </button>
      <button
        type="button"
        disabled={devOnly}
        onClick={openDevSession}
        title={devTitle}
        className={SECONDARY_BUTTON}
      >
        <AppleIcon />
        Continuer avec Apple
      </button>
      {import.meta.env.DEV && (
        <p className="pt-2 text-xs text-muted-foreground">
          Mode développement : ces boutons et le formulaire ouvrent une session de test.
        </p>
      )}
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-4" role="separator">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">ou</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function FieldShell({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthField({
  label,
  type,
  name,
  placeholder,
  autoComplete,
  error,
}: {
  label: string;
  type: string;
  name: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string | null;
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error}>
      <input
        id={id}
        type={type}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(CONTROL, error ? "border-destructive" : "border-input")}
      />
    </FieldShell>
  );
}

export function PasswordField({
  label,
  name,
  placeholder,
  value,
  onChange,
  autoComplete,
  error,
  children,
}: {
  label: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  error?: string | null;
  children?: ReactNode;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <FieldShell id={id} label={label} error={error}>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            CONTROL,
            "pr-11",
            HIDE_NATIVE_PW_UI,
            error ? "border-destructive" : "border-input",
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {children}
    </FieldShell>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg bg-destructive/5 px-3 py-2 text-[13px] text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

export function AuthSubmit({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex h-11 w-full items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-colors duration-150 ease-out hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60 md:h-10"
    >
      {children}
    </button>
  );
}
