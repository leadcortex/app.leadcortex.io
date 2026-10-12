package domain

// ExerciseKind énumère les 8 types d'exercices supportés.
type ExerciseKind string

const (
	// ExerciseMCQ — QCM simple, une seule bonne réponse.
	ExerciseMCQ ExerciseKind = "mcq"
	// ExerciseMultiSelect — choix multiples.
	ExerciseMultiSelect ExerciseKind = "multi_select"
	// ExerciseFillBlank — texte à trous.
	ExerciseFillBlank ExerciseKind = "fill_blank"
	// ExerciseOrderSteps — remettre des étapes dans le bon ordre.
	ExerciseOrderSteps ExerciseKind = "order_steps"
	// ExerciseMatchPairs — associer deux colonnes.
	ExerciseMatchPairs ExerciseKind = "match_pairs"
	// ExerciseFreeText — texte libre (évaluation LLM en prod).
	ExerciseFreeText ExerciseKind = "free_text"
	// ExerciseScenario — cas pratique multi-étapes.
	ExerciseScenario ExerciseKind = "scenario"
	// ExerciseInAppMission — action dans l'app (sous-type de mission).
	ExerciseInAppMission ExerciseKind = "in_app_mission"
)

// IsKnownExerciseKind indique si un type est reconnu.
func IsKnownExerciseKind(k ExerciseKind) bool {
	switch k {
	case ExerciseMCQ, ExerciseMultiSelect, ExerciseFillBlank, ExerciseOrderSteps,
		ExerciseMatchPairs, ExerciseFreeText, ExerciseScenario, ExerciseInAppMission:
		return true
	}
	return false
}

// Exercise est un exercice d'entraînement. Le champ Payload contient les
// données spécifiques au type (voir les structs ci-dessous).
type Exercise struct {
	// ID — identifiant unique dans la leçon.
	ID string

	// Kind — type d'exercice.
	Kind ExerciseKind

	// Prompt — énoncé affiché à l'apprenant.
	Prompt string

	// ExplanationMD — explication affichée après réponse.
	ExplanationMD string

	// XP — XP gagnée si réussi.
	XP int

	// Difficulty — 1-5, utilisé par l'adaptatif (Partie 10).
	Difficulty int

	// Concepts — notions évaluées (référence vers Concept.ID).
	Concepts []string

	// Payload — données spécifiques au type.
	Payload ExercisePayload
}

// ExercisePayload est l'interface des payloads d'exercice.
type ExercisePayload interface {
	PayloadKind() ExerciseKind
	Validate() error
}

// Validate vérifie les invariants généraux puis délègue au payload.
func (e Exercise) Validate() error {
	if e.ID == "" {
		return NewValidationError("Exercise", "id", "obligatoire")
	}
	if !IsKnownExerciseKind(e.Kind) {
		return NewValidationError("Exercise", "kind",
			"type d'exercice inconnu : "+string(e.Kind))
	}
	if e.Prompt == "" {
		return NewValidationError("Exercise", "prompt", "obligatoire")
	}
	if e.XP < 0 {
		return NewValidationError("Exercise", "xp", "ne peut pas être négatif")
	}
	if e.Difficulty < 1 || e.Difficulty > 5 {
		return NewValidationError("Exercise", "difficulty", "doit être entre 1 et 5")
	}
	if e.Payload == nil {
		return NewValidationError("Exercise", "payload", "obligatoire")
	}
	if e.Payload.PayloadKind() != e.Kind {
		return NewValidationError("Exercise", "payload",
			"le type du payload ne correspond pas au type d'exercice")
	}
	return e.Payload.Validate()
}

// ─── Payload : MCQ ──────────────────────────────────────────────────────

type MCqPayload struct {
	Options []string
	Correct int // index 0-based
}

func (p MCqPayload) PayloadKind() ExerciseKind { return ExerciseMCQ }

func (p MCqPayload) Validate() error {
	if len(p.Options) < 2 {
		return NewValidationError("MCqPayload", "options", "au moins 2 options requises")
	}
	if p.Correct < 0 || p.Correct >= len(p.Options) {
		return NewValidationError("MCqPayload", "correct", "index hors limites")
	}
	return nil
}

// ─── Payload : MultiSelect ──────────────────────────────────────────────

type MultiSelectPayload struct {
	Options []string
	Correct []int // indices des bonnes réponses
}

func (p MultiSelectPayload) PayloadKind() ExerciseKind { return ExerciseMultiSelect }

func (p MultiSelectPayload) Validate() error {
	if len(p.Options) < 2 {
		return NewValidationError("MultiSelectPayload", "options", "au moins 2 options requises")
	}
	if len(p.Correct) == 0 {
		return NewValidationError("MultiSelectPayload", "correct", "au moins une bonne réponse")
	}
	for _, c := range p.Correct {
		if c < 0 || c >= len(p.Options) {
			return NewValidationError("MultiSelectPayload", "correct", "index hors limites")
		}
	}
	return nil
}

// ─── Payload : FillBlank ────────────────────────────────────────────────

// Blank est un trou d'un exercice fill_blank.
// Plusieurs réponses acceptées (toutes équivalentes).
type Blank struct {
	Correct []string // au moins une réponse acceptée
}

func (b Blank) Validate() error {
	if len(b.Correct) == 0 {
		return NewValidationError("Blank", "correct", "au moins une réponse acceptée")
	}
	return nil
}

