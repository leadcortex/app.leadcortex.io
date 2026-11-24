// backend/academy/internal/domain/exercise.go

package domain

type ExerciseKind string

const (
	ExerciseMCQ ExerciseKind = "mcq"
	ExerciseMultiSelect ExerciseKind = "multi_select"
	ExerciseFillBlank ExerciseKind = "fill_blank"
	ExerciseOrderSteps ExerciseKind = "order_steps"
	ExerciseMatchPairs ExerciseKind = "match_pairs"
	ExerciseFreeText ExerciseKind = "free_text"
	ExerciseScenario ExerciseKind = "scenario"
	ExerciseInAppMission ExerciseKind = "in_app_mission"
)

func IsKnownExerciseKind(k ExerciseKind) bool {
	switch k {
	case ExerciseMCQ, ExerciseMultiSelect, ExerciseFillBlank, ExerciseOrderSteps,
		ExerciseMatchPairs, ExerciseFreeText, ExerciseScenario, ExerciseInAppMission:
		return true
	}
	return false
}

type Exercise struct {
	ID string

	Kind ExerciseKind

	Prompt string

	ExplanationMD string

	XP int

	Difficulty int

	Concepts []string

	Payload ExercisePayload
}

type ExercisePayload interface {
	PayloadKind() ExerciseKind
	Validate() error
}

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


type MCqPayload struct {
	Options []string
	Correct int
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


type MultiSelectPayload struct {
	Options []string
	Correct []int
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


type Blank struct {
	Correct []string
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


type OrderStepsPayload struct {
	Steps []string
}

func (p OrderStepsPayload) PayloadKind() ExerciseKind { return ExerciseOrderSteps }

func (p OrderStepsPayload) Validate() error {
	if len(p.Steps) < 2 {
		return NewValidationError("OrderStepsPayload", "steps", "au moins 2 étapes requises")
	}
	return nil
}


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


type FreeTextPayload struct {
	MinWords int
	MaxWords int
	RubricMD string
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


type ScenarioStep struct {
	ID string
	Situation string
	Question string
	Choices []ScenarioChoice
}

type ScenarioChoice struct {
	Label string
	Correct bool
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