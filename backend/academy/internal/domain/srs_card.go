// backend/academy/internal/domain/srs_card.go

package domain

import "time"

type SrsCard struct {
	ID string

	ConceptID string

	Front string

	Back string


	EaseFactor float64

	IntervalDays int

	Repetitions int

	DueAt time.Time

	LastReviewedAt time.Time

	Lapses int
}

const (
	EaseFactorMin = 1.3
	EaseFactorMax = 2.8
)

func NewSrsCard(id, conceptID, front, back string) *SrsCard {
	return &SrsCard{
		ID:             id,
		ConceptID:      conceptID,
		Front:          front,
		Back:           back,
		EaseFactor:     2.5,
		IntervalDays:   0,
		Repetitions:    0,
		DueAt:          time.Now().UTC(),
		LastReviewedAt: time.Time{},
		Lapses:         0,
	}
}

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

func (c SrsCard) IsDue(now time.Time) bool {
	return !c.DueAt.After(now)
}

type SrsReviewQuality int

const (
	SrsQualityBlackout   SrsReviewQuality = 0
	SrsQualityIncorrect  SrsReviewQuality = 1
	SrsQualityHardFail   SrsReviewQuality = 2
	SrsQualityHard       SrsReviewQuality = 3
	SrsQualityGood       SrsReviewQuality = 4
	SrsQualityEasy       SrsReviewQuality = 5
)