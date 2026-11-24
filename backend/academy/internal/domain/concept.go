// backend/academy/internal/domain/concept.go

package domain

import "time"

type Concept struct {
	ID string

	Label string

	Description string
}

func (c Concept) Validate() error {
	if c.ID == "" {
		return NewValidationError("Concept", "id", "obligatoire")
	}
	if c.Label == "" {
		return NewValidationError("Concept", "label", "obligatoire")
	}
	return nil
}

type MasteryLevel int

const (
	MasteryUnseen MasteryLevel = 0
	MasteryFragile MasteryLevel = 30
	MasteryOK MasteryLevel = 60
	MasteryMastered MasteryLevel = 80
)

type Mastery struct {
	ConceptID string
	Level     MasteryLevel

	Attempts int
	Correct int

	LastReviewed time.Time
	NextReviewAt time.Time
}

func (m Mastery) Accuracy() float64 {
	if m.Attempts == 0 {
		return 0
	}
	return float64(m.Correct) / float64(m.Attempts)
}

func (m Mastery) IsMastered() bool {
	return m.Level >= MasteryMastered
}