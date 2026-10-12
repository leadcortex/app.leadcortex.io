package missions

import (
	"errors"
	"testing"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

func fixedTime() time.Time {
	return time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
}

func newLearner() *domain.Learner {
	return domain.NewLearner("u-test", "Test", "t@example.com")
}

/* ─── triggerMatches ──────────────────────────────────────────────────── */

func TestTriggerMatches(t *testing.T) {
	cases := []struct {
		trigger string
		event   string
		want    bool
	}{
		{"lead.created", "lead.created", true},
		{"lead.created", "lead.updated", false},
		{"", "lead.created", false}, // trigger vide : pas de matching par événement
		{"a", "a", true},
	}
	for _, c := range cases {
		got := triggerMatches(c.trigger, c.event)
		if got != c.want {
			t.Errorf("triggerMatches(%q, %q) = %v, attendu %v",
				c.trigger, c.event, got, c.want)
		}
	}
}

/* ─── flattenPayload ──────────────────────────────────────────────────── */

func TestFlattenPayload_Empty(t *testing.T) {
	out := flattenPayload(nil)
	if len(out) != 0 {
		t.Errorf("nil : attendu map vide, obtenu %v", out)
	}
	out = flattenPayload(map[string]any{})
	if len(out) != 0 {
		t.Errorf("vide : attendu map vide, obtenu %v", out)
	}
}

func TestFlattenPayload_Flat(t *testing.T) {
	in := map[string]any{
		"score":   8,
		"country": "FR",
	}
	out := flattenPayload(in)
	if out["score"] != 8 {
		t.Errorf("score : attendu 8, obtenu %v", out["score"])
	}
	if out["country"] != "FR" {
		t.Errorf("country : attendu FR, obtenu %v", out["country"])
	}
}

func TestFlattenPayload_Nested(t *testing.T) {
	in := map[string]any{
		"lead": map[string]any{
			"score":   8,
			"country": "FR",
			"company": map[string]any{
				"name": "Acme",
			},
		},
	}
	out := flattenPayload(in)
	if out["lead.score"] != 8 {
		t.Errorf("lead.score : attendu 8, obtenu %v", out["lead.score"])
	}
	if out["lead.country"] != "FR" {
		t.Errorf("lead.country : attendu FR, obtenu %v", out["lead.country"])
	}
	if out["lead.company.name"] != "Acme" {
		t.Errorf("lead.company.name : attendu Acme, obtenu %v", out["lead.company.name"])
	}
}

func TestFlattenPayload_Slice(t *testing.T) {
	in := map[string]any{
		"tags": []string{"a", "b"},
	}
	out := flattenPayload(in)
	tags, ok := out["tags"].([]string)
	if !ok || len(tags) != 2 {
		t.Errorf("tags : attendu [a b], obtenu %v", out["tags"])
	}
}

/* ─── ValidateMission ─────────────────────────────────────────────────── */

func testMission() *domain.Mission {
	return &domain.Mission{
		ID:       "m-l1",
		LessonID: "l1",
		Title:    "Mission Test",
		BriefMD:  "brief",
		Target: domain.MissionTarget{
			Route: "/app/leads/new",
			CTA:   "Créer",
		},
		Validation: domain.MissionValidation{
			Trigger: "lead.created",
			Conditions: domain.ConditionGroup{
				All: []domain.Condition{
					{Path: "lead.score", Op: domain.OpGreaterThanEqual, Value: 7},
				},
			},
		},
		OnSuccess: domain.MissionOnSuccess{XP: 50},
		OnFailure: domain.MissionOnFailure{FeedbackMD: "Raté"},
	}
}

func TestValidateMission_TriggerAndConditionMatch(t *testing.T) {
	l := newLearner()
	m := testMission()
	ev := NewEvent("lead.created", fixedTime(), map[string]any{
		"lead": map[string]any{"score": 8},
	})

	ok, err := ValidateMission(m, l, ev)
	if err != nil {
		t.Fatalf("ValidateMission : %v", err)
	}
	if !ok {
		t.Error("attendu : mission validée")
	}
}

func TestValidateMission_TriggerMismatch(t *testing.T) {
	l := newLearner()
	m := testMission()
	ev := NewEvent("company.viewed", fixedTime(), map[string]any{
		"lead": map[string]any{"score": 8},
	})

	ok, err := ValidateMission(m, l, ev)
	if err != nil {
		t.Fatalf("ValidateMission : %v", err)
	}
	if ok {
		t.Error("trigger mismatch : attendu false")
	}
}

func TestValidateMission_ConditionNotMet(t *testing.T) {
	l := newLearner()
	m := testMission()
	ev := NewEvent("lead.created", fixedTime(), map[string]any{
		"lead": map[string]any{"score": 3}, // < 7
	})

	ok, err := ValidateMission(m, l, ev)
	if err != nil {
		t.Fatalf("ValidateMission : %v", err)
	}
	if ok {
		t.Error("condition non satisfaite : attendu false")
	}
}

func TestValidateMission_EmptyTrigger(t *testing.T) {
	l := newLearner()
	m := testMission()
	m.Validation.Trigger = "" // vide
	ev := NewEvent("lead.created", fixedTime(), map[string]any{
		"lead": map[string]any{"score": 8},
	})

	ok, err := ValidateMission(m, l, ev)
	if err != nil {
		t.Fatalf("ValidateMission : %v", err)
	}
	if ok {
		t.Error("trigger vide : la mission ne doit PAS être validée par événement")
	}
}

func TestValidateMission_EmptyConditions(t *testing.T) {
	l := newLearner()
	m := testMission()
	m.Validation.Conditions = domain.ConditionGroup{} // aucune contrainte

	ev := NewEvent("lead.created", fixedTime(), nil)

	ok, err := ValidateMission(m, l, ev)
	if err != nil {
		t.Fatalf("ValidateMission : %v", err)
	}
	if !ok {
		t.Error("conditions vides + trigger ok : attendu true")
	}
}

func TestValidateMission_NilMission(t *testing.T) {
	l := newLearner()
	ev := NewEvent("lead.created", fixedTime(), nil)

	_, err := ValidateMission(nil, l, ev)
	if !errors.Is(err, ErrUnknownMission) {
		t.Errorf("attendu ErrUnknownMission, obtenu %v", err)
	}
}

func TestValidateMission_NilLearner(t *testing.T) {
	m := testMission()
	ev := NewEvent("lead.created", fixedTime(), nil)

	_, err := ValidateMission(m, nil, ev)
	if !errors.Is(err, ErrNilLearner) {
		t.Errorf("attendu ErrNilLearner, obtenu %v", err)
	}
}

func TestValidateMission_NilEvent(t *testing.T) {
	l := newLearner()
	m := testMission()

	_, err := ValidateMission(m, l, nil)
	if err == nil {
		t.Fatal("attendu une erreur pour event nil")
	}
}

/* ─── Évaluation avec condition sur learner.* ─────────────────────────── */

func TestValidateMission_LearnerCondition(t *testing.T) {
	l := newLearner()
	l.XP = 500

	m := testMission()
	m.Validation.Conditions = domain.ConditionGroup{
		All: []domain.Condition{
			{Path: "learner.xp", Op: domain.OpGreaterThanEqual, Value: 100},
		},
	}
	ev := NewEvent("lead.created", fixedTime(), nil)

	ok, err := ValidateMission(m, l, ev)
	if err != nil {
		t.Fatalf("ValidateMission : %v", err)
	}
	if !ok {
		t.Error("learner.xp >= 100 : attendu true")
	}
}

/* ─── Context injecté ─────────────────────────────────────────────────── */

func TestBuildValidationContext_InjectsEventMeta(t *testing.T) {
	l := newLearner()
	at := time.Date(2026, 3, 1, 12, 0, 0, 0, time.UTC)
	ev := NewEvent("lead.created", at, map[string]any{"score": 8})

	ctx := buildValidationContext(l, ev)
	if ctx.Values["event.kind"] != "lead.created" {
		t.Errorf("event.kind : attendu lead.created, obtenu %v", ctx.Values["event.kind"])
	}
	if ctx.Values["event.at"] != at.Format(time.RFC3339) {
		t.Errorf("event.at : attendu %s, obtenu %v",
			at.Format(time.RFC3339), ctx.Values["event.at"])
	}
	if ctx.Values["score"] != 8 {
		t.Errorf("score : attendu 8, obtenu %v", ctx.Values["score"])
	}
}