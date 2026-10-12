package gamification

import (
	"errors"
	"testing"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

func fixedTime() time.Time {
	return time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
}

func learnerWith(customize func(*domain.Learner)) *domain.Learner {
	l := domain.NewLearner("u-test", "Test", "t@example.com")
	if customize != nil {
		customize(l)
	}
	return l
}

/* ─── ConditionGroup : All / Any / Not ────────────────────────────────── */

func TestEvaluate_EmptyGroup_IsTrue(t *testing.T) {
	ctx := NewContext(learnerWith(nil), fixedTime())
	ok, err := Evaluate(domain.ConditionGroup{}, ctx)
	if err != nil {
		t.Fatalf("Evaluate : %v", err)
	}
	if !ok {
		t.Error("un groupe vide doit être vrai")
	}
}

func TestEvaluate_All(t *testing.T) {
	l := learnerWith(func(l *domain.Learner) { l.XP = 200; l.Level = 2 })
	ctx := NewContext(l, fixedTime())

	group := domain.ConditionGroup{
		All: []domain.Condition{
			{Path: "learner.xp", Op: domain.OpGreaterThanEqual, Value: 100},
			{Path: "learner.level", Op: domain.OpGreaterThanEqual, Value: 2},
		},
	}
	ok, err := Evaluate(group, ctx)
	if err != nil {
		t.Fatalf("Evaluate : %v", err)
	}
	if !ok {
		t.Error("attendu : all=true")
	}

	// Une condition fausse → tout le groupe est faux.
	group.All = append(group.All, domain.Condition{
		Path: "learner.xp", Op: domain.OpGreaterThan, Value: 500,
	})
	ok, _ = Evaluate(group, ctx)
	if ok {
		t.Error("attendu : all=false (une condition échoue)")
	}
}

func TestEvaluate_Any(t *testing.T) {
	l := learnerWith(func(l *domain.Learner) { l.XP = 50; l.StreakDays = 10 })
	ctx := NewContext(l, fixedTime())

	group := domain.ConditionGroup{
		Any: []domain.Condition{
			{Path: "learner.xp", Op: domain.OpGreaterThanEqual, Value: 1000},
			{Path: "learner.streak_days", Op: domain.OpGreaterThanEqual, Value: 7},
		},
	}
	ok, err := Evaluate(group, ctx)
	if err != nil {
		t.Fatalf("Evaluate : %v", err)
	}
	if !ok {
		t.Error("attendu : any=true (le 2e matche)")
	}

	// Aucune ne matche → false.
	group.Any = []domain.Condition{
		{Path: "learner.xp", Op: domain.OpGreaterThanEqual, Value: 1000},
		{Path: "learner.streak_days", Op: domain.OpGreaterThanEqual, Value: 30},
	}
	ok, _ = Evaluate(group, ctx)
	if ok {
		t.Error("attendu : any=false")
	}
}

func TestEvaluate_Not(t *testing.T) {
	l := learnerWith(func(l *domain.Learner) { l.XP = 50 })
	ctx := NewContext(l, fixedTime())

	group := domain.ConditionGroup{
		Not: []domain.Condition{
			{Path: "learner.xp", Op: domain.OpGreaterThan, Value: 1000},
		},
	}
	ok, _ := Evaluate(group, ctx)
	if !ok {
		t.Error("attendu : not=true (la condition n'est pas vraie)")
	}

	group.Not = []domain.Condition{
		{Path: "learner.xp", Op: domain.OpGreaterThanEqual, Value: 50},
	}
	ok, _ = Evaluate(group, ctx)
	if ok {
		t.Error("attendu : not=false (la condition est vraie)")
	}
}

func TestEvaluate_NilLearner(t *testing.T) {
	ctx := Context{Values: map[string]any{}, Now: fixedTime()}
	_, err := Evaluate(domain.ConditionGroup{}, ctx)
	if !errors.Is(err, ErrInvalidContext) {
		t.Errorf("attendu ErrInvalidContext, obtenu %v", err)
	}
}

/* ─── Opérateurs ──────────────────────────────────────────────────────── */

func TestEvaluateOne_AllOperators(t *testing.T) {
	l := learnerWith(func(l *domain.Learner) {
		l.XP = 100
		l.Hearts = 3
		l.StreakDays = 7
	})
	ctx := NewContext(l, fixedTime())

	cases := []struct {
		name string
		c    domain.Condition
		want bool
	}{
		{"eq int", domain.Condition{Path: "learner.xp", Op: domain.OpEqual, Value: 100}, true},
		{"neq int", domain.Condition{Path: "learner.xp", Op: domain.OpNotEqual, Value: 100}, false},
		{"gt int", domain.Condition{Path: "learner.xp", Op: domain.OpGreaterThan, Value: 50}, true},
		{"gte int", domain.Condition{Path: "learner.xp", Op: domain.OpGreaterThanEqual, Value: 100}, true},
		{"lt int", domain.Condition{Path: "learner.xp", Op: domain.OpLessThan, Value: 200}, true},
		{"lte int", domain.Condition{Path: "learner.xp", Op: domain.OpLessThanEqual, Value: 100}, true},
		{"is_empty false", domain.Condition{Path: "learner.xp", Op: domain.OpIsEmpty}, false},
		{"is_not_empty true", domain.Condition{Path: "learner.xp", Op: domain.OpIsNotEmpty}, true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := EvaluateOne(tc.c, ctx)
			if err != nil {
				t.Fatalf("EvaluateOne : %v", err)
			}
			if got != tc.want {
				t.Errorf("got=%v, want=%v", got, tc.want)
			}
		})
	}
}

