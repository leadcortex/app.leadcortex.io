package progress

import (
	"testing"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

/* ─── Fixtures ────────────────────────────────────────────────────────── */

// fixedClock — horloge figée pour les tests.
type fixedClock struct{ t time.Time }

func (c fixedClock) Now() time.Time { return c.t }

// buildTestRegistry crée un petit registre en mémoire pour les tests.
// 2 modules, 3 leçons au total.
func buildTestRegistry(t *testing.T) *curriculum.Registry {
	t.Helper()

	lesson1 := domain.Lesson{
		ID:          "l1",
		ModuleID:    "m1",
		Order:       1,
		Title:       "Leçon 1",
		DurationMin: 5,
		Difficulty:  1,
		XPTotal:     100,
		Concepts:    []string{"c1"},
		Blocks: []domain.Block{
			domain.CoverBlock{Title: "Cover", Objectives: []string{"O"}},
			domain.PracticeBlock{
				Exercises: []domain.Exercise{
					{
						ID: "ex1", Kind: domain.ExerciseMCQ, Prompt: "?",
						XP: 10, Difficulty: 1, Concepts: []string{"c1"},
						Payload: domain.MCqPayload{Options: []string{"a", "b"}, Correct: 0},
					},
				},
			},
			domain.MissionBlock{
				Mission: domain.Mission{
					ID: "m1-l1-mission", LessonID: "l1", Title: "Mission 1",
					BriefMD: "Brief",
					Target: domain.MissionTarget{Route: "/app/test", CTA: "Go"},
					Validation: domain.MissionValidation{
						Conditions: domain.ConditionGroup{
							All: []domain.Condition{
								{Path: "x", Op: domain.OpGreaterThan, Value: 0},
							},
						},
					},
					OnSuccess: domain.MissionOnSuccess{XP: 50},
				},
			},
			domain.DebriefBlock{Sections: []domain.DebriefSection{domain.DebriefScoreBreakdown}},
		},
	}
	lesson2 := domain.Lesson{
		ID:          "l2",
		ModuleID:    "m1",
		Order:       2,
		Title:       "Leçon 2",
		DurationMin: 5,
		Difficulty:  1,
		XPTotal:     50,
		Concepts:    []string{"c1"},
		Prerequisites: domain.LessonPrerequisites{PreviousLessonIDs: []string{"l1"}},
		Blocks: []domain.Block{
			domain.CoverBlock{Title: "Cover", Objectives: []string{"O"}},
			domain.DebriefBlock{Sections: []domain.DebriefSection{domain.DebriefScoreBreakdown}},
		},
	}
	lesson3 := domain.Lesson{
		ID:          "l3",
		ModuleID:    "m2",
		Order:       1,
		Title:       "Leçon 3",
		DurationMin: 5,
		Difficulty:  1,
		XPTotal:     50,
		Prerequisites: domain.LessonPrerequisites{
			PreviousLessonIDs: []string{"l2"},
		},
		Blocks: []domain.Block{
			domain.CoverBlock{Title: "Cover", Objectives: []string{"O"}},
			domain.DebriefBlock{Sections: []domain.DebriefSection{domain.DebriefScoreBreakdown}},
		},
	}

	program := &domain.Program{
		ID:         "p1",
		Order:      1,
		Title:      "Programme de test",
		Difficulty: 1,
		Modules: []domain.Module{
			{ID: "m1", ProgramID: "p1", Order: 1, Title: "Module 1",
				Lessons: []domain.Lesson{lesson1, lesson2}},
			{ID: "m2", ProgramID: "p1", Order: 2, Title: "Module 2",
				Lessons: []domain.Lesson{lesson3}},
		},
	}

	return curriculum.NewRegistry([]*domain.Program{program}, nil, nil)
}

func newTestEngine(t *testing.T) *Engine {
	t.Helper()
	reg := buildTestRegistry(t)
	resolver := curriculum.NewResolver(reg)
	return NewEngine(reg, resolver, fixedClock{t: time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)})
}

func newTestLearner() *domain.Learner {
	return domain.NewLearner("learner-1", "Test User", "test@example.com")
}

