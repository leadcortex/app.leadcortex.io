package adaptivity

import (
	"testing"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

/* ─── Nil learner ─────────────────────────────────────────────────────── */

func TestBuildProfile_NilLearner(t *testing.T) {
	p := BuildProfile(nil, DefaultSignalOptions(fixedTime()))
	if p.LearnerID != "" {
		t.Errorf("attendu zero Profile, obtenu %+v", p)
	}
}

/* ─── Champs de base ──────────────────────────────────────────────────── */

func TestBuildProfile_BasicFields(t *testing.T) {
	l := newLearner()
	l.XP = 500
	l.Level = 3
	l.StreakDays = 5
	l.BestStreakDays = 10
	l.Hearts = 4
	l.LastActivityAt = fixedTime()

	p := BuildProfile(l, DefaultSignalOptions(fixedTime()))

	if p.LearnerID != l.ID {
		t.Errorf("LearnerID : attendu %s, obtenu %s", l.ID, p.LearnerID)
	}
	if p.XP != 500 || p.Level != 3 {
		t.Errorf("XP/Level : attendu 500/3, obtenu %d/%d", p.XP, p.Level)
	}
	if p.StreakDays != 5 || p.BestStreakDays != 10 {
		t.Errorf("Streak : attendu 5/10, obtenu %d/%d", p.StreakDays, p.BestStreakDays)
	}
	if p.Hearts != 4 {
		t.Errorf("Hearts : attendu 4, obtenu %d", p.Hearts)
	}
	if !p.ActiveToday {
		t.Error("ActiveToday : attendu true")
	}
}

func TestBuildProfile_ActiveTodayFalse(t *testing.T) {
	l := newLearner()
	l.LastActivityAt = fixedTime().AddDate(0, 0, -2)

	p := BuildProfile(l, DefaultSignalOptions(fixedTime()))
	if p.ActiveToday {
		t.Error("ActiveToday : attendu false")
	}
}

/* ─── Strengths / Weaknesses ──────────────────────────────────────────── */

func TestBuildProfile_SplitsStrengthsAndWeaknesses(t *testing.T) {
	l := newLearner()
	// Maîtrisé
	l.ConceptMastery["c-strong"] = domain.Mastery{
		ConceptID: "c-strong", Level: domain.MasteryMastered,
		Attempts: 5, Correct: 5,
	}
	// OK (fragile)
	l.ConceptMastery["c-ok"] = domain.Mastery{
		ConceptID: "c-ok", Level: domain.MasteryOK,
		Attempts: 3, Correct: 2,
	}
	// Fragile
	l.ConceptMastery["c-weak"] = domain.Mastery{
		ConceptID: "c-weak", Level: domain.MasteryFragile,
		Attempts: 2, Correct: 0,
	}
	// Non touché → ignoré
	l.ConceptMastery["c-untouched"] = domain.Mastery{
		ConceptID: "c-untouched", Level: 0, Attempts: 0,
	}

	p := BuildProfile(l, DefaultSignalOptions(fixedTime()))

	if len(p.Strengths) != 1 {
		t.Errorf("Strengths : attendu 1, obtenu %d", len(p.Strengths))
	}
	if p.Strengths[0].ConceptID != "c-strong" {
		t.Errorf("Strengths[0] : attendu c-strong, obtenu %s", p.Strengths[0].ConceptID)
	}
	if len(p.Weaknesses) != 2 {
		t.Errorf("Weaknesses : attendu 2, obtenu %d", len(p.Weaknesses))
	}
	// Weaknesses triées par niveau croissant : c-weak (30) avant c-ok (60).
	if p.Weaknesses[0].ConceptID != "c-weak" {
		t.Errorf("Weaknesses[0] : attendu c-weak (niveau bas), obtenu %s",
			p.Weaknesses[0].ConceptID)
	}
}

func TestBuildProfile_StrengthsSortedDesc(t *testing.T) {
	l := newLearner()
	l.ConceptMastery["a"] = domain.Mastery{ConceptID: "a", Level: 80, Attempts: 1}
	l.ConceptMastery["b"] = domain.Mastery{ConceptID: "b", Level: 100, Attempts: 1}
	l.ConceptMastery["c"] = domain.Mastery{ConceptID: "c", Level: 90, Attempts: 1}

	p := BuildProfile(l, DefaultSignalOptions(fixedTime()))
	if len(p.Strengths) < 3 {
		t.Fatalf("attendu 3 strengths, obtenu %d", len(p.Strengths))
	}
	if p.Strengths[0].Level < p.Strengths[1].Level {
		t.Error("Strengths non triées décroissantes")
	}
}

/* ─── Signaux intégrés ────────────────────────────────────────────────── */

func TestBuildProfile_IncludesSignals(t *testing.T) {
	l := newLearner()
	l.ConceptMastery["c1"] = domain.Mastery{
		ConceptID: "c1", Level: 30, Attempts: 3, Correct: 1,
	}

	p := BuildProfile(l, DefaultSignalOptions(fixedTime()))
	if len(p.Signals) == 0 {
		t.Error("Profile.Signals devrait contenir au moins un signal")
	}
}

/* ─── Difficulty cible ────────────────────────────────────────────────── */

func TestBuildProfile_TargetDifficultySet(t *testing.T) {
	l := newLearner()
	p := BuildProfile(l, DefaultSignalOptions(fixedTime()))
	if p.TargetDifficulty < 1 || p.TargetDifficulty > 5 {
		t.Errorf("TargetDifficulty hors bornes : %d", p.TargetDifficulty)
	}
}

/* ─── EstimatedFocusMinutes ───────────────────────────────────────────── */

func TestBuildProfile_EstimatedFocusMinutesInRange(t *testing.T) {
	l := newLearner()
	p := BuildProfile(l, DefaultSignalOptions(fixedTime()))
	if p.EstimatedFocusMinutes < 5 || p.EstimatedFocusMinutes > 30 {
		t.Errorf("EstimatedFocusMinutes hors bornes : %d", p.EstimatedFocusMinutes)
	}
}

func TestBuildProfile_LowHeartsShortensSession(t *testing.T) {
	full := newLearner()
	full.Hearts = domain.MaxHearts

	low := newLearner()
	low.Hearts = 1

	pFull := BuildProfile(full, DefaultSignalOptions(fixedTime()))
	pLow := BuildProfile(low, DefaultSignalOptions(fixedTime()))

	if pLow.EstimatedFocusMinutes > pFull.EstimatedFocusMinutes {
		t.Errorf("session avec peu de cœurs devrait être plus courte : full=%d, low=%d",
			pFull.EstimatedFocusMinutes, pLow.EstimatedFocusMinutes)
	}
}

/* ─── ProgressRatio ───────────────────────────────────────────────────── */

func TestBuildProfile_ProgressRatio(t *testing.T) {
	reg := buildTestRegistry(t)
	l := newLearner()
	l.LessonProgress["l1"] = domain.LessonProgress{
		LessonID: "l1", Status: domain.LessonStatusCompleted,
	}

	p := BuildProfile(l, SignalOptions{
		Now:      fixedTime(),
		Registry: reg,
	})
	// 1 leçon terminée sur 2 = 0.5
	if p.ProgressRatio < 0.49 || p.ProgressRatio > 0.51 {
		t.Errorf("ProgressRatio : attendu ~0.5, obtenu %f", p.ProgressRatio)
	}
}

func TestBuildProfile_ProgressRatioNoRegistry(t *testing.T) {
	l := newLearner()
	p := BuildProfile(l, DefaultSignalOptions(fixedTime()))
	if p.ProgressRatio != 0 {
		t.Errorf("sans registry : attendu 0, obtenu %f", p.ProgressRatio)
	}
}

/* ─── ConceptStrength helpers ─────────────────────────────────────────── */

func TestConceptStrength_IsMastered(t *testing.T) {
	s := ConceptStrength{Level: domain.MasteryMastered}
	if !s.IsMastered() {
		t.Error("attendu true pour niveau 80")
	}
	s = ConceptStrength{Level: 50}
	if s.IsMastered() {
		t.Error("attendu false pour niveau 50")
	}
}

func TestConceptStrength_IsWeak(t *testing.T) {
	s := ConceptStrength{Level: 30}
	if !s.IsWeak(domain.MasteryOK) {
		t.Error("niveau 30 < 60 : attendu true")
	}
	if s.IsWeak(20) {
		t.Error("niveau 30 > 20 : attendu false")
	}
}