func TestEvaluateOne_StringOperators(t *testing.T) {
	l := learnerWith(nil)
	ctx := NewContext(l, fixedTime())
	ctx.Values["event.type"] = "mission.succeeded"
	ctx.Values["event.tags"] = []any{"a", "b", "c"}

	cases := []struct {
		name string
		c    domain.Condition
		want bool
	}{
		{"contains", domain.Condition{Path: "event.type", Op: domain.OpContains, Value: "mission"}, true},
		{"not_contains", domain.Condition{Path: "event.type", Op: domain.OpNotContains, Value: "lesson"}, true},
		{"starts_with", domain.Condition{Path: "event.type", Op: domain.OpStartsWith, Value: "mission."}, true},
		{"ends_with", domain.Condition{Path: "event.type", Op: domain.OpEndsWith, Value: ".succeeded"}, true},
		{"matches", domain.Condition{Path: "event.type", Op: domain.OpMatches, Value: `^mission\.`}, true},
		{"length_gte", domain.Condition{Path: "event.tags", Op: domain.OpLengthGTE, Value: 2}, true},
		{"length_lte", domain.Condition{Path: "event.tags", Op: domain.OpLengthLTE, Value: 5}, true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := EvaluateOne(tc.c, ctx)
			if err != nil {
				t.Fatalf("EvaluateOne : %v", err)
			}
			if got != tc.want {
				t.Errorf("got=%v, want=%v", got, tc.want)
			}
		})
	}
}

func TestEvaluateOne_UnknownOperator(t *testing.T) {
	ctx := NewContext(learnerWith(nil), fixedTime())
	_, err := EvaluateOne(domain.Condition{Path: "learner.xp", Op: "nope", Value: 1}, ctx)
	if !errors.Is(err, ErrUnknownOperator) {
		t.Errorf("attendu ErrUnknownOperator, obtenu %v", err)
	}
}

func TestEvaluateOne_UnknownPath(t *testing.T) {
	ctx := NewContext(learnerWith(nil), fixedTime())
	_, err := EvaluateOne(domain.Condition{Path: "unknown.thing", Op: domain.OpEqual, Value: 1}, ctx)
	if !errors.Is(err, ErrUnknownPath) {
		t.Errorf("attendu ErrUnknownPath, obtenu %v", err)
	}
}

/* ─── Chemins du Learner ──────────────────────────────────────────────── */

