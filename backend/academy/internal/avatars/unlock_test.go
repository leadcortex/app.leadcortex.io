package avatars

import (
	"errors"
	"testing"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

func fixedTime() time.Time {
	return time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
}

func newLearner() *domain.Learner {
	return domain.NewLearner("u-test", "Test", "t@example.com")
}

/* ─── Conditions : streak ─────────────────────────────────────────────── */

func TestEvaluate_Streak_Met(t *testing.T) {
	l := newLearner()
	l.StreakDays = 10

	a := MustFind("fox") // streak 7
	ok, err := Evaluate(a, NewContext(l, nil, fixedTime()))
	if err != nil {
		t.Fatalf("Evaluate : %v", err)
	}
	if !ok {
		t.Error("streak 10 >= 7 : attendu true")
	}
}

func TestEvaluate_Streak_NotMet(t *testing.T) {
	l := newLearner()
	l.StreakDays = 3

	a := MustFind("fox")
	ok, _ := Evaluate(a, NewContext(l, nil, fixedTime()))
	if ok {
		t.Error("streak 3 < 7 : attendu false")
	}
}

/* ─── Conditions : lessons ────────────────────────────────────────────── */

func TestEvaluate_Lessons(t *testing.T) {
	l := newLearner()
	for i := 0; i < 5; i++ {
		l.LessonProgress[lessonID(i)] = domain.LessonProgress{
			LessonID: lessonID(i),
			Status:   domain.LessonStatusCompleted,
		}
	}

	a := MustFind("panda") // 5 leçons
	ok, err := Evaluate(a, NewContext(l, nil, fixedTime()))
	if err != nil {
		t.Fatalf("Evaluate : %v", err)
	}
	if !ok {
		t.Error("5 leçons complétées : attendu true")
	}

	// 4 leçons → pas encore.
	l2 := newLearner()
	for i := 0; i < 4; i++ {
		l2.LessonProgress[lessonID(i)] = domain.LessonProgress{
			LessonID: lessonID(i),
			Status:   domain.LessonStatusCompleted,
		}
	}
	ok, _ = Evaluate(a, NewContext(l2, nil, fixedTime()))
	if ok {
		t.Error("4 leçons < 5 : attendu false")
	}
}

func lessonID(i int) string {
	return "l" + string(rune('0'+i))
}

/* ─── Conditions : mission_count ──────────────────────────────────────── */

func TestEvaluate_MissionCount(t *testing.T) {
	l := newLearner()
	for i := 0; i < 10; i++ {
		l.MissionProgress["m"+string(rune('0'+i))] = domain.MissionProgress{
			MissionID: "m" + string(rune('0'+i)),
			Status:    domain.MissionStatusCompleted,
		}
	}

	a := MustFind("owl") // 10 missions
	ok, err := Evaluate(a, NewContext(l, nil, fixedTime()))
	if err != nil {
		t.Fatalf("Evaluate : %v", err)
	}
	if !ok {
		t.Error("10 missions : attendu true")
	}
}

/* ─── Conditions : program ────────────────────────────────────────────── */

func TestEvaluate_Program_Completed(t *testing.T) {
	l := newLearner()
	l.ProgramProgress["p1-foundations"] = domain.ProgramProgress{
		ProgramID:   "p1-foundations",
		CompletedAt: fixedTime(),
	}

	a := MustFind("eagle")
	ok, err := Evaluate(a, NewContext(l, nil, fixedTime()))
	if err != nil {
		t.Fatalf("Evaluate : %v", err)
	}
	if !ok {
		t.Error("programme complété : attendu true")
	}
}

func TestEvaluate_Program_NotCompleted(t *testing.T) {
	l := newLearner()

	a := MustFind("eagle")
	ok, _ := Evaluate(a, NewContext(l, nil, fixedTime()))
	if ok {
		t.Error("programme non complété : attendu false")
	}
}

/* ─── Conditions : secret ─────────────────────────────────────────────── */

func TestEvaluate_Secret_Level(t *testing.T) {
	l := newLearner()
	a := MustFind("cat") // secret: "level-20"

	// Sans contexte enrichi → false.
	ok, _ := Evaluate(a, NewContext(l, nil, fixedTime()))
	if ok {
		t.Error("secret sans Value : attendu false")
	}

	// Avec la Value positionnée → true.
	ctx := NewContext(l, nil, fixedTime()).WithValue("level-20", true)
	ok, err := Evaluate(a, ctx)
	if err != nil {
		t.Fatalf("Evaluate : %v", err)
	}
	if !ok {
		t.Error("secret avec Value=true : attendu true")
	}
}

/* ─── Conditions : founding ───────────────────────────────────────────── */

func TestEvaluate_Founding_ViaValues(t *testing.T) {
	l := newLearner()
	a := MustFind("dolphin")

	ctx := NewContext(l, nil, fixedTime()).WithValue("founding", true)
	ok, err := Evaluate(a, ctx)
	if err != nil {
		t.Fatalf("Evaluate : %v", err)
	}
	if !ok {
		t.Error("founding via Values : attendu true")
	}
}

func TestEvaluate_Founding_FallbackAllPrograms(t *testing.T) {
	// Deux programmes, tous les deux complétés.
	lesson1 := domain.Lesson{
		ID: "l1", ModuleID: "m1", Order: 1, Title: "L1",
		DurationMin: 5, Difficulty: 1, XPTotal: 0,
		Blocks: []domain.Block{
			domain.CoverBlock{Title: "C", Objectives: []string{"o"}},
			domain.DebriefBlock{Sections: []domain.DebriefSection{domain.DebriefScoreBreakdown}},
		},
	}
	lesson2 := domain.Lesson{
		ID: "l2", ModuleID: "m2", Order: 1, Title: "L2",
		DurationMin: 5, Difficulty: 1, XPTotal: 0,
		Blocks: []domain.Block{
			domain.CoverBlock{Title: "C", Objectives: []string{"o"}},
			domain.DebriefBlock{Sections: []domain.DebriefSection{domain.DebriefScoreBreakdown}},
		},
	}
	p1 := &domain.Program{
		ID: "p1", Order: 1, Title: "P1", Difficulty: 1,
		Modules: []domain.Module{{ID: "m1", ProgramID: "p1", Order: 1, Title: "M1", Lessons: []domain.Lesson{lesson1}}},
	}
	p2 := &domain.Program{
		ID: "p2", Order: 2, Title: "P2", Difficulty: 1,
		Modules: []domain.Module{{ID: "m2", ProgramID: "p2", Order: 1, Title: "M2", Lessons: []domain.Lesson{lesson2}}},
	}
	reg := curriculum.NewRegistry([]*domain.Program{p1, p2}, nil, nil)

	l := newLearner()
	l.ProgramProgress["p1"] = domain.ProgramProgress{ProgramID: "p1", CompletedAt: fixedTime()}
	l.ProgramProgress["p2"] = domain.ProgramProgress{ProgramID: "p2", CompletedAt: fixedTime()}

	a := MustFind("dolphin")
	ok, err := Evaluate(a, NewContext(l, reg, fixedTime()))
	if err != nil {
		t.Fatalf("Evaluate : %v", err)
	}
	if !ok {
		t.Error("tous programmes terminés : founding attendu true")
	}
}

/* ─── Erreurs ─────────────────────────────────────────────────────────── */

func TestEvaluate_NilLearner(t *testing.T) {
	a := MustFind("eagle")
	_, err := Evaluate(a, Context{Values: map[string]any{}, Now: fixedTime()})
	if !errors.Is(err, ErrInvalidContext) {
		t.Errorf("attendu ErrInvalidContext, obtenu %v", err)
	}
}

func TestEvaluateByID_Unknown(t *testing.T) {
	l := newLearner()
	_, err := EvaluateByID("unknown", NewContext(l, nil, fixedTime()))
	if !errors.Is(err, ErrUnknownAvatar) {
		t.Errorf("attendu ErrUnknownAvatar, obtenu %v", err)
	}
}

func TestEvaluate_InvalidUnlockValue(t *testing.T) {
	l := newLearner()
	// Créer un avatar fictif avec un streak non numérique.
	bad := domain.Avatar{
		ID: "bad", Name: "Bad", Tier: domain.AvatarTierClassic,
		SVGPath: "/x.svg", DefaultPose: "neutral",
		Unlock: domain.AvatarUnlock{
			Kind:  domain.AvatarUnlockStreak,
			Value: "not-a-number",
		},
	}
	_, err := Evaluate(bad, NewContext(l, nil, fixedTime()))
	if !errors.Is(err, ErrInvalidUnlockValue) {
		t.Errorf("attendu ErrInvalidUnlockValue, obtenu %v", err)
	}
}

func TestEvaluate_UnknownUnlockKind(t *testing.T) {
	l := newLearner()
	bad := domain.Avatar{
		ID: "bad", Name: "Bad", Tier: domain.AvatarTierClassic,
		SVGPath: "/x.svg", DefaultPose: "neutral",
		Unlock: domain.AvatarUnlock{Kind: "unknown-kind", Value: "x"},
	}
	_, err := Evaluate(bad, NewContext(l, nil, fixedTime()))
	if !errors.Is(err, ErrUnknownUnlockKind) {
		t.Errorf("attendu ErrUnknownUnlockKind, obtenu %v", err)
	}
}