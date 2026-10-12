package assessment

import "github.com/leadcortex/academy/internal/domain"

// Result est le résultat d'une évaluation d'exercice.
//
// Le champ Score est normalisé sur 0-100. Le champ Correct est calculé
// selon le seuil de l'Evaluator (par défaut 70).
type Result struct {
	// Score — score final, 0-100.
	Score int

	// Correct — vrai si Score >= seuil de réussite.
	Correct bool

	// FeedbackMD — message de feedback en Markdown, prêt à afficher.
	// Contient typiquement l'explication de l'exercice si réussi, ou un
	// indice si raté.
	FeedbackMD string

	// ConceptsTouched — concepts évalués par cet exercice, à mettre à jour
	// dans le Learner (délégué à progress.Engine).
	ConceptsTouched []string

	// Details — détail par sous-question (trous, paires, étapes…).
	// Optionnel ; sert à l'UI pour afficher un feedback précis.
	Details *ResultDetails
}

// ResultDetails contient le détail d'une évaluation multi-éléments.
// Un exercice simple (MCQ) laisse ce champ nil.
type ResultDetails struct {
	// BlankResults — résultat par trou (FillBlank uniquement).
	BlankResults []SubResult

	// PairResults — résultat par paire (MatchPairs uniquement).
	PairResults []SubResult

	// StepResults — résultat par étape (OrderSteps uniquement).
	StepResults []SubResult

	// ScenarioResults — résultat par étape (Scenario uniquement).
	ScenarioResults []SubResult

	// MatchedKeywords — mots-clés trouvés (FreeText uniquement).
	MatchedKeywords []string

	// MissingKeywords — mots-clés manquants (FreeText uniquement).
	MissingKeywords []string

	// WordCount — nombre de mots de la réponse (FreeText uniquement).
	WordCount int
}

// SubResult décrit le résultat d'une sous-question.
type SubResult struct {
	// Index — position dans la sous-collection.
	Index int

	// Expected — réponse attendue (affichée en feedback).
	Expected string

	// Got — réponse fournie par l'apprenant.
	Got string

	// Correct — vrai si la sous-question est correcte.
	Correct bool
}

// HasDetails indique si le résultat comporte un détail.
func (r Result) HasDetails() bool { return r.Details != nil }

/* ─── Helpers internes ────────────────────────────────────────────────── */

// conceptsOf retourne la liste des concepts d'un exercice.
func conceptsOf(ex domain.Exercise) []string {
	if len(ex.Concepts) == 0 {
		return nil
	}
	out := make([]string, len(ex.Concepts))
	copy(out, ex.Concepts)
	return out
}