func TestResolveLearnerPaths(t *testing.T) {
	l := learnerWith(func(l *domain.Learner) {
		l.XP = 150
		l.Level = 2
		l.Hearts = 4
		l.StreakDays = 5
		l.BestStreakDays = 12
		l.UnlockedAvatarIDs = []string{"a", "b"}
		l.EarnedBadges = []domain.BadgeEarned{{BadgeID: "b1"}}
		l.ConceptMastery["c1"] = domain.Mastery{ConceptID: "c1", Level: domain.MasteryMastered}
		l.LessonProgress["l1"] = domain.LessonProgress{LessonID: "l1", Status: domain.LessonStatusCompleted}
		l.LessonProgress["l2"] = domain.LessonProgress{LessonID: "l2", Status: domain.LessonStatusInProgress}
		l.MissionProgress["m1"] = domain.MissionProgress{MissionID: "m1", Status: domain.MissionStatusCompleted}
		l.ProgramProgress["p1"] = domain.ProgramProgress{ProgramID: "p1", CompletedAt: fixedTime()}
	})

	ctx := NewContext(l, fixedTime())

	checks := []struct {
		path string
		op   domain.Operator
		val  any
	}{
		{"learner.id", domain.OpEqual, "u-test"},
		{"learner.xp", domain.OpEqual, 150},
		{"learner.level", domain.OpEqual, 2},
		{"learner.streak_days", domain.OpEqual, 5},
		{"learner.best_streak_days", domain.OpEqual, 12},
		{"learner.hearts", domain.OpEqual, 4},
		{"learner.lessons_completed", domain.OpEqual, 1},
		{"learner.programs_completed", domain.OpEqual, 1},
		{"learner.badges_count", domain.OpEqual, 1},
		{"learner.avatars_count", domain.OpEqual, 2},
		{"learner.concepts_mastered", domain.OpEqual, 1},
		{"learner.missions_completed", domain.OpEqual, 1},
	}
	for _, c := range checks {
		t.Run(c.path, func(t *testing.T) {
			ok, err := EvaluateOne(domain.Condition{Path: c.path, Op: c.op, Value: c.val}, ctx)
			if err != nil {
				t.Fatalf("EvaluateOne(%s) : %v", c.path, err)
			}
			if !ok {
				t.Errorf("%s : attendu true", c.path)
			}
		})
	}
}

/* ─── Contexte (Values libres) ────────────────────────────────────────── */

func TestContext_WithValue(t *testing.T) {
	l := learnerWith(nil)
	ctx := NewContext(l, fixedTime()).WithValue("event.score", 95)

	ok, err := EvaluateOne(domain.Condition{Path: "event.score", Op: domain.OpGreaterThanEqual, Value: 90}, ctx)
	if err != nil {
		t.Fatalf("EvaluateOne : %v", err)
	}
	if !ok {
		t.Error("attendu : event.score >= 90")
	}
}

/* ─── Comparaisons typées ─────────────────────────────────────────────── */

func TestEvaluateOne_BoolComparison(t *testing.T) {
	l := learnerWith(nil)
	ctx := NewContext(l, fixedTime()).WithValue("flag", true)

	ok, err := EvaluateOne(domain.Condition{Path: "flag", Op: domain.OpEqual, Value: true}, ctx)
	if err != nil {
		t.Fatalf("EvaluateOne : %v", err)
	}
	if !ok {
		t.Error("attendu : flag == true")
	}

	ok, _ = EvaluateOne(domain.Condition{Path: "flag", Op: domain.OpNotEqual, Value: true}, ctx)
	if ok {
		t.Error("attendu : flag != true → false")
	}
}

func TestCompare_TypeMismatch(t *testing.T) {
	l := learnerWith(nil)
	ctx := NewContext(l, fixedTime()).WithValue("v", "text")

	_, err := EvaluateOne(domain.Condition{Path: "v", Op: domain.OpGreaterThan, Value: 10}, ctx)
	if err == nil {
		t.Error("attendu : erreur de type")
	}
}