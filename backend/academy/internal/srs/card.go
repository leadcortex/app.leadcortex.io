// backend/academy/internal/srs/card.go

package srs

import (
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

func ReviewCard(
	card domain.SrsCard,
	grade Grade,
	now time.Time,
) (domain.SrsCard, error) {
	outcome, err := SM2(card, grade, now)
	if err != nil {
		return card, err
	}

	updated := card
	updated.EaseFactor = outcome.EaseFactor
	updated.IntervalDays = outcome.IntervalDays
	updated.Repetitions = outcome.Repetitions
	updated.Lapses = outcome.Lapses
	updated.DueAt = outcome.DueAt
	updated.LastReviewedAt = now

	return updated, nil
}

func IsDue(card domain.SrsCard, now time.Time) bool {
	return !card.DueAt.After(now)
}

func NextDue(card domain.SrsCard) time.Time { return card.DueAt }

func MasteryFromCard(card domain.SrsCard) domain.MasteryLevel {
	base := card.Repetitions * 15
	if base > 100 {
		base = 100
	}

	penalty := card.Lapses * 5
	if penalty > 30 {
		penalty = 30
	}

	bonus := card.IntervalDays / 3
	if bonus > 20 {
		bonus = 20
	}

	level := base - penalty + bonus
	if level < 0 {
		level = 0
	}
	if level > 100 {
		level = 100
	}
	return domain.MasteryLevel(level)
}

func NewCard(
	id string,
	template domain.SrsCardTemplate,
	now time.Time,
) domain.SrsCard {
	return domain.SrsCard{
		ID:             id,
		ConceptID:      template.ConceptID,
		Front:          template.Front,
		Back:           template.Back,
		EaseFactor:     DefaultEaseFactor,
		IntervalDays:   0,
		Repetitions:    0,
		DueAt:          now,
		LastReviewedAt: time.Time{},
		Lapses:         0,
	}
}