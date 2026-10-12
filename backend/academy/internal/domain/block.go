package domain

// BlockType énumère les types de blocs qui composent une leçon.
type BlockType string

const (
	BlockTypeCover    BlockType = "cover"
	BlockTypeTheory   BlockType = "theory"
	BlockTypePractice BlockType = "practice"
	BlockTypeMission  BlockType = "mission"
	BlockTypeDebrief  BlockType = "debrief"
)

// IsKnownBlockType indique si un BlockType est reconnu.
func IsKnownBlockType(t BlockType) bool {
	switch t {
	case BlockTypeCover, BlockTypeTheory, BlockTypePractice, BlockTypeMission, BlockTypeDebrief:
		return true
	}
	return false
}

// Block est l'interface commune à tous les types de blocs.
// Les implémentations concrètes sont : CoverBlock, TheoryBlock,
// PracticeBlock, MissionBlock, DebriefBlock.
type Block interface {
	// BlockType — discriminant pour le switch.
	BlockType() BlockType
	// Validate — invariants spécifiques au bloc.
	Validate() error
}

// ─── COVER ──────────────────────────────────────────────────────────────

// CoverBlock est le premier bloc d'une leçon : titre, objectifs, mascotte.
type CoverBlock struct {
	Title       string
	Subtitle    string
	MascotPose  string   // "curious", "happy"… résolu côté UI
	MascotLine  string   // phrase affichée dans la bulle
	Objectives  []string // 2-4 objectifs d'apprentissage
}

func (b CoverBlock) BlockType() BlockType { return BlockTypeCover }

func (b CoverBlock) Validate() error {
	if b.Title == "" {
		return NewValidationError("CoverBlock", "title", "obligatoire")
	}
	if len(b.Objectives) == 0 {
		return NewValidationError("CoverBlock", "objectives", "au moins un objectif requis")
	}
	return nil
}

// ─── THEORY ─────────────────────────────────────────────────────────────

// TheoryBlock est une séquence de slides théoriques.
type TheoryBlock struct {
	Slides []TheorySlide
}

func (b TheoryBlock) BlockType() BlockType { return BlockTypeTheory }

func (b TheoryBlock) Validate() error {
	if len(b.Slides) == 0 {
		return NewValidationError("TheoryBlock", "slides", "au moins un slide requis")
	}
	for i, s := range b.Slides {
		if err := s.Validate(); err != nil {
			return &ValidationError{
				Entity: "TheoryBlock",
				Field:  "slides",
				Reason: "slide " + itoa(i) + " : " + err.Error(),
			}
		}
	}
	return nil
}

// TheorySlide est un écran théorique.
type TheorySlide struct {
	// ID — identifiant du slide (unique dans le bloc), ex. "t1".
	ID string

	// Title — titre affiché en haut.
	Title string

	// BodyMD — corps au format Markdown.
	BodyMD string

	// Callout — encart optionnel (info, warning…).
	Callout *Callout

	// Quote — citation optionnelle.
	Quote *Quote

	// Visual — visuel optionnel (diagramme, capture, comparaison).
	Visual *Visual

	// QuizInline — quiz d'ancrage, non noté.
	QuizInline *InlineQuiz
}

func (s TheorySlide) Validate() error {
	if s.ID == "" {
		return NewValidationError("TheorySlide", "id", "obligatoire")
	}
	if s.Title == "" {
		return NewValidationError("TheorySlide", "title", "obligatoire")
	}
	if s.BodyMD == "" && s.Visual == nil && s.Quote == nil {
		return NewValidationError("TheorySlide", "body_md",
			"au moins un contenu (body_md, visual ou quote) est requis")
	}
	if s.Callout != nil {
		if err := s.Callout.Validate(); err != nil {
			return err
		}
	}
	if s.QuizInline != nil {
		if err := s.QuizInline.Validate(); err != nil {
			return err
		}
	}
	return nil
}

// CalloutTone énumère les tons possibles d'un encart.
type CalloutTone string

const (
	CalloutInfo    CalloutTone = "info"
	CalloutWarning CalloutTone = "warning"
	CalloutSuccess CalloutTone = "success"
	CalloutDanger  CalloutTone = "danger"
)

// Callout est un encart visuel avec un ton.
type Callout struct {
	Tone   CalloutTone
	Text   string // Markdown court
	Title  string // optionnel
}

