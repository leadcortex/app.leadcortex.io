//frontend\routes\signup.tsx
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, AlertCircle, X, Eye, EyeOff } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useState } from "react";
import { AuthSkeleton } from "@/components/skeletons";
import { useFormGuard, Honeypot } from "@/lib/security/client-guard";
import { verifyWithServer } from "@/lib/security/client-api";
import { WavyImageFrame } from "@/components/wavy-image-frame";
import { OtpModal } from "@/components/auth/otp-modal";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="size-4 shrink-0">
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

type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "8 caractères minimum", test: (v) => v.length >= 8 },
  { id: "upper", label: "Une lettre majuscule", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "Une lettre minuscule", test: (v) => /[a-z]/.test(v) },
  { id: "digit", label: "Un chiffre", test: (v) => /\d/.test(v) },
  { id: "special", label: "Un caractère spécial (!@#$…)", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

function isPasswordStrong(value: string) {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}

function passwordScore(value: string) {
  return PASSWORD_RULES.reduce((acc, rule) => acc + (rule.test(value) ? 1 : 0), 0);
}

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [{ title: "Créer un workspace — LeadCortex" }, { name: "robots", content: "noindex" }],
  }),
  pendingComponent: () => <AuthSkeleton />,
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const guard = useFormGuard();

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (submitting) return;

    setGlobalError(null);

    const formData = new FormData(e.currentTarget);
    const emailValue = (formData.get("email") as string) || "";

    let hasError = false;

    if (!emailValue || !validateEmail(emailValue)) {
      setEmailError("Veuillez entrer un email valide.");
      hasError = true;
    } else {
      setEmailError(null);
    }

    if (!isPasswordStrong(password)) {
      setPasswordError(
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
      );
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (confirmPassword !== password) {
      setConfirmError("Les mots de passe ne correspondent pas.");
      hasError = true;
    } else {
      setConfirmError(null);
    }

    if (hasError) return;

    setSubmitting(true);

    const verdict = await verifyWithServer("signup", guard.buildPayload(), emailValue);

    if (!verdict.ok) {
      setSubmitting(false);
      setGlobalError(verdict.message);
      return;
    }

    setEmail(emailValue);
    setSubmitting(false);
    setShowOtpModal(true);
  };

  const handleSocialLogin = () => {
    navigate({ to: "/onboarding" });
  };

  const handleOtpVerify = () => {
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="min-h-[calc(100dvh-2rem)] grid lg:grid-cols-2 auth-grid md:min-h-[calc(100dvh-3rem)]">
      <div className="flex flex-col p-4 md:p-12">
        <BrandLogo />
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto space-y-6 md:space-y-8">
            <div>
              <h1 className="font-display text-3xl md:text-5xl italic tracking-tight">
                Créez votre workspace.
              </h1>
              <p className="mt-2 md:mt-3 text-xs md:text-sm text-muted-foreground">
                50 crédits offerts. Sans carte bancaire.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSocialLogin}
                className="w-full flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5 text-xs md:text-sm font-medium text-foreground transition-all duration-150 hover:bg-surface active:scale-[0.97] active:bg-surface/80"
              >
                <GoogleIcon />
                <span>Continuer avec Google</span>
              </button>
              <button
                onClick={handleSocialLogin}
                className="w-full flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5 text-xs md:text-sm font-medium text-foreground transition-all duration-150 hover:bg-surface active:scale-[0.97] active:bg-surface/80"
              >
                <LinkedInIcon />
                <span>Continuer avec LinkedIn</span>
              </button>
              <button
                onClick={handleSocialLogin}
                className="w-full flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5 text-xs md:text-sm font-medium text-foreground transition-all duration-150 hover:bg-surface active:scale-[0.97] active:bg-surface/80"
              >
                <AppleIcon />
                <span>Continuer avec Apple</span>
              </button>
            </div>

            <div className="relative flex items-center">
              <div className="flex-1 border-t border-border"></div>
              <span className="mx-4 text-[9px] md:text-xs text-muted-foreground uppercase tracking-wider">
                Ou continuer avec email
              </span>
              <div className="flex-1 border-t border-border"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8" noValidate>
              <Honeypot value={guard.honeypot} onChange={guard.setHoneypot} />

              <div className="space-y-3 md:space-y-4">
                <Field label="Nom complet" type="text" name="fullName" placeholder="Utilisateur" />
                <Field
                  label="Email pro"
                  type="email"
                  name="email"
                  placeholder="Utilisateur@company.co"
                  error={emailError}
                />

                <div className="space-y-2">
                  <PasswordField
                    label="Mot de passe"
                    name="password"
                    placeholder="Min. 8 caractères"
                    value={password}
                    onChange={(v) => {
                      setPassword(v);
                      if (passwordError) setPasswordError(null);
                      if (confirmError && v === confirmPassword) setConfirmError(null);
                    }}
                    autoComplete="new-password"
                    error={passwordError}
                  />
                  <PasswordStrength password={password} />
                </div>

                <div className="space-y-2">
                  <PasswordField
                    label="Confirmer le mot de passe"
                    name="confirmPassword"
                    placeholder="Retapez votre mot de passe"
                    value={confirmPassword}
                    onChange={(v) => {
                      setConfirmPassword(v);
                      if (confirmError) setConfirmError(null);
                    }}
                    autoComplete="new-password"
                    error={confirmError}
                  />
                  {confirmPassword.length > 0 && (
                    <p
                      className={`flex items-center gap-1.5 text-[10px] md:text-xs ${
                        passwordsMatch ? "text-emerald-500" : "text-destructive"
                      }`}
                    >
                      {passwordsMatch ? (
                        <>
                          <Check className="size-3.5 shrink-0" />
                          Les mots de passe correspondent.
                        </>
                      ) : (
                        <>
                          <X className="size-3.5 shrink-0" />
                          Les mots de passe ne correspondent pas encore.
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {globalError && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{globalError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-1.5 md:gap-2 rounded-xl bg-foreground text-background px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all group"
              >
                {submitting ? "Vérification…" : "Créer mon workspace"}
                <ArrowRight className="size-3.5 md:size-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <p className="text-center text-[9px] md:text-xs text-muted-foreground">
                En créant un compte, vous acceptez nos CGU et notre politique de confidentialité.
              </p>
              <div className="text-center text-xs md:text-sm text-muted-foreground">
                Déjà un compte ?{" "}
                <Link
                  to="/login"
                  className="text-foreground underline underline-offset-4 hover:text-primary"
                >
                  Se connecter
                </Link>
              </div>
            </form>
          </div>
        </div>
        <p className="text-[10px] md:text-xs text-muted-foreground">© 2026 LeadCortex</p>
      </div>

      <div className="hidden lg:block relative bg-background auth-side">
        <WavyImageFrame src="/images/login-signup.webp" alt="Vagues sur une plage de sable" />
      </div>

      <OtpModal
        open={showOtpModal}
        email={email}
        onVerify={handleOtpVerify}
        onClose={() => setShowOtpModal(false)}
        redirectTo="/onboarding"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field                                                                     */
/* -------------------------------------------------------------------------- */

function Field({
  label,
  type,
  name,
  placeholder,
  error,
}: {
  label: string;
  type: string;
  name?: string;
  placeholder: string;
  error?: string | null;
}) {
  return (
    <label className="block">
      <span className="text-[9px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-xl border ${error ? "border-destructive" : "border-border"} bg-background px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all`}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*  PasswordField                                                             */
/* -------------------------------------------------------------------------- */

function PasswordField({
  label,
  name,
  placeholder,
  value,
  onChange,
  autoComplete,
  error,
}: {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  error?: string | null;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="text-[9px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="relative mt-1">
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full rounded-xl border ${
            error ? "border-destructive" : "border-border"
          } bg-background px-3 md:px-4 py-2 md:py-2.5 pr-10 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all ${HIDE_NATIVE_PW_UI}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*  Barre de progression + checklist de robustesse                            */
/* -------------------------------------------------------------------------- */

function PasswordStrength({ password }: { password: string }) {
  const score = passwordScore(password);
  const total = PASSWORD_RULES.length;
  const percent = (score / total) * 100;

  const tone = (() => {
    if (score === 0) return { label: "", bar: "", text: "text-muted-foreground" };
    if (score <= 2) return { label: "Faible", bar: "bg-destructive", text: "text-destructive" };
    if (score < total) return { label: "Moyen", bar: "bg-amber-500", text: "text-amber-500" };
    return { label: "Fort", bar: "bg-emerald-500", text: "text-emerald-500" };
  })();

  const showPanel = password.length > 0;

  return (
    <div
      className={`overflow-hidden transition-all duration-200 ${
        showPanel ? "max-h-60 opacity-100 mt-2" : "max-h-0 opacity-0"
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${tone.bar}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          {tone.label && (
            <span className={`text-[10px] md:text-xs font-medium ${tone.text}`}>{tone.label}</span>
          )}
        </div>

        <ul className="grid grid-cols-1 gap-1">
          {PASSWORD_RULES.map((rule) => {
            const passed = rule.test(password);
            return (
              <li
                key={rule.id}
                className={`flex items-center gap-1.5 text-[10px] md:text-xs ${
                  passed ? "text-emerald-500" : "text-muted-foreground"
                }`}
              >
                {passed ? (
                  <Check className="size-3.5 shrink-0" />
                ) : (
                  <X className="size-3.5 shrink-0 opacity-60" />
                )}
                <span>{rule.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
