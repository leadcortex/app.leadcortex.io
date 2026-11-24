// backend/academy/internal/srs/sm2.go

package srs

import (
	"math"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

const (
	DefaultEaseFactor = 2.5

	MinEaseFactor = domain.EaseFactorMin

	MaxEaseFactor = domain.EaseFactorMax

	InitialIntervalDays = 1

	SecondIntervalDays = 6

	MaxIntervalDays = 3650
)

type Grade int

const (
	GradeBlackout Grade = 0
	GradeIncorrect Grade = 1
	GradeHardFail Grade = 2
	GradeHard Grade = 3
	GradeGood Grade = 4
	GradeEasy Grade = 5
)

func (g Grade) IsValid() bool {
	return g >= GradeBlackout && g <= GradeEasy
}

func (g Grade) IsSuccess() bool {
	return g >= GradeHard
}

type ReviewButton string

const (
	ButtonAgain ReviewButton = "again"
	ButtonHard  ReviewButton = "hard"
	ButtonGood  ReviewButton = "good"
	ButtonEasy  ReviewButton = "easy"
)

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

type ReviewOutcome struct {
	EaseFactor float64

	IntervalDays int

	Repetitions int

	Lapses int

	DueAt time.Time

	WasSuccess bool
}

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

		q := float64(grade)
		delta := 0.1 - (5-q)*(0.08+(5-q)*0.02)
		out.EaseFactor = clampEase(current.EaseFactor + delta)

		out.Repetitions = current.Repetitions + 1
	} else {
		out.EaseFactor = clampEase(current.EaseFactor - 0.20)
		out.Repetitions = 0
		out.IntervalDays = 1
		out.Lapses = current.Lapses + 1
	}

	out.DueAt = now.AddDate(0, 0, out.IntervalDays)
	return out, nil
}

func clampEase(v float64) float64 {
	if v < MinEaseFactor {
		return MinEaseFactor
	}
	if v > MaxEaseFactor {
		return MaxEaseFactor
	}
	return v
}