func (c Callout) Validate() error {
	switch c.Tone {
	case CalloutInfo, CalloutWarning, CalloutSuccess, CalloutDanger:
	default:
		return NewValidationError("Callout", "tone",
			"doit être info|warning|success|danger")
	}
	if c.Text == "" {
		return NewValidationError("Callout", "text", "obligatoire")
	}
	return nil
}

// Quote est une citation mise en avant.
type Quote struct {
	Text   string
	Author string
}

// VisualKind énumère les types de visuels supportés.
type VisualKind string

const (
	VisualDiagram    VisualKind = "diagram"
	VisualChart      VisualKind = "chart"
	VisualScreenshot VisualKind = "screenshot"
	VisualComparison VisualKind = "comparison"
	VisualStatCard   VisualKind = "stat_card"
	VisualMiniCase   VisualKind = "mini_case_study"
)

// Visual est un visuel affiché dans un slide.
type Visual struct {
	Kind        VisualKind
	Asset       string // chemin relatif, ex. "/academy/img/icp.svg"
	Alt         string
	Caption     string
	Payload     map[string]any // données spécifiques (chart, comparaison…)
}

func (v Visual) Validate() error {
	switch v.Kind {
	case VisualDiagram, VisualChart, VisualScreenshot, VisualComparison,
		VisualStatCard, VisualMiniCase:
	default:
		return NewValidationError("Visual", "kind", "type de visuel inconnu")
	}
	if v.Asset == "" && len(v.Payload) == 0 {
		return NewValidationError("Visual", "asset",
			"au moins un asset ou un payload est requis")
	}
	return nil
}

// InlineQuiz est un quiz d'ancrage non noté.
type InlineQuiz struct {
	Question string
	Options  []string
	Answer   int // index 0-based
}

func (q InlineQuiz) Validate() error {
	if q.Question == "" {
		return NewValidationError("InlineQuiz", "question", "obligatoire")
	}
	if len(q.Options) < 2 {
		return NewValidationError("InlineQuiz", "options", "au moins 2 options requises")
	}
	if q.Answer < 0 || q.Answer >= len(q.Options) {
		return NewValidationError("InlineQuiz", "answer", "index hors limites")
	}
	return nil
}

// ─── PRACTICE ───────────────────────────────────────────────────────────

// PracticeBlock contient les exercices d'une leçon.
type PracticeBlock struct {
	Exercises []Exercise
}

func (b PracticeBlock) BlockType() BlockType { return BlockTypePractice }

func (b PracticeBlock) Validate() error {
	if len(b.Exercises) == 0 {
		return NewValidationError("PracticeBlock", "exercises", "au moins un exercice requis")
	}
	for i, e := range b.Exercises {
		if err := e.Validate(); err != nil {
			return &ValidationError{
				Entity: "PracticeBlock",
				Field:  "exercises",
				Reason: "exercice " + itoa(i) + " : " + err.Error(),
			}
		}
	}
	return nil
}

// ─── MISSION ────────────────────────────────────────────────────────────

// MissionBlock enveloppe une Mission dans un bloc.
type MissionBlock struct {
	Mission Mission
}

func (b MissionBlock) BlockType() BlockType { return BlockTypeMission }

func (b MissionBlock) Validate() error {
	return b.Mission.Validate()
}

// ─── DEBRIEF ────────────────────────────────────────────────────────────

// DebriefSection énumère les sections possibles du débriefing.
type DebriefSection string

const (
	DebriefScoreBreakdown    DebriefSection = "score_breakdown"
	DebriefConceptsMastered  DebriefSection = "concepts_mastered"
	DebriefConceptsToReview  DebriefSection = "concepts_to_review"
	DebriefNextRecommendation DebriefSection = "next_recommendation"
)

// DebriefBlock est le bloc final de la leçon.
type DebriefBlock struct {
	Sections []DebriefSection
	// CustomMascotLine — phrase personnalisée de la mascotte (optionnel).
	CustomMascotLine string
}

func (b DebriefBlock) BlockType() BlockType { return BlockTypeDebrief }

func (b DebriefBlock) Validate() error {
	if len(b.Sections) == 0 {
		return NewValidationError("DebriefBlock", "sections", "au moins une section requise")
	}
	known := map[DebriefSection]bool{
		DebriefScoreBreakdown:     true,
		DebriefConceptsMastered:   true,
		DebriefConceptsToReview:   true,
		DebriefNextRecommendation: true,
	}
	for _, s := range b.Sections {
		if !known[s] {
			return NewValidationError("DebriefBlock", "sections",
				"section inconnue : "+string(s))
		}
	}
	return nil
}