/* ─── Tests : évaluation d'accès ──────────────────────────────────────── */

func TestCanStart_FirstLessonUnlocked(t *testing.T) {
	e := newTestEngine(t)
	learner := newTestLearner()

	ok, result := e.CanStart(learner, "l1")
	if !ok {
		t.Errorf("l1 devrait être débloquée, raison : %s", result.Reason)
	}
}

func TestCanStart_SecondLessonLocked(t *testing.T) {
	e := newTestEngine(t)
	learner := newTestLearner()

	ok, result := e.CanStart(learner, "l2")
	if ok {
		t.Error("l2 ne devrait pas être débloquée (prérequis l1)")
	}
	if len(result.MissingLessons) != 1 || result.MissingLessons[0] != "l1" {
		t.Errorf("prérequis manquant attendu : [l1], obtenu : %v", result.MissingLessons)
	}
}

func TestCanStart_UnknownLesson(t *testing.T) {
	e := newTestEngine(t)
	learner := newTestLearner()

	ok, _ := e.CanStart(learner, "unknown")
	if ok {
		t.Error("leçon inconnue ne devrait pas être débloquée")
	}
}

/* ─── Tests : application d'événements ───────────────────────────────── */

func TestApply_LessonStarted(t *testing.T) {
	e := newTestEngine(t)
	learner := newTestLearner()

	res, err := e.Apply(learner, LessonStarted{
		At:        time.Now(),
		LearnerID: learner.ID,
		LessonID:  "l1",
	})
	if err != nil {
		t.Fatalf("Apply : %v", err)
	}
	if !res.Transitioned {
		t.Error("attendu : transition vers in_progress")
	}
	if res.NewStatus != domain.LessonStatusInProgress {
		t.Errorf("statut : attendu in_progress, obtenu %s", res.NewStatus)
	}
	progress := learner.LessonProgress["l1"]
	if progress.Status != domain.LessonStatusInProgress {
		t.Errorf("progress.Status : attendu in_progress, obtenu %s", progress.Status)
	}
}

func TestApply_LessonStarted_Locked(t *testing.T) {
	e := newTestEngine(t)
	learner := newTestLearner()

	_, err := e.Apply(learner, LessonStarted{
		At: time.Now(), LearnerID: learner.ID, LessonID: "l2",
	})
	if err == nil {
		t.Fatal("attendu : erreur (l2 verrouillée)")
	}
}

func TestApply_FullLessonFlow(t *testing.T) {
	e := newTestEngine(t)
	learner := newTestLearner()
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)

	// Démarrer la leçon.
	if _, err := e.Apply(learner, LessonStarted{
		At: now, LearnerID: learner.ID, LessonID: "l1",
	}); err != nil {
		t.Fatalf("start : %v", err)
	}

	// Voir le cover.
	if _, err := e.Apply(learner, LessonBlockViewed{
		At: now, LearnerID: learner.ID, LessonID: "l1",
		BlockIndex: 0,
	}); err != nil {
		t.Fatalf("cover : %v", err)
	}

	// Répondre à l'exercice.
	if _, err := e.Apply(learner, ExerciseAnswered{
		At: now, LearnerID: learner.ID, LessonID: "l1",
		BlockIndex: 1, ExerciseID: "ex1", Score: 100, AttemptNumber: 1, XPAwarded: 10,
	}); err != nil {
		t.Fatalf("exercise : %v", err)
	}

	// Réussir la mission.
	if _, err := e.Apply(learner, MissionSucceeded{
		At: now, LearnerID: learner.ID, LessonID: "l1",
		BlockIndex: 2, MissionID: "m1-l1-mission",
	}); err != nil {
		t.Fatalf("mission : %v", err)
	}

	// Voir le debrief.
	res, err := e.Apply(learner, LessonBlockViewed{
		At: now, LearnerID: learner.ID, LessonID: "l1",
		BlockIndex: 3,
	})
	if err != nil {
		t.Fatalf("debrief : %v", err)
	}

	// Vérifier la complétion.
	progress := learner.LessonProgress["l1"]
	if progress.Status != domain.LessonStatusCompleted &&
		progress.Status != domain.LessonStatusMastered {
		t.Errorf("statut final : attendu completed ou mastered, obtenu %s", progress.Status)
	}

	// Vérifier l'émission de l'événement LessonCompleted.
	hasCompleted := false
	for _, ev := range res.Emitted {
		if _, ok := ev.(LessonCompleted); ok {
			hasCompleted = true
		}
	}
	if !hasCompleted {
		t.Errorf("attendu : événement LessonCompleted émis, obtenu %v", res.Emitted)
	}

	// XP vérifiée.
	if learner.XP < 60 {
		t.Errorf("XP : attendu >= 60 (10 ex + 50 mission), obtenu %d", learner.XP)
	}
}

