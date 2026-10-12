package gamification

import (
	"testing"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

/* ─── BonusForStreakDay ───────────────────────────────────────────────── */

func TestBonusForStreakDay(t *testing.T) {
	cases := []struct {
		day  int
		want bool
	}{
		{1, false},
		{2, false},
		{3, true},
		{7, true},
		{10, false},
		{14, true},
		{29, false},
		{30, true},
		{99, false},
		{100, true},
		{200, false},
	}
	for _, tc := range cases {
		m := BonusForStreakDay(tc.day)
		got := m != nil
		if got != tc.want {
			t.Errorf("BonusForStreakDay(%d) : bonus=%v, attendu %v", tc.day, got, tc.want)
		}
		if m != nil && m.Day != tc.day {
			t.Errorf("BonusForStreakDay(%d) : Day=%d", tc.day, m.Day)
		}
	}
}

func TestBonusForStreakDay_ReturnsCopy(t *testing.T) {
	a := BonusForStreakDay(7)
	b := BonusForStreakDay(7)
	if a == nil || b == nil {
		t.Fatal("palier 7 introuvable")
	}
	// Modifier `a` ne doit pas affecter le catalogue.
	a.XP = 99999
	c := BonusForStreakDay(7)
	if c.XP == 99999 {
		t.Error("BonusForStreakDay ne retourne pas une copie défensive")
	}
}

func TestBonusForStreakDay_MilestoneContent(t *testing.T) {
	m := BonusForStreakDay(7)
	if m == nil {
		t.Fatal("palier 7 manquant")
	}
	if m.XP <= 0 {
		t.Errorf("palier 7 : XP=%d, attendu > 0", m.XP)
	}
	if m.Message == "" {
		t.Error("palier 7 : Message vide")
	}
	if m.BadgeID == "" {
		t.Error("palier 7 : BadgeID attendu (streak-7)")
	}
}

/* ─── ComputeStreakBonus ──────────────────────────────────────────────── */

func TestComputeStreakBonus_SingleMilestone(t *testing.T) {
	bonuses := ComputeStreakBonus(2, 3)
	if len(bonuses) != 1 {
		t.Fatalf("attendu 1 bonus, obtenu %d", len(bonuses))
	}
	if bonuses[0].Day != 3 {
		t.Errorf("Day : attendu 3, obtenu %d", bonuses[0].Day)
	}
}

func TestComputeStreakBonus_MultipleMilestones(t *testing.T) {
	// Passage direct de 0 à 10 : doit passer par 3 et 7.
	bonuses := ComputeStreakBonus(0, 10)
	if len(bonuses) != 2 {
		t.Fatalf("attendu 2 bonus (3 et 7), obtenu %d", len(bonuses))
	}
	if bonuses[0].Day != 3 || bonuses[1].Day != 7 {
		t.Errorf("attendu [3, 7], obtenu [%d, %d]", bonuses[0].Day, bonuses[1].Day)
	}
}

func TestComputeStreakBonus_ExactMilestoneOnly(t *testing.T) {
	// De 3 à 7 : seul le palier 7 doit être renvoyé (pas 3 déjà passé).
	bonuses := ComputeStreakBonus(3, 7)
	if len(bonuses) != 1 {
		t.Fatalf("attendu 1 bonus, obtenu %d", len(bonuses))
	}
	if bonuses[0].Day != 7 {
		t.Errorf("Day : attendu 7, obtenu %d", bonuses[0].Day)
	}
}

func TestComputeStreakBonus_NoChange(t *testing.T) {
	if b := ComputeStreakBonus(5, 5); b != nil {
		t.Errorf("même valeur : attendu nil, obtenu %v", b)
	}
}

func TestComputeStreakBonus_Regression(t *testing.T) {
	// Régression : previous > current, aucun bonus.
	if b := ComputeStreakBonus(10, 5); b != nil {
		t.Errorf("régression : attendu nil, obtenu %v", b)
	}
}

func TestComputeStreakBonus_AllMilestones(t *testing.T) {
	bonuses := ComputeStreakBonus(0, 100)
	if len(bonuses) != 5 {
		t.Fatalf("attendu 5 bonus (3/7/14/30/100), obtenu %d", len(bonuses))
	}
	expected := []int{3, 7, 14, 30, 100}
	for i, m := range bonuses {
		if m.Day != expected[i] {
			t.Errorf("bonus[%d] : attendu %d, obtenu %d", i, expected[i], m.Day)
		}
	}
}

func TestComputeStreakBonus_OrderAscending(t *testing.T) {
	bonuses := ComputeStreakBonus(0, 50)
	for i := 1; i < len(bonuses); i++ {
		if bonuses[i-1].Day >= bonuses[i].Day {
			t.Errorf("bonus non triés : [%d]=%d, [%d]=%d",
				i-1, bonuses[i-1].Day, i, bonuses[i].Day)
		}
	}
}

/* ─── CanFreeze ───────────────────────────────────────────────────────── */

func TestCanFreeze(t *testing.T) {
	cases := []struct {
		freezes int
		want    bool
	}{
		{0, true},
		{1, true},
		{MaxFreezes - 1, true},
		{MaxFreezes, false},
		{MaxFreezes + 1, false},
		{-1, true}, // valeur négative traitée comme "aucun freeze stocké"
	}
	for _, tc := range cases {
		got := CanFreeze(tc.freezes)
		if got != tc.want {
			t.Errorf("CanFreeze(%d) = %v, attendu %v", tc.freezes, got, tc.want)
		}
	}
}

/* ─── IsStreakBroken ──────────────────────────────────────────────────── */

func TestIsStreakBroken_SameDay(t *testing.T) {
	last := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	now := time.Date(2026, 1, 15, 22, 30, 0, 0, time.UTC)
	if IsStreakBroken(last, now) {
		t.Error("même jour : streak non cassé")
	}
}

func TestIsStreakBroken_NextDay(t *testing.T) {
	last := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	now := time.Date(2026, 1, 16, 9, 0, 0, 0, time.UTC)
	if IsStreakBroken(last, now) {
		t.Error("J+1 : streak non cassé")
	}
}

func TestIsStreakBroken_DayAfter(t *testing.T) {
	last := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	now := time.Date(2026, 1, 17, 9, 0, 0, 0, time.UTC)
	if !IsStreakBroken(last, now) {
		t.Error("J+2 : streak devrait être cassé")
	}
}

func TestIsStreakBroken_LongAbsence(t *testing.T) {
	last := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	now := time.Date(2026, 3, 1, 10, 0, 0, 0, time.UTC)
	if !IsStreakBroken(last, now) {
		t.Error("45 jours : streak devrait être cassé")
	}
}

func TestIsStreakBroken_JustBeforeMidnight(t *testing.T) {
	// Deux activités à 23h59 et 00h01 le lendemain : J+1, non cassé.
	last := time.Date(2026, 1, 15, 23, 59, 0, 0, time.UTC)
	now := time.Date(2026, 1, 16, 0, 1, 0, 0, time.UTC)
	if IsStreakBroken(last, now) {
		t.Error("23h59 → 00h01 (J+1) : streak non cassé")
	}
}

/* ─── ShouldFreezeOnAbsence ───────────────────────────────────────────── */

func TestShouldFreezeOnAbsence_BrokenWithFreeze(t *testing.T) {
	last := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	now := time.Date(2026, 1, 18, 10, 0, 0, 0, time.UTC) // J+3

	if !ShouldFreezeOnAbsence(last, now, 1) {
		t.Error("streak cassé + 1 freeze dispo : devrait consommer un freeze")
	}
}

func TestShouldFreezeOnAbsence_BrokenNoFreeze(t *testing.T) {
	last := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	now := time.Date(2026, 1, 18, 10, 0, 0, 0, time.UTC)

	if ShouldFreezeOnAbsence(last, now, 0) {
		t.Error("streak cassé + 0 freeze : ne devrait rien faire")
	}
}

func TestShouldFreezeOnAbsence_NotBroken(t *testing.T) {
	last := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	now := time.Date(2026, 1, 16, 10, 0, 0, 0, time.UTC) // J+1

	if ShouldFreezeOnAbsence(last, now, 1) {
		t.Error("streak non cassé : ne devrait pas consommer de freeze")
	}
}

/* ─── BuildStreakStatus ───────────────────────────────────────────────── */

func TestBuildStreakStatus_ActiveToday(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	l := domain.NewLearner("u-1", "Test", "t@example.com")
	l.LastActivityAt = now
	l.StreakDays = 5
	l.BestStreakDays = 10

	s := BuildStreakStatus(l, 2, now)

	if !s.IsActiveToday {
		t.Error("IsActiveToday devrait être vrai")
	}
	if s.CurrentDays != 5 {
		t.Errorf("CurrentDays : attendu 5, obtenu %d", s.CurrentDays)
	}
	if s.BestDays != 10 {
		t.Errorf("BestDays : attendu 10, obtenu %d", s.BestDays)
	}
	if s.FreezesAvailable != 2 {
		t.Errorf("FreezesAvailable : attendu 2, obtenu %d", s.FreezesAvailable)
	}
}

func TestBuildStreakStatus_NextMilestone(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	l := domain.NewLearner("u-1", "Test", "t@example.com")
	l.LastActivityAt = now
	l.StreakDays = 5

	s := BuildStreakStatus(l, 0, now)

	// Prochain palier après 5 = 7.
	if s.NextMilestoneDay != 7 {
		t.Errorf("NextMilestoneDay : attendu 7, obtenu %d", s.NextMilestoneDay)
	}
	if s.DaysUntilNextMile != 2 {
		t.Errorf("DaysUntilNextMile : attendu 2, obtenu %d", s.DaysUntilNextMile)
	}
	if s.NextMilestoneXP <= 0 {
		t.Errorf("NextMilestoneXP : attendu > 0, obtenu %d", s.NextMilestoneXP)
	}
}

func TestBuildStreakStatus_JustReachedMilestone(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	l := domain.NewLearner("u-1", "Test", "t@example.com")
	l.LastActivityAt = now
	l.StreakDays = 7 // pile sur un palier

	s := BuildStreakStatus(l, 0, now)

	// Le prochain palier strictement supérieur à 7 = 14.
	if s.NextMilestoneDay != 14 {
		t.Errorf("NextMilestoneDay : attendu 14, obtenu %d", s.NextMilestoneDay)
	}
	if s.DaysUntilNextMile != 7 {
		t.Errorf("DaysUntilNextMile : attendu 7, obtenu %d", s.DaysUntilNextMile)
	}
}

func TestBuildStreakStatus_BeyondLastMilestone(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	l := domain.NewLearner("u-1", "Test", "t@example.com")
	l.LastActivityAt = now
	l.StreakDays = 250 // au-delà de 100

	s := BuildStreakStatus(l, 0, now)

	if s.NextMilestoneDay != 0 {
		t.Errorf("NextMilestoneDay : attendu 0 (aucun palier après 100), obtenu %d",
			s.NextMilestoneDay)
	}
	if s.NextMilestoneXP != 0 {
		t.Errorf("NextMilestoneXP : attendu 0, obtenu %d", s.NextMilestoneXP)
	}
	if s.DaysUntilNextMile != 0 {
		t.Errorf("DaysUntilNextMile : attendu 0, obtenu %d", s.DaysUntilNextMile)
	}
}

func TestBuildStreakStatus_NotActiveToday(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	l := domain.NewLearner("u-1", "Test", "t@example.com")
	l.LastActivityAt = now.AddDate(0, 0, -2) // avant-hier
	l.StreakDays = 5

	s := BuildStreakStatus(l, 0, now)

	if s.IsActiveToday {
		t.Error("IsActiveToday : attendu false (dernière activité avant-hier)")
	}
}

func TestBuildStreakStatus_ZeroStreak(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	l := domain.NewLearner("u-1", "Test", "t@example.com")
	l.LastActivityAt = now
	l.StreakDays = 0
	l.BestStreakDays = 12

	s := BuildStreakStatus(l, 0, now)

	if s.CurrentDays != 0 {
		t.Errorf("CurrentDays : attendu 0, obtenu %d", s.CurrentDays)
	}
	if s.BestDays != 12 {
		t.Errorf("BestDays : attendu 12, obtenu %d", s.BestDays)
	}
	// Prochain palier = 3 (le premier).
	if s.NextMilestoneDay != 3 {
		t.Errorf("NextMilestoneDay : attendu 3, obtenu %d", s.NextMilestoneDay)
	}
}

/* ─── Intégration avec le domaine ─────────────────────────────────────── */

func TestIsStreakBroken_UsesUTCDates(t *testing.T) {
	// Deux instants proches mais sur deux jours calendaires différents.
	last := time.Date(2026, 1, 15, 23, 30, 0, 0, time.UTC)
	now := time.Date(2026, 1, 16, 0, 30, 0, 0, time.UTC)
	if IsStreakBroken(last, now) {
		t.Error("J+1 UTC : non cassé")
	}

	// 48h plus tard : cassé.
	now2 := time.Date(2026, 1, 17, 0, 30, 0, 0, time.UTC)
	if !IsStreakBroken(last, now2) {
		t.Error("J+2 UTC : devrait être cassé")
	}
}

func TestStreakMilestones_HavePositiveValues(t *testing.T) {
	for _, m := range StreakMilestones {
		if m.Day <= 0 {
			t.Errorf("palier %d : Day doit être > 0", m.Day)
		}
		if m.XP <= 0 {
			t.Errorf("palier %d : XP doit être > 0", m.Day)
		}
		if m.Message == "" {
			t.Errorf("palier %d : Message vide", m.Day)
		}
	}
}

func TestStreakMilestones_AscendingOrder(t *testing.T) {
	for i := 1; i < len(StreakMilestones); i++ {
		if StreakMilestones[i-1].Day >= StreakMilestones[i].Day {
			t.Errorf("paliers non triés : [%d]=%d, [%d]=%d",
				i-1, StreakMilestones[i-1].Day, i, StreakMilestones[i].Day)
		}
	}
}