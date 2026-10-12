"use client";

/**
 * Garde-fou d'erreur pour l'assistant.
 *
 * Objectif : si une exception inattendue se produit dans l'arbre de
 * l'assistant (message malformé, listener cassé…), le reste de
 * l'application **doit continuer à fonctionner**. Le panneau se contente
 * d'afficher un état de repli sobre, avec un bouton « Réinitialiser » qui
 * démonte et remonte l'arbre.
 *
 * Aucun log serveur : le message d'erreur est affiché en clair pour le
 * développeur, sans exposer les internes à l'utilisateur final.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

export class AssistantErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("[assistant] crashed", error, info.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-surface px-6 text-center">
        <span className="grid size-10 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-[13px] font-semibold">L'assistant a rencontré un problème</p>
          <p className="mt-1 max-w-[36ch] text-[11.5px] leading-relaxed text-muted-foreground">
            {this.state.message || "Erreur inconnue"}
          </p>
        </div>
        <button
          type="button"
          onClick={this.reset}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <RefreshCw className="size-3.5" strokeWidth={1.8} />
          Réinitialiser l'assistant
        </button>
      </div>
    );
  }
}