func TestApply_BlockOutOfOrder(t *testing.T) {
	e := newTestEngine(t)
	learner := newTestLearner()
	now := time.Now()

	if _, err := e.Apply(learner, LessonStarted{
		At: now, LearnerID: learner.ID, LessonID: "l1",
	}); err != nil {
		t.Fatal(err)
	}

	_, err := e.Apply(learner, LessonBlockViewed{
		At: now, LearnerID: learner.ID, LessonID: "l1",
		BlockIndex: 99,
	})
	if err == nil {
		t.Error("attendu : erreur pour index de bloc hors limites")
	}
}

/* ─── Tests : recommandation ──────────────────────────────────────────── */

func TestRecommend_FreshLearner(t *testing.T) {
	e := newTestEngine(t)
	learner := newTestLearner()

	reco := e.Recommend(learner)
	if reco.Kind != RecoLesson {
		t.Errorf("attendu RecoLesson, obtenu %s", reco.Kind)
	}
	if reco.LessonID != "l1" {
		t.Errorf("attendu l1, obtenu %s", reco.LessonID)
	}
}

/* ─── Tests : snapshot ────────────────────────────────────────────────── */

func TestBuildSnapshot_Structure(t *testing.T) {
	e := newTestEngine(t)
	learner := newTestLearner()

	snap := BuildSnapshot(e.registry, e, learner)

	if snap.LearnerID != learner.ID {
		t.Errorf("learner_id : attendu %s, obtenu %s", learner.ID, snap.LearnerID)
	}
	if len(snap.Programs) != 1 {
		t.Fatalf("programmes : attendu 1, obtenu %d", len(snap.Programs))
	}
	if snap.Programs[0].TotalLessons != 3 {
		t.Errorf("total lessons : attendu 3, obtenu %d", snap.Programs[0].TotalLessons)
	}
	if snap.Programs[0].CompletedCount != 0 {
		t.Errorf("completed : attendu 0, obtenu %d", snap.Programs[0].CompletedCount)
	}
	if snap.Recommendation.Kind != RecoLesson {
		t.Errorf("recommandation : attendu RecoLesson, obtenu %s", snap.Recommendation.Kind)
	}
}

/* ─── Tests : FSM ─────────────────────────────────────────────────────── */

func TestCanTransition_Allowed(t *testing.T) {
	allowed := []struct {
		from, to domain.LessonStatus
	}{
		{domain.LessonStatusLocked, domain.LessonStatusAvailable},
		{domain.LessonStatusAvailable, domain.LessonStatusInProgress},
		{domain.LessonStatusInProgress, domain.LessonStatusCompleted},
		{domain.LessonStatusCompleted, domain.LessonStatusMastered},
	}
	for _, tc := range allowed {
		if !canTransition(tc.from, tc.to) {
			t.Errorf("transition %s → %s devrait être autorisée", tc.from, tc.to)
		}
	}
}

func TestCanTransition_Forbidden(t *testing.T) {
	forbidden := []struct {
		from, to domain.LessonStatus
	}{
		{domain.LessonStatusLocked, domain.LessonStatusCompleted},
		{domain.LessonStatusMastered, domain.LessonStatusLocked},
		{domain.LessonStatusCompleted, domain.LessonStatusAvailable},
	}
	for _, tc := range forbidden {
		if canTransition(tc.from, tc.to) {
			t.Errorf("transition %s → %s ne devrait pas être autorisée", tc.from, tc.to)
		}
	}
}