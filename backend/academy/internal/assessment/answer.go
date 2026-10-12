package assessment

import "github.com/leadcortex/academy/internal/domain"

// Answer est l'interface commune à toutes les réponses utilisateur.
// Chaque type d'exercice a son propre type concret d'answer.
//
// Le contrat minimal : chaque Answer doit déclarer à quel ExerciseKind
// elle correspond. L'Evaluator vérifie la cohérence.
type Answer interface {
	// Kind — type d'exercice auquel cette réponse s'applique.
	Kind() domain.ExerciseKind
}

/* ─── MCQ ─────────────────────────────────────────────────────────────── */

// MCQAnswer — réponse à un QCM simple.
type MCQAnswer struct {
	// Selected — index de l'option choisie (0-based).
	Selected int
}

func (MCQAnswer) Kind() domain.ExerciseKind { return domain.ExerciseMCQ }

/* ─── MultiSelect ─────────────────────────────────────────────────────── */

// MultiSelectAnswer — réponse à un choix multiple.
type MultiSelectAnswer struct {
	// Selected — indexes des options cochées.
	Selected []int
}

func (MultiSelectAnswer) Kind() domain.ExerciseKind { return domain.ExerciseMultiSelect }

/* ─── FillBlank ───────────────────────────────────────────────────────── */

// FillBlankAnswer — réponse à un texte à trous.
// Blanks[i] correspond au i-ème trou de l'exercice.
type FillBlankAnswer struct {
	Blanks []string
}

func (FillBlankAnswer) Kind() domain.ExerciseKind { return domain.ExerciseFillBlank }

/* ─── OrderSteps ──────────────────────────────────────────────────────── */

// OrderStepsAnswer — réponse à un exercice de remise en ordre.
// Steps contient les étapes dans l'ordre choisi par l'apprenant.
type OrderStepsAnswer struct {
	// Steps — IDs ou libellés des étapes, dans l'ordre choisi.
	Steps []string
}

func (OrderStepsAnswer) Kind() domain.ExerciseKind { return domain.ExerciseOrderSteps }

/* ─── MatchPairs ──────────────────────────────────────────────────────── */

// MatchPairsAnswer — réponse à un exercice d'association.
// Chaque paire associe un élément de gauche à un élément de droite.
type MatchPairsAnswer struct {
	Pairs []domain.MatchPair
}

func (MatchPairsAnswer) Kind() domain.ExerciseKind { return domain.ExerciseMatchPairs }

/* ─── FreeText ────────────────────────────────────────────────────────── */

// FreeTextAnswer — réponse à un exercice de texte libre.
type FreeTextAnswer struct {
	Text string
}

func (FreeTextAnswer) Kind() domain.ExerciseKind { return domain.ExerciseFreeText }

/* ─── Scenario ────────────────────────────────────────────────────────── */

// ScenarioAnswer — réponse à un scénario interactif.
// Choices[i] est l'index du choix sélectionné pour l'étape i.
type ScenarioAnswer struct {
	Choices []int
}

func (ScenarioAnswer) Kind() domain.ExerciseKind { return domain.ExerciseScenario }

/* ─── InAppMission ────────────────────────────────────────────────────── */

// InAppMissionAnswer — placeholder. Une mission in-app n'est jamais
// évaluée par l'Evaluator : elle est validée par un événement métier
// (voir progress.Engine).
type InAppMissionAnswer struct {
	// MissionID — identifiant de la mission concernée.
	MissionID string
}

func (InAppMissionAnswer) Kind() domain.ExerciseKind { return domain.ExerciseInAppMission }