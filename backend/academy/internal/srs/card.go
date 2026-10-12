package srs

import (
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

// ReviewCard applique une révision à une carte et retourne la carte mise à jour.
//
// C'est le point d'entrée principal du package : il combine SM2 (calcul)
// et la mutation de la carte (application du résultat).
//
// La carte d'origine n'est pas mutée : une copie est retournée.
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

// IsDue indique si une carte est due à l'instant `now`.
func IsDue(card domain.SrsCard, now time.Time) bool {
	return !card.DueAt.After(now)
}

// NextDue — accesseur pratique pour la date de prochaine révision.
func NextDue(card domain.SrsCard) time.Time { return card.DueAt }

// MasteryFromCard estime un niveau de maîtrise [0-100] d'un concept à
// partir de l'état de sa carte SRS.
//
// Formule (heuristique) :
//
//	base = min(100, repetitions * 15)          // 0-100 selon les répétitions
//	penalty = min(30, lapses * 5)              // pénalité par échec
//	bonus = min(20, intervalDays / 3)          // bonus pour grand intervalle
//
//	level = clamp(base - penalty + bonus, 0, 100)
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

// NewCard crée une carte SRS initiale à partir d'un template de leçon.
//
// La carte est due immédiatement (DueAt = now), ce qui garantit qu'elle
// apparaîtra dans la file de révision dès la complétion de la leçon.
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