type FillBlankPayload struct {
	Blanks []Blank
}

func (p FillBlankPayload) PayloadKind() ExerciseKind { return ExerciseFillBlank }

func (p FillBlankPayload) Validate() error {
	if len(p.Blanks) == 0 {
		return NewValidationError("FillBlankPayload", "blanks", "au moins un trou requis")
	}
	for i, b := range p.Blanks {
		if err := b.Validate(); err != nil {
			return &ValidationError{
				Entity: "FillBlankPayload",
				Field:  "blanks",
				Reason: "trou " + itoa(i) + " : " + err.Error(),
			}
		}
	}
	return nil
}

// ─── Payload : OrderSteps ───────────────────────────────────────────────

type OrderStepsPayload struct {
	Steps []string // ordre correct (les indices seront mélangés côté UI)
}

func (p OrderStepsPayload) PayloadKind() ExerciseKind { return ExerciseOrderSteps }

func (p OrderStepsPayload) Validate() error {
	if len(p.Steps) < 2 {
		return NewValidationError("OrderStepsPayload", "steps", "au moins 2 étapes requises")
	}
	return nil
}

// ─── Payload : MatchPairs ───────────────────────────────────────────────

type MatchPair struct {
	Left  string
	Right string
}

type MatchPairsPayload struct {
	Pairs []MatchPair
}

func (p MatchPairsPayload) PayloadKind() ExerciseKind { return ExerciseMatchPairs }

func (p MatchPairsPayload) Validate() error {
	if len(p.Pairs) < 2 {
		return NewValidationError("MatchPairsPayload", "pairs", "au moins 2 paires requises")
	}
	for i, pair := range p.Pairs {
		if pair.Left == "" || pair.Right == "" {
			return &ValidationError{
				Entity: "MatchPairsPayload",
				Field:  "pairs",
				Reason: "paire " + itoa(i) + " incomplète",
			}
		}
	}
	return nil
}

// ─── Payload : FreeText ─────────────────────────────────────────────────

// FreeTextPayload est évalué par un LLM en production.
// En dev, on peut se contenter d'une évaluation par mots-clés.
type FreeTextPayload struct {
	// MinWords — nombre minimum de mots attendus.
	MinWords int
	// MaxWords — nombre maximum de mots (0 = pas de limite).
	MaxWords int
	// RubricMD — grille d'évaluation fournie au LLM.
	RubricMD string
	// ExpectedKeywords — mots-clés facultatifs pour évaluer en dev.
	ExpectedKeywords []string
}

func (p FreeTextPayload) PayloadKind() ExerciseKind { return ExerciseFreeText }

func (p FreeTextPayload) Validate() error {
	if p.MinWords <= 0 {
		return NewValidationError("FreeTextPayload", "min_words", "doit être > 0")
	}
	if p.MaxWords > 0 && p.MaxWords < p.MinWords {
		return NewValidationError("FreeTextPayload", "max_words",
			"doit être >= min_words")
	}
	return nil
}

// ─── Payload : Scenario ─────────────────────────────────────────────────

// ScenarioStep est une étape d'un scénario interactif.
type ScenarioStep struct {
	// ID — identifiant unique du step.
	ID string
	// Situation — description contextuelle affichée.
	Situation string
	// Question — question posée à l'apprenant.
	Question string
	// Choices — choix possibles (au moins 2).
	Choices []ScenarioChoice
}

type ScenarioChoice struct {
	// Label — texte du choix.
	Label string
	// Correct — est-ce la bonne réponse ?
	Correct bool
	// ExplanationMD — explication affichée après ce choix.
	ExplanationMD string
}

func (s ScenarioStep) Validate() error {
	if s.ID == "" {
		return NewValidationError("ScenarioStep", "id", "obligatoire")
	}
	if s.Situation == "" {
		return NewValidationError("ScenarioStep", "situation", "obligatoire")
	}
	if s.Question == "" {
		return NewValidationError("ScenarioStep", "question", "obligatoire")
	}
	if len(s.Choices) < 2 {
		return NewValidationError("ScenarioStep", "choices", "au moins 2 choix requis")
	}
	return nil
}

type ScenarioPayload struct {
	Steps []ScenarioStep
}

func (p ScenarioPayload) PayloadKind() ExerciseKind { return ExerciseScenario }

func (p ScenarioPayload) Validate() error {
	if len(p.Steps) == 0 {
		return NewValidationError("ScenarioPayload", "steps", "au moins une étape requise")
	}
	for i, s := range p.Steps {
		if err := s.Validate(); err != nil {
			return &ValidationError{
				Entity: "ScenarioPayload",
				Field:  "steps",
				Reason: "étape " + itoa(i) + " : " + err.Error(),
			}
		}
	}
	return nil
}

// ─── Payload : InAppMission ─────────────────────────────────────────────

// InAppMissionPayload est un exercice qui délègue à une mission in-app.
// Voir Mission pour le détail de la mécanique.
type InAppMissionPayload struct {
	MissionID string
}

func (p InAppMissionPayload) PayloadKind() ExerciseKind { return ExerciseInAppMission }

func (p InAppMissionPayload) Validate() error {
	if p.MissionID == "" {
		return NewValidationError("InAppMissionPayload", "mission_id", "obligatoire")
	}
	return nil
}