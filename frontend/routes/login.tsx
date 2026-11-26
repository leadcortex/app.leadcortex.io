// frontend/routes/login.tsx

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Connexion · LeadCortex" }, { name: "robots", content: "noindex" }],
  }),
  pendingComponent: () => <AuthSkeleton />,
  component: LoginPage,
});

function LoginPage() {
  const [password, setPassword] = useState("");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (error === "account_exists") {
      setGlobalError("Cette adresse a déjà un compte. Connectez-vous avec le même fournisseur.");
    } else if (error === "google_not_configured") {
      setGlobalError("La connexion Google n’est pas encore configurée.");
    } else if (error === "database_unavailable") {
      setGlobalError(
        "Base de données indisponible. Démarrez PostgreSQL et appliquez les migrations, puis réessayez.",
      );
    } else if (error) {
      setGlobalError("Connexion Google annulée ou échouée. Réessayez.");
    }
  }, []);

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

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (betterAuthEnabled) {
      const formData = new FormData(e.currentTarget);
      const email = String(formData.get("email") ?? "").trim();
      const submittedPassword = String(formData.get("password") ?? "");
      setGlobalError(null);
      setIsSubmitting(true);
      try {
        const { error } = await betterAuthClient.signIn.email({
          email,
          password: submittedPassword,
          callbackURL: "/app",
        });
        if (error) setGlobalError(error.message ?? "E-mail ou mot de passe incorrect.");
      } catch {
        setGlobalError("La connexion a échoué. Réessayez.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    if (import.meta.env.DEV) {
      window.location.assign("/auth/dev-login");
      return;
    }
    setGlobalError("La connexion par e-mail arrive bientôt. Utilisez Google.");
  };

  return (
    <AuthShell title="Bon retour.">
      <SocialSignIn onGoogle={handleGoogleSignIn} busy={isSubmitting} />
      <AuthDivider />
      <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
        <AuthField
          label="E-mail"
          type="email"
          name="email"
          placeholder="vous@entreprise.fr"
          autoComplete="email"
        />
        <PasswordField
          label="Mot de passe"
          name="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <AuthError message={globalError} />
        <div className="pt-2">
          <AuthSubmit disabled={isSubmitting}>
            {isSubmitting ? "Connexion…" : "Se connecter"}
          </AuthSubmit>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link
          to="/signup"
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
        >
          Créer un workspace
        </Link>
      </p>
    </AuthShell>
  );
}
