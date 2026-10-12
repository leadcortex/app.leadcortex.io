package adaptivity

import (
	"errors"
	"testing"

	"github.com/leadcortex/academy/internal/domain"
)

/* ─── Erreurs ─────────────────────────────────────────────────────────── */

func TestPlanSession_NilLearner(t *testing.T) {
	_, err := PlanSession(nil, PlanStandard, PlanOptions{Now: fixedTime()})
	if !errors.Is(err, ErrNilLearner) {
		t.Errorf("attendu ErrNilLearner, obtenu %v", err)
	}
}

func TestPlanSession_InvalidMode(t *testing.T) {
	l := newLearner()
	_, err := PlanSession(l, PlanMode("fake"), PlanOptions{Now: fixedTime()})
	if !errors.Is(err, ErrInvalidMode) {
		t.Errorf("attendu ErrInvalidMode, obtenu %v", err)
	}
}

/* ─── PlanMode.IsKnown ────────────────────────────────────────────────── */

func TestPlanMode_IsKnown(t *testing.T) {
	cases := []struct {
		mode PlanMode
		want bool
	}{
		{PlanMicro, true},
		{PlanStandard, true},
		{PlanDeep, true},
		{PlanReviewOnly, true},
		{PlanMode("fake"), false},
		{PlanMode(""), false},
	}
	for _, c := range cases {
		if got := c.mode.IsKnown(); got != c.want {
			t.Errorf("IsKnown(%q) = %v, attendu %v", c.mode, got, c.want)
		}
	}
}

/* ─── Mode : Micro ────────────────────────────────────────────────────── */

func TestPlanSession_Micro(t *testing.T) {
	reg := buildTestRegistry(t)
	l := newLearner()

	plan, err := PlanSession(l, PlanMicro, PlanOptions{
		Now:      fixedTime(),
		Registry: reg,
	})
	if err != nil {
		t.Fatalf("PlanSession : %v", err)
	}
	if plan.Mode != PlanMicro {
		t.Errorf("Mode : attendu micro, obtenu %s", plan.Mode)
	}
	if len(plan.Steps) != 1 {
		t.Errorf("Micro : attendu 1 étape, obtenu %d", len(plan.Steps))
	}
}

/* ─── Mode : Standard ─────────────────────────────────────────────────── */

func TestPlanSession_Standard(t *testing.T) {
	reg := buildTestRegistry(t)
	l := newLearner()
	l.ConceptMastery["c1"] = domain.Mastery{
		ConceptID: "c1", Level: domain.MasteryFragile, Attempts: 3,
	}

	plan, err := PlanSession(l, PlanStandard, PlanOptions{
		Now:      fixedTime(),
		Registry: reg,
	})
	if err != nil {
		t.Fatalf("PlanSession : %v", err)
	}
	if plan.Mode != PlanStandard {
		t.Errorf("Mode : attendu standard, obtenu %s", plan.Mode)
	}
	if len(plan.Steps) == 0 {
		t.Error("Standard : attendu au moins une étape")
	}
}

/* ─── Mode : Deep ─────────────────────────────────────────────────────── */

func TestPlanSession_Deep(t *testing.T) {
	reg := buildTestRegistry(t)
	l := newLearner()
	for i := 0; i < 3; i++ {
		l.ConceptMastery["c"+string(rune('0'+i))] = domain.Mastery{
			ConceptID: "c" + string(rune('0'+i)),
			Level:     domain.MasteryFragile,
			Attempts:  3,
		}
	}

	plan, err := PlanSession(l, PlanDeep, PlanOptions{
		Now:      fixedTime(),
		Registry: reg,
	})
	if err != nil {
		t.Fatalf("PlanSession : %v", err)
	}
	if plan.Mode != PlanDeep {
		t.Errorf("Mode : attendu deep, obtenu %s", plan.Mode)
	}
	if len(plan.Steps) < 2 {
		t.Errorf("Deep : attendu au moins 2 étapes, obtenu %d", len(plan.Steps))
	}
}

/* ─── Mode : ReviewOnly ───────────────────────────────────────────────── */

func TestPlanSession_ReviewOnly(t *testing.T) {
	l := newLearner()
	l.ConceptMastery["c1"] = domain.Mastery{
		ConceptID: "c1", Level: domain.MasteryFragile, Attempts: 3,
	}

	plan, err := PlanSession(l, PlanReviewOnly, PlanOptions{Now: fixedTime()})
	if err != nil {
		t.Fatalf("PlanSession : %v", err)
	}
	if plan.Mode != PlanReviewOnly {
		t.Errorf("Mode : attendu review_only, obtenu %s", plan.Mode)
	}
	if len(plan.Steps) == 0 {
		t.Error("ReviewOnly : attendu au moins une étape")
	}
	// Toutes les étapes doivent être des révisions.
	for _, s := range plan.Steps {
		if s.Kind != RecoReviewConcept {
			t.Errorf("ReviewOnly : étape non-révision : %s", s.Kind)
		}
	}
}

func TestPlanSession_ReviewOnly_NoWeakConcepts(t *testing.T) {
	l := newLearner()
	// Aucun concept fragile.

	plan, err := PlanSession(l, PlanReviewOnly, PlanOptions{Now: fixedTime()})
	if err != nil {
		t.Fatalf("PlanSession : %v", err)
	}
	// Fallback : au moins une étape générique.
	if len(plan.Steps) == 0 {
		t.Error("ReviewOnly sans fragile : attendu fallback")
	}
}

/* ─── Invariants ──────────────────────────────────────────────────────── */

func TestPlanSession_TotalMinutesIsSum(t *testing.T) {
	reg := buildTestRegistry(t)
	l := newLearner()

	for _, mode := range []PlanMode{PlanMicro, PlanStandard, PlanDeep, PlanReviewOnly} {
		plan, err := PlanSession(l, mode, PlanOptions{
			Now:      fixedTime(),
			Registry: reg,
		})
		if err != nil {
			t.Fatalf("%s : %v", mode, err)
		}
		sum := 0
		for _, s := range plan.Steps {
			sum += s.DurationMin
		}
		if plan.TotalMinutes != sum {
			t.Errorf("%s : TotalMinutes=%d, sum des étapes=%d",
				mode, plan.TotalMinutes, sum)
		}
	}
}

func TestPlanSession_StepOrderIsSequential(t *testing.T) {
	reg := buildTestRegistry(t)
	l := newLearner()

	plan, _ := PlanSession(l, PlanDeep, PlanOptions{
		Now:      fixedTime(),
		Registry: reg,
	})
	for i, s := range plan.Steps {
		if s.Order != i+1 {
			t.Errorf("étape %d : Order attendu %d, obtenu %d", i, i+1, s.Order)
		}
	}
}

func TestPlanSession_ReasonNotEmpty(t *testing.T) {
	l := newLearner()
	for _, mode := range []PlanMode{PlanMicro, PlanStandard, PlanDeep, PlanReviewOnly} {
		plan, _ := PlanSession(l, mode, PlanOptions{Now: fixedTime()})
		if plan.Reason == "" {
			t.Errorf("%s : Reason vide", mode)
		}
	}
}