package srs

import (
	"testing"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

func mkCard() domain.SrsCard {
	return domain.SrsCard{
		ID:             "card-1",
		ConceptID:      "c1",
		Front:          "Q",
		Back:           "A",
		EaseFactor:     DefaultEaseFactor,
		IntervalDays:   0,
		Repetitions:    0,
		Lapses:         0,
	}
}

func TestSM2_FirstSuccess(t *testing.T) {
	card := mkCard()
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)

	out, err := SM2(card, GradeGood, now)
	if err != nil {
		t.Fatalf("SM2 : %v", err)
	}
	if out.IntervalDays != InitialIntervalDays {
		t.Errorf("intervalle : attendu %d, obtenu %d", InitialIntervalDays, out.IntervalDays)
	}
	if out.Repetitions != 1 {
		t.Errorf("repetitions : attendu 1, obtenu %d", out.Repetitions)
	}
	if !out.WasSuccess {
		t.Error("WasSuccess devrait être vrai")
	}
}

func TestSM2_SecondSuccess(t *testing.T) {
	card := mkCard()
	card.Repetitions = 1
	card.IntervalDays = 1
	now := time.Now().UTC()

	out, err := SM2(card, GradeGood, now)
	if err != nil {
		t.Fatalf("SM2 : %v", err)
	}
	if out.IntervalDays != SecondIntervalDays {
		t.Errorf("intervalle : attendu %d, obtenu %d", SecondIntervalDays, out.IntervalDays)
	}
	if out.Repetitions != 2 {
		t.Errorf("repetitions : attendu 2, obtenu %d", out.Repetitions)
	}
}

func TestSM2_ThirdSuccess_Multiplies(t *testing.T) {
	card := mkCard()
	card.Repetitions = 2
	card.IntervalDays = 6
	card.EaseFactor = 2.5
	now := time.Now().UTC()

	out, err := SM2(card, GradeGood, now)
	if err != nil {
		t.Fatalf("SM2 : %v", err)
	}
	// ceil(6 * 2.5) = 15
	if out.IntervalDays != 15 {
		t.Errorf("intervalle : attendu 15, obtenu %d", out.IntervalDays)
	}
}

func TestSM2_FailureResets(t *testing.T) {
	card := mkCard()
	card.Repetitions = 5
	card.IntervalDays = 60
	card.EaseFactor = 2.5
	card.Lapses = 1
	now := time.Now().UTC()

	out, err := SM2(card, GradeBlackout, now)
	if err != nil {
		t.Fatalf("SM2 : %v", err)
	}
	if out.IntervalDays != 1 {
		t.Errorf("intervalle après échec : attendu 1, obtenu %d", out.IntervalDays)
	}
	if out.Repetitions != 0 {
		t.Errorf("repetitions après échec : attendu 0, obtenu %d", out.Repetitions)
	}
	if out.Lapses != 2 {
		t.Errorf("lapses : attendu 2, obtenu %d", out.Lapses)
	}
	if out.EaseFactor >= 2.5 {
		t.Errorf("ease factor devrait baisser après échec, obtenu %f", out.EaseFactor)
	}
}

func TestSM2_EaseFactorFloor(t *testing.T) {
	card := mkCard()
	card.EaseFactor = MinEaseFactor // 1.3
	now := time.Now().UTC()

	out, _ := SM2(card, GradeBlackout, now)
	if out.EaseFactor < MinEaseFactor {
		t.Errorf("ease factor sous le plancher : %f", out.EaseFactor)
	}
}

func TestSM2_EaseFactorCeiling(t *testing.T) {
	card := mkCard()
	card.EaseFactor = MaxEaseFactor // 2.8
	now := time.Now().UTC()

	out, _ := SM2(card, GradeEasy, now)
	if out.EaseFactor > MaxEaseFactor {
		t.Errorf("ease factor au-dessus du plafond : %f", out.EaseFactor)
	}
}

func TestSM2_InvalidGrade(t *testing.T) {
	card := mkCard()
	_, err := SM2(card, Grade(99), time.Now())
	if err == nil {
		t.Fatal("attendu : erreur grade invalide")
	}
}

func TestSM2_IntervalCeiling(t *testing.T) {
	card := mkCard()
	card.Repetitions = 10
	card.IntervalDays = 5000
	card.EaseFactor = 2.8
	now := time.Now().UTC()

	out, _ := SM2(card, GradeEasy, now)
	if out.IntervalDays > MaxIntervalDays {
		t.Errorf("intervalle dépasse le plafond : %d > %d",
			out.IntervalDays, MaxIntervalDays)
	}
}

func TestGradeFromButton(t *testing.T) {
	cases := []struct {
		in   ReviewButton
		want Grade
	}{
		{ButtonAgain, GradeBlackout},
		{ButtonHard, GradeHard},
		{ButtonGood, GradeGood},
		{ButtonEasy, GradeEasy},
	}
	for _, tc := range cases {
		if got := GradeFromButton(tc.in); got != tc.want {
			t.Errorf("GradeFromButton(%s) = %d, attendu %d", tc.in, got, tc.want)
		}
	}
}

func TestReviewCard(t *testing.T) {
	card := mkCard()
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)

	updated, err := ReviewCard(card, GradeGood, now)
	if err != nil {
		t.Fatalf("ReviewCard : %v", err)
	}
	if updated.LastReviewedAt != now {
		t.Error("LastReviewedAt non mis à jour")
	}
	if updated.IntervalDays != 1 {
		t.Errorf("intervalle attendu 1, obtenu %d", updated.IntervalDays)
	}
	// La carte d'origine ne doit PAS être mutée.
	if card.IntervalDays != 0 {
		t.Error("la carte d'origine a été mutée")
	}
}

func TestMasteryFromCard(t *testing.T) {
	// Carte neuve : mastery 0.
	fresh := mkCard()
	if got := MasteryFromCard(fresh); got > 20 {
		t.Errorf("carte neuve : mastery attendu bas, obtenu %d", got)
	}

	// Carte mature.
	mature := mkCard()
	mature.Repetitions = 6
	mature.IntervalDays = 60
	mature.EaseFactor = 2.6
	if got := MasteryFromCard(mature); got < 80 {
		t.Errorf("carte mature : mastery attendu >= 80, obtenu %d", got)
	}

	// Carte fragile.
	fragile := mkCard()
	fragile.Repetitions = 1
	fragile.Lapses = 5
	fragile.IntervalDays = 2
	if got := MasteryFromCard(fragile); got > 50 {
		t.Errorf("carte fragile : mastery attendu <= 50, obtenu %d", got)
	}
}