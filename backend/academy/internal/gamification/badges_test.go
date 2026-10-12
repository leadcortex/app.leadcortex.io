package gamification

import (
	"testing"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

func badgeFixture(id string, group domain.ConditionGroup) *domain.Badge {
	return &domain.Badge{
		ID:          id,
		Name:        "Test " + id,
		Description: "Badge de test",
		Icon:        "star",
		Color:       "#3186FF",
		Category:    domain.BadgeCategoryProgress,
		Rarity:      domain.BadgeRarityCommon,
		Condition:   group,
	}
}

func testRegistry(t *testing.T, badges ...*domain.Badge) *curriculum.Registry {
	t.Helper()
	return curriculum.NewRegistry(nil, nil, badges)
}

func TestEvaluateAndAwardBadges_NewBadge(t *testing.T) {
	l := learnerWith(func(l *domain.Learner) {
		l.LessonProgress["l1"] = domain.LessonProgress{
			LessonID: "l1",
			Status:   domain.LessonStatusCompleted,
		}
	})

	badge := badgeFixture("first-lesson", domain.ConditionGroup{
		All: []domain.Condition{
			{Path: "learner.lessons_completed", Op: domain.OpGreaterThanEqual, Value: 1},
		},
	})
	reg := testRegistry(t, badge)
	ctx := NewContext(l, fixedTime())

	awards := EvaluateAndAwardBadges(l, reg, ctx)
	if len(awards) != 1 {
		t.Fatalf("attendu 1 award, obtenu %d", len(awards))
	}
	if awards[0].BadgeID != "first-lesson" {
		t.Errorf("BadgeID : attendu first-lesson, obtenu %s", awards[0].BadgeID)
	}
}

func TestEvaluateAndAwardBadges_AlreadyEarned(t *testing.T) {
	l := learnerWith(func(l *domain.Learner) {
		l.LessonProgress["l1"] = domain.LessonProgress{
			LessonID: "l1",
			Status:   domain.LessonStatusCompleted,
		}
		l.EarnedBadges = append(l.EarnedBadges, domain.BadgeEarned{
			BadgeID:  "first-lesson",
			EarnedAt: fixedTime(),
		})
	})

	badge := badgeFixture("first-lesson", domain.ConditionGroup{
		All: []domain.Condition{
			{Path: "learner.lessons_completed", Op: domain.OpGreaterThanEqual, Value: 1},
		},
	})
	reg := testRegistry(t, badge)

	awards := EvaluateAndAwardBadges(l, reg, NewContext(l, fixedTime()))
	if len(awards) != 0 {
		t.Errorf("attendu 0 award (déjà obtenu), obtenu %d", len(awards))
	}
}

func TestEvaluateAndAwardBadges_ConditionNotMet(t *testing.T) {
	l := learnerWith(nil) // 0 leçons complétées
	badge := badgeFixture("first-lesson", domain.ConditionGroup{
		All: []domain.Condition{
			{Path: "learner.lessons_completed", Op: domain.OpGreaterThanEqual, Value: 1},
		},
	})
	reg := testRegistry(t, badge)

	awards := EvaluateAndAwardBadges(l, reg, NewContext(l, fixedTime()))
	if len(awards) != 0 {
		t.Errorf("attendu 0 award, obtenu %d", len(awards))
	}
}

func TestEvaluateAndAwardBadges_EmptyCondition_Skipped(t *testing.T) {
	l := learnerWith(nil)
	// Badge sans condition → ignoré.
	badge := badgeFixture("no-condition", domain.ConditionGroup{})
	reg := testRegistry(t, badge)

	awards := EvaluateAndAwardBadges(l, reg, NewContext(l, fixedTime()))
	if len(awards) != 0 {
		t.Errorf("badge sans condition : attendu 0 award, obtenu %d", len(awards))
	}
}

func TestEvaluateAndAwardBadges_MultipleBadges(t *testing.T) {
	l := learnerWith(func(l *domain.Learner) {
		l.XP = 500
		l.Level = 4
		l.LessonProgress["l1"] = domain.LessonProgress{
			LessonID: "l1", Status: domain.LessonStatusCompleted,
		}
	})

	b1 := badgeFixture("xp-100", domain.ConditionGroup{
		All: []domain.Condition{{Path: "learner.xp", Op: domain.OpGreaterThanEqual, Value: 100}},
	})
	b2 := badgeFixture("level-3", domain.ConditionGroup{
		All: []domain.Condition{{Path: "learner.level", Op: domain.OpGreaterThanEqual, Value: 3}},
	})
	b3 := badgeFixture("streak-10", domain.ConditionGroup{
		All: []domain.Condition{{Path: "learner.streak_days", Op: domain.OpGreaterThanEqual, Value: 10}},
	})
	reg := testRegistry(t, b1, b2, b3)

	awards := EvaluateAndAwardBadges(l, reg, NewContext(l, fixedTime()))
	if len(awards) != 2 {
		t.Fatalf("attendu 2 awards (b1 + b2), obtenu %d", len(awards))
	}
}

func TestApplyBadgeAwards(t *testing.T) {
	l := learnerWith(nil)
	now := fixedTime()
	awards := []BadgeAward{
		{BadgeID: "b1", EarnedAt: now, Condition: "test"},
		{BadgeID: "b2", EarnedAt: now, Condition: "test"},
	}

	added := ApplyBadgeAwards(l, awards)
	if len(added) != 2 {
		t.Fatalf("attendu 2 badges ajoutés, obtenu %d", len(added))
	}
	if len(l.EarnedBadges) != 2 {
		t.Errorf("EarnedBadges : attendu 2, obtenu %d", len(l.EarnedBadges))
	}

	// Idempotent : re-apply ne doit rien ajouter.
	added = ApplyBadgeAwards(l, awards)
	if len(added) != 0 {
		t.Errorf("re-apply : attendu 0, obtenu %d", len(added))
	}
}

func TestHasBadge(t *testing.T) {
	l := learnerWith(func(l *domain.Learner) {
		l.EarnedBadges = append(l.EarnedBadges, domain.BadgeEarned{
			BadgeID:  "b1",
			EarnedAt: time.Now().UTC(),
		})
	})
	if !HasBadge(l, "b1") {
		t.Error("b1 devrait être possédé")
	}
	if HasBadge(l, "b2") {
		t.Error("b2 ne devrait pas être possédé")
	}
	if HasBadge(nil, "b1") {
		t.Error("learner nil : attendu false")
	}
}

func TestEvaluateAndAwardBadges_NilInputs(t *testing.T) {
	// Learner nil → rien.
	if awards := EvaluateAndAwardBadges(nil, testRegistry(t), NewContext(nil, fixedTime())); awards != nil {
		t.Error("learner nil : attendu nil")
	}
	// Registry nil → rien.
	l := learnerWith(nil)
	if awards := EvaluateAndAwardBadges(l, nil, NewContext(l, fixedTime())); awards != nil {
		t.Error("registry nil : attendu nil")
	}
}