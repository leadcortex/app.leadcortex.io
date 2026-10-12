package adaptivity

import (
	"testing"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

/* ─── Fixtures ────────────────────────────────────────────────────────── */

func fixedTime() time.Time {
	return time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
}

func newLearner() *domain.Learner {
	return domain.NewLearner("u-test", "Test", "t@example.com")
}

// buildTestRegistry crée un registry à 2 leçons (l1, l2 -> l1 requis).
func buildTestRegistry(t *testing.T) *curriculum.Registry {
	t.Helper()

	lesson1 := domain.Lesson{
		ID: "l1", ModuleID: "m1", Order: 1, Title: "L1",
		DurationMin: 5, Difficulty: 1, XPTotal: 0,
		Blocks: []domain.Block{
			domain.CoverBlock{Title: "C", Objectives: []string{"o"}},
			domain.DebriefBlock{Sections: []domain.DebriefSection{domain.DebriefScoreBreakdown}},
		},
	}
	lesson2 := domain.Lesson{
		ID: "l2", ModuleID: "m1", Order: 2, Title: "L2",
		DurationMin: 5, Difficulty: 1, XPTotal: 0,
		Prerequisites: domain.LessonPrerequisites{
			PreviousLessonIDs: []string{"l1"},
		},
		Blocks: []domain.Block{
			domain.CoverBlock{Title: "C", Objectives: []string{"o"}},
			domain.DebriefBlock{Sections: []domain.DebriefSection{domain.DebriefScoreBreakdown}},
		},
	}
	program := &domain.Program{
		ID: "p1", Order: 1, Title: "P1", Difficulty: 1,
		Modules: []domain.Module{
			{
				ID: "m1", ProgramID: "p1", Order: 1, Title: "M1",
				Lessons: []domain.Lesson{lesson1, lesson2},
			},
		},
	}
	return curriculum.NewRegistry([]*domain.Program{program}, nil, nil)
}

/* ─── DefaultSignalOptions ────────────────────────────────────────────── */

func TestDefaultSignalOptions(t *testing.T) {
	now := fixedTime()
	opts := DefaultSignalOptions(now)
	if !opts.Now.Equal(now) {
		t.Errorf("Now : attendu %v, obtenu %v", now, opts.Now)
	}
	if opts.StallThresholdDays != 3 {
		t.Errorf("StallThresholdDays : attendu 3, obtenu %d", opts.StallThresholdDays)
	}
	if opts.WeakThreshold != domain.MasteryOK {
		t.Errorf("WeakThreshold : attendu %d, obtenu %d", domain.MasteryOK, opts.WeakThreshold)
	}
	if opts.LowScoreThreshold != 60 {
		t.Errorf("LowScoreThreshold : attendu 60, obtenu %f", opts.LowScoreThreshold)
	}
	if opts.OverdueDays != 3 {
		t.Errorf("OverdueDays : attendu 3, obtenu %d", opts.OverdueDays)
	}
}

/* ─── Nil learner ─────────────────────────────────────────────────────── */

func TestDetectSignals_NilLearner(t *testing.T) {
	sigs := DetectSignals(nil, DefaultSignalOptions(fixedTime()))
	if sigs != nil {
		t.Errorf("attendu nil, obtenu %v", sigs)
	}
}

/* ─── SignalWeakConcept ───────────────────────────────────────────────── */

func TestDetectSignals_WeakConcept(t *testing.T) {
	l := newLearner()
	l.ConceptMastery["c1"] = domain.Mastery{
		ConceptID: "c1",
		Level:     30, // < 60
		Attempts:  3,
		Correct:   1,
	}

	sigs := DetectSignals(l, DefaultSignalOptions(fixedTime()))
	found := false
	for _, s := range sigs {
		if s.Kind == SignalWeakConcept && s.TargetID == "c1" {
			found = true
			if s.Severity <= 0 || s.Severity > 1 {
				t.Errorf("sévérité hors bornes : %f", s.Severity)
			}
		}
	}
	if !found {
		t.Errorf("attendu SignalWeakConcept pour c1, signaux : %+v", sigs)
	}
}

func TestDetectSignals_MasteredConceptNotFlagged(t *testing.T) {
	l := newLearner()
	l.ConceptMastery["c1"] = domain.Mastery{
		ConceptID: "c1",
		Level:     domain.MasteryMastered, // 80
		Attempts:  5,
		Correct:   5,
	}

	sigs := DetectSignals(l, DefaultSignalOptions(fixedTime()))
	for _, s := range sigs {
		if s.Kind == SignalWeakConcept && s.TargetID == "c1" {
			t.Error("concept maîtrisé ne doit pas être signalé comme faible")
		}
	}
}

/* ─── SignalLowScores ─────────────────────────────────────────────────── */

func TestDetectSignals_LowScores(t *testing.T) {
	l := newLearner()
	l.ConceptMastery["c1"] = domain.Mastery{
		ConceptID: "c1",
		Level:     domain.MasteryMastered, // pas weak
		Attempts:  10,
		Correct:   5, // accuracy 50% < 60
	}

	sigs := DetectSignals(l, DefaultSignalOptions(fixedTime()))
	found := false
	for _, s := range sigs {
		if s.Kind == SignalLowScores && s.TargetID == "c1" {
			found = true
		}
	}
	if !found {
		t.Errorf("attendu SignalLowScores pour c1, signaux : %+v", sigs)
	}
}

/* ─── SignalLapsedCards ───────────────────────────────────────────────── */

func TestDetectSignals_LapsedCards(t *testing.T) {
	l := newLearner()
	card := *domain.NewSrsCard("card-1", "c1", "Q", "A")
	card.Lapses = 3
	card.DueAt = fixedTime().Add(time.Hour)

	sigs := DetectSignals(l, SignalOptions{
		Now:      fixedTime(),
		SrsCards: []domain.SrsCard{card},
	})
	found := false
	for _, s := range sigs {
		if s.Kind == SignalLapsedCards && s.TargetID == "c1" {
			found = true
		}
	}
	if !found {
		t.Errorf("attendu SignalLapsedCards, signaux : %+v", sigs)
	}
}

/* ─── SignalOverdueReviews ────────────────────────────────────────────── */

func TestDetectSignals_OverdueReviews(t *testing.T) {
	l := newLearner()
	card := *domain.NewSrsCard("card-1", "c1", "Q", "A")
	card.DueAt = fixedTime().AddDate(0, 0, -5) // 5 jours en retard

	sigs := DetectSignals(l, SignalOptions{
		Now:      fixedTime(),
		SrsCards: []domain.SrsCard{card},
	})
	found := false
	for _, s := range sigs {
		if s.Kind == SignalOverdueReviews && s.TargetID == "c1" {
			found = true
		}
	}
	if !found {
		t.Errorf("attendu SignalOverdueReviews, signaux : %+v", sigs)
	}
}

/* ─── SignalStreakBroken ──────────────────────────────────────────────── */

func TestDetectSignals_StreakBroken(t *testing.T) {
	l := newLearner()
	l.StreakDays = 0
	l.LastActivityAt = fixedTime().AddDate(0, 0, -5) // 5 jours sans activité

	sigs := DetectSignals(l, DefaultSignalOptions(fixedTime()))
	found := false
	for _, s := range sigs {
		if s.Kind == SignalStreakBroken {
			found = true
		}
	}
	if !found {
		t.Errorf("attendu SignalStreakBroken, signaux : %+v", sigs)
	}
}

func TestDetectSignals_NotStalledIfRecent(t *testing.T) {
	l := newLearner()
	l.StreakDays = 0
	l.LastActivityAt = fixedTime().Add(-time.Hour) // il y a 1h

	sigs := DetectSignals(l, DefaultSignalOptions(fixedTime()))
	for _, s := range sigs {
		if s.Kind == SignalStreakBroken {
			t.Error("activité récente : pas de SignalStreakBroken")
		}
	}
}

/* ─── SignalBlockedLesson ─────────────────────────────────────────────── */

func TestDetectSignals_BlockedLesson(t *testing.T) {
	reg := buildTestRegistry(t)
	l := newLearner()
	// l2 requiert l1 ; on n'a pas de LessonProgress → l2 bloquée avec
	// exactement 1 prérequis manquant.

	sigs := DetectSignals(l, SignalOptions{
		Now:      fixedTime(),
		Registry: reg,
	})
	found := false
	for _, s := range sigs {
		if s.Kind == SignalBlockedLesson && s.TargetID == "l2" {
			found = true
		}
	}
	if !found {
		t.Errorf("attendu SignalBlockedLesson pour l2, signaux : %+v", sigs)
	}
}

/* ─── Tri par sévérité ────────────────────────────────────────────────── */

func TestDetectSignals_SortedBySeverity(t *testing.T) {
	l := newLearner()
	l.ConceptMastery["c1"] = domain.Mastery{
		ConceptID: "c1", Level: 30, Attempts: 3, Correct: 1,
	}
	l.StreakDays = 0
	l.LastActivityAt = fixedTime().AddDate(0, 0, -14) // sévérité 1.0

	sigs := DetectSignals(l, DefaultSignalOptions(fixedTime()))
	if len(sigs) < 2 {
		t.Fatalf("attendu au moins 2 signaux, obtenu %d", len(sigs))
	}
	for i := 1; i < len(sigs); i++ {
		if sigs[i-1].Severity < sigs[i].Severity {
			t.Errorf("signaux non triés : [%d]=%f, [%d]=%f",
				i-1, sigs[i-1].Severity, i, sigs[i].Severity)
		}
	}
}