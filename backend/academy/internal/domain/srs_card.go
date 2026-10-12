package domain

import "time"

// SrsCard est une carte de spaced repetition (algorithme SM-2 adapté).
// Chaque concept maîtrisé génère une ou plusieurs cartes de révision.
type SrsCard struct {
	// ID — identifiant unique de la carte.
	ID string

	// ConceptID — concept évalué par cette carte.
	ConceptID string

	// Front — face avant de la carte (question).
	Front string

	// Back — face arrière de la carte (réponse).
	Back string

	// ─── État SM-2 ────────────────────────────────────────────────────

	// EaseFactor — facteur de facilité (SM-2). Valeur initiale : 2.5.
	EaseFactor float64

	// IntervalDays — intervalle actuel en jours.
	IntervalDays int

	// Repetitions — nombre de révisions réussies consécutives.
	Repetitions int

	// DueAt — date de la prochaine révision.
	DueAt time.Time

	// LastReviewedAt — date de la dernière révision.
	LastReviewedAt time.Time

	// Lapses — nombre total d'échecs.
	Lapses int
}

// EaseFactorMin et EaseFactorMax bornes du facteur SM-2.
const (
	EaseFactorMin = 1.3
	EaseFactorMax = 2.8
)

// NewSrsCard crée une carte non encore planifiée.
func NewSrsCard(id, conceptID, front, back string) *SrsCard {
	return &SrsCard{
		ID:             id,
		ConceptID:      conceptID,
		Front:          front,
		Back:           back,
		EaseFactor:     2.5,
		IntervalDays:   0,
		Repetitions:    0,
		DueAt:          time.Now().UTC(), // à réviser dès que possible
		LastReviewedAt: time.Time{},
		Lapses:         0,
	}
}

// Validate vérifie les invariants.
func (c SrsCard) Validate() error {
	if c.ID == "" {
		return NewValidationError("SrsCard", "id", "obligatoire")
	}
	if c.ConceptID == "" {
		return NewValidationError("SrsCard", "concept_id", "obligatoire")
	}
	if c.Front == "" {
		return NewValidationError("SrsCard", "front", "obligatoire")
	}
	if c.Back == "" {
		return NewValidationError("SrsCard", "back", "obligatoire")
	}
	if c.EaseFactor < EaseFactorMin || c.EaseFactor > EaseFactorMax {
		return NewValidationError("SrsCard", "ease_factor",
			"doit être entre EaseFactorMin et EaseFactorMax")
	}
	return nil
}

// IsDue indique si la carte est prête à être révisée.
func (c SrsCard) IsDue(now time.Time) bool {
	return !c.DueAt.After(now)
}

// SrsReviewQuality est la qualité d'une réponse à une carte (SM-2).
//
// Mapping SM-2 standard :
//
//	0 = échec total (blackout)
//	1 = réponse incorrecte, mais le souvenir revient
//	2 = réponse incorrecte, mais facile à retrouver
//	3 = correcte avec difficulté
//	4 = correcte après hésitation
//	5 = correcte, parfaite
type SrsReviewQuality int

const (
	SrsQualityBlackout   SrsReviewQuality = 0
	SrsQualityIncorrect  SrsReviewQuality = 1
	SrsQualityHardFail   SrsReviewQuality = 2
	SrsQualityHard       SrsReviewQuality = 3
	SrsQualityGood       SrsReviewQuality = 4
	SrsQualityEasy       SrsReviewQuality = 5
)