package srs

import (
	"math"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

// Constantes SM-2.
const (
	// DefaultEaseFactor — facteur de facilité initial (SM-2 standard).
	DefaultEaseFactor = 2.5

	// MinEaseFactor — plancher du facteur de facilité.
	MinEaseFactor = domain.EaseFactorMin // 1.3

	// MaxEaseFactor — plafond du facteur de facilité (adaptation LeadCortex).
	MaxEaseFactor = domain.EaseFactorMax // 2.8

	// InitialIntervalDays — premier intervalle après une réussite.
	InitialIntervalDays = 1

	// SecondIntervalDays — deuxième intervalle après deux réussites consécutives.
	SecondIntervalDays = 6

	// MaxIntervalDays — plafond de l'intervalle (10 ans).
	MaxIntervalDays = 3650
)

// Grade est la qualité d'une réponse à une carte SRS (échelle SM-2, 0-5).
type Grade int

const (
	// GradeBlackout — impossible de se rappeler.
	GradeBlackout Grade = 0
	// GradeIncorrect — incorrect, mais le souvenir revient.
	GradeIncorrect Grade = 1
	// GradeHardFail — incorrect, mais facile à retrouver.
	GradeHardFail Grade = 2
	// GradeHard — correct avec difficulté.
	GradeHard Grade = 3
	// GradeGood — correct après hésitation.
	GradeGood Grade = 4
	// GradeEasy — correct, parfait.
	GradeEasy Grade = 5
)

// IsValid indique si le grade est dans les bornes SM-2.
func (g Grade) IsValid() bool {
	return g >= GradeBlackout && g <= GradeEasy
}

// IsSuccess indique si le grade compte comme une réussite.
func (g Grade) IsSuccess() bool {
	return g >= GradeHard
}

// ReviewButton — bouton UI simplifié (4 valeurs au lieu de 6).
type ReviewButton string

const (
	ButtonAgain ReviewButton = "again" // → GradeBlackout
	ButtonHard  ReviewButton = "hard"  // → GradeHard
	ButtonGood  ReviewButton = "good"  // → GradeGood
	ButtonEasy  ReviewButton = "easy"  // → GradeEasy
)

// GradeFromButton convertit un bouton UI en grade SM-2.
func GradeFromButton(b ReviewButton) Grade {
	switch b {
	case ButtonAgain:
		return GradeBlackout
	case ButtonHard:
		return GradeHard
	case ButtonGood:
		return GradeGood
	case ButtonEasy:
		return GradeEasy
	default:
		return GradeGood
	}
}

// ReviewOutcome décrit le résultat d'une révision SM-2.
type ReviewOutcome struct {
	// EaseFactor — nouveau facteur de facilité.
	EaseFactor float64

	// IntervalDays — nouvel intervalle en jours.
	IntervalDays int

	// Repetitions — nouveau nombre de répétitions consécutives réussies.
	Repetitions int

	// Lapses — nouveau nombre d'échecs totaux.
	Lapses int

	// DueAt — nouvelle date de révision.
	DueAt time.Time

	// WasSuccess — vrai si le grade était >= GradeHard.
	WasSuccess bool
}

// SM2 calcule la nouvelle planification d'une carte après une révision.
//
// L'algorithme implémenté est une version adaptée du SM-2 original :
//
//	si q >= 3 (succès) :
//	    si n = 0 → I ← 1
//	    si n = 1 → I ← 6
//	    sinon   → I ← min(ceil(I × EF), MaxIntervalDays)
//	    EF ← clamp(EF + (0.1 - (5-q) × (0.08 + (5-q) × 0.02)), [1.3, 2.8])
//	    n ← n + 1
//	sinon (échec) :
//	    EF ← clamp(EF - 0.20, [1.3, 2.8])
//	    n ← 0
//	    I ← 1
//	    lapses ← lapses + 1
//
// Adaptations vs SM-2 original :
//   - L'ease factor est pénalisé même en cas d'échec (l'original ne le
//     modifie qu'en succès).
//   - Le facteur est plafonné à 2.8 (l'original n'a pas de plafond).
//   - L'intervalle est plafonné à MaxIntervalDays.
//
// `now` est la date de la révision (injectable pour les tests).
func SM2(
	current domain.SrsCard,
	grade Grade,
	now time.Time,
) (ReviewOutcome, error) {
	if !grade.IsValid() {
		return ReviewOutcome{}, NewReviewError(current.ID, int(grade),
			"grade invalide (attendu 0-5)", ErrInvalidQuality)
	}
	if current.EaseFactor < MinEaseFactor || current.EaseFactor > MaxEaseFactor {
		return ReviewOutcome{}, NewReviewError(current.ID, int(grade),
			"ease factor initial hors bornes", ErrInvalidCard)
	}

	out := ReviewOutcome{
		EaseFactor:   current.EaseFactor,
		Repetitions:  current.Repetitions,
		Lapses:       current.Lapses,
		IntervalDays: current.IntervalDays,
		WasSuccess:   grade.IsSuccess(),
	}

	if grade.IsSuccess() {
		// Calcul de l'intervalle.
		switch current.Repetitions {
		case 0:
			out.IntervalDays = InitialIntervalDays
		case 1:
			out.IntervalDays = SecondIntervalDays
		default:
			next := int(math.Ceil(float64(current.IntervalDays) * current.EaseFactor))
			if next > MaxIntervalDays {
				next = MaxIntervalDays
			}
			if next < 1 {
				next = 1
			}
			out.IntervalDays = next
		}

		// Mise à jour du facteur de facilité.
		q := float64(grade)
		delta := 0.1 - (5-q)*(0.08+(5-q)*0.02)
		out.EaseFactor = clampEase(current.EaseFactor + delta)

		// Incrément des répétitions.
		out.Repetitions = current.Repetitions + 1
	} else {
		// Échec : on revient au début, avec une pénalité d'ease.
		out.EaseFactor = clampEase(current.EaseFactor - 0.20)
		out.Repetitions = 0
		out.IntervalDays = 1
		out.Lapses = current.Lapses + 1
	}

	out.DueAt = now.AddDate(0, 0, out.IntervalDays)
	return out, nil
}

// clampEase borne le facteur de facilité dans [MinEaseFactor, MaxEaseFactor].
func clampEase(v float64) float64 {
	if v < MinEaseFactor {
		return MinEaseFactor
	}
	if v > MaxEaseFactor {
		return MaxEaseFactor
	}
	return v
}