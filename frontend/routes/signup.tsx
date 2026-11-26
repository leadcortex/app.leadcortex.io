// frontend/routes/signup.tsx

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthSkeleton } from "@/components/skeletons";
import {
  AuthDivider,
  AuthError,
  AuthField,
  AuthShell,
  AuthSubmit,
  PasswordField,
  SocialSignIn,
} from "@/components/auth/auth-form";
import { betterAuthClient, betterAuthEnabled } from "@/lib/auth/better-auth-client";

type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "8 caractères", test: (v) => v.length >= 8 },
  { id: "upper", label: "une majuscule", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "une minuscule", test: (v) => /[a-z]/.test(v) },
  { id: "digit", label: "un chiffre", test: (v) => /\d/.test(v) },
  { id: "special", label: "un caractère spécial", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

function passwordScore(value: string) {
  return PASSWORD_RULES.reduce((acc, rule) => acc + (rule.test(value) ? 1 : 0), 0);
}

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [{ title: "Créer un workspace · LeadCortex" }, { name: "robots", content: "noindex" }],
  }),
  pendingComponent: () => <AuthSkeleton />,
  component: SignupPage,
});

function SignupPage() {
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const showMismatch =
    !confirmError && confirmPassword.length >= password.length && confirmPassword.length > 0;

  const handleGoogleSignIn = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!betterAuthEnabled) return;
    e.preventDefault();
    setGlobalError(null);
    setIsSubmitting(true);
    try {
      const { error } = await betterAuthClient.signIn.social({
        provider: "google",
        callbackURL: "/app",
        newUserCallbackURL: "/onboarding",
      });
      if (error) setGlobalError(error.message ?? "La connexion Google a échoué.");
    } catch {
      setGlobalError("La connexion Google a échoué. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (betterAuthEnabled) {
      const formData = new FormData(e.currentTarget);
      const name = String(formData.get("fullName") ?? "").trim();
      const email = String(formData.get("email") ?? "").trim();
      if (!name || !email) {
        setGlobalError("Indiquez votre nom et votre e-mail.");
        return;
      }
      if (!passwordsMatch) {
        setConfirmError("Les mots de passe sont différents.");
        return;
      }
      if (passwordScore(password) !== PASSWORD_RULES.length) {
        setPasswordError("Le mot de passe ne respecte pas toutes les règles.");
        return;
      }

      setGlobalError(null);
      setIsSubmitting(true);
      try {
        const { error } = await betterAuthClient.signUp.email({
          name,
          email,
          password,
          callbackURL: "/onboarding",
        });
        if (error) setGlobalError(error.message ?? "Impossible de créer le compte.");
      } catch {
        setGlobalError("La création du compte a échoué. Réessayez.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    if (import.meta.env.DEV) {
      window.location.assign("/auth/dev-login");
      return;
    }
    setGlobalError("L’inscription par e-mail arrive bientôt. Utilisez Google.");
  };

  return (
    <AuthShell title="Créez votre workspace." subtitle="50 crédits offerts, sans carte bancaire.">
      <SocialSignIn onGoogle={handleGoogleSignIn} busy={isSubmitting} />
      <AuthDivider />
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthField label="Nom complet" type="text" name="fullName" autoComplete="name" />
        <AuthField
          label="E-mail professionnel"
          type="email"
          name="email"
          placeholder="vous@entreprise.fr"
          autoComplete="email"
        />
        <PasswordField
          label="Mot de passe"
          name="password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            if (passwordError) setPasswordError(null);
            if (confirmError && v === confirmPassword) setConfirmError(null);
          }}
          autoComplete="new-password"
          error={passwordError}
        >
          <PasswordStrength password={password} />
        </PasswordField>
        <PasswordField
          label="Confirmer le mot de passe"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(v) => {
            setConfirmPassword(v);
            if (confirmError) setConfirmError(null);
          }}
          autoComplete="new-password"
          error={confirmError}
        >
          {showMismatch && !passwordsMatch && (
            <p className="mt-1 text-xs text-destructive">Les mots de passe sont différents.</p>
          )}
        </PasswordField>

        <AuthError message={globalError} />
        <div className="pt-2">
          <AuthSubmit disabled={isSubmitting}>
            {isSubmitting ? "Création…" : "Créer mon workspace"}
          </AuthSubmit>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          En continuant, vous acceptez les{" "}
          <Link to="/legal/cgu" className="underline underline-offset-4 hover:text-foreground">
            CGU
          </Link>{" "}
          et la{" "}
          <Link
            to="/legal/confidentialite"
            className="underline underline-offset-4 hover:text-foreground"
          >
            politique de confidentialité
          </Link>
          .
        </p>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link
          to="/login"
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
        >
          Se connecter
        </Link>
      </p>
    </AuthShell>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = passwordScore(password);
  const total = PASSWORD_RULES.length;
  const missing = PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) => rule.label);

  const tone =
    score <= 2
      ? { label: "Faible", bar: "bg-destructive", text: "text-destructive" }
      : score < total
        ? { label: "Moyen", bar: "bg-amber-500", text: "text-amber-500" }
        : { label: "Fort", bar: "bg-emerald-500", text: "text-emerald-500" };

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full transition-[width] duration-200 ease-out ${tone.bar}`}
            style={{ width: `${(score / total) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${tone.text}`}>{tone.label}</span>
      </div>
      {missing.length > 0 && (
        <p className="text-xs text-muted-foreground">Il manque : {missing.join(", ")}.</p>
      )}
    </div>
  );
}
