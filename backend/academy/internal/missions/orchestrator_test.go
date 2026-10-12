package missions

import (
	"context"
	"errors"
	"sync/atomic"
	"testing"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

/* ─── Fixtures ────────────────────────────────────────────────────────── */

// testMissionBlock construit un MissionBlock standard.
func testMissionBlock(id, trigger string, minScore int) domain.MissionBlock {
	return domain.MissionBlock{
		Mission: domain.Mission{
			ID:       id,
			LessonID: "l1",
			Title:    "Mission " + id,
			BriefMD:  "b",
			Target: domain.MissionTarget{
				Route: "/app/leads/new",
				CTA:   "Créer",
			},
			Validation: domain.MissionValidation{
				Trigger: trigger,
				Conditions: domain.ConditionGroup{
					All: []domain.Condition{
						{Path: "lead.score", Op: domain.OpGreaterThanEqual, Value: minScore},
					},
				},
			},
			OnSuccess: domain.MissionOnSuccess{XP: 50},
			OnFailure: domain.MissionOnFailure{FeedbackMD: "Raté"},
		},
	}
}

// newTestRegistry construit un registre avec une seule leçon contenant
// plusieurs missions.
func newTestRegistry(t *testing.T, missions ...domain.MissionBlock) *curriculum.Registry {
	t.Helper()
	blocks := []domain.Block{
		domain.CoverBlock{Title: "C", Objectives: []string{"o"}},
	}
	for _, m := range missions {
		blocks = append(blocks, m)
	}
	blocks = append(blocks, domain.DebriefBlock{
		Sections: []domain.DebriefSection{domain.DebriefScoreBreakdown},
	})

	lesson := domain.Lesson{
		ID: "l1", ModuleID: "m1", Order: 1, Title: "L1",
		DurationMin: 5, Difficulty: 1, XPTotal: 100,
		Blocks: blocks,
	}
	program := &domain.Program{
		ID: "p1", Order: 1, Title: "P1", Difficulty: 1,
		Modules: []domain.Module{
			{ID: "m1", ProgramID: "p1", Order: 1, Title: "M1",
				Lessons: []domain.Lesson{lesson}},
		},
	}
	return curriculum.NewRegistry([]*domain.Program{program}, nil, nil)
}

/* ─── Constructeur ────────────────────────────────────────────────────── */

func TestNewOrchestrator_NilRegistry(t *testing.T) {
	_, err := NewOrchestrator(nil, nil)
	if !errors.Is(err, ErrNilRegistry) {
		t.Errorf("attendu ErrNilRegistry, obtenu %v", err)
	}
}

func TestNewOrchestrator_NoBus(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	o, err := NewOrchestrator(reg, nil)
	if err != nil {
		t.Fatalf("NewOrchestrator : %v", err)
	}
	if o.Bus() != nil {
		t.Error("Bus devrait être nil")
	}
}

/* ─── Process ─────────────────────────────────────────────────────────── */

func TestProcess_NoMatch(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	o, _ := NewOrchestrator(reg, nil)
	l := newLearner()

	// Score trop bas.
	ev := NewEvent("lead.created", fixedTime(),
		map[string]any{"lead": map[string]any{"score": 3}})
	validated, err := o.Process(l, ev)
	if err != nil {
		t.Fatalf("Process : %v", err)
	}
	if len(validated) != 0 {
		t.Errorf("attendu 0, obtenu %d", len(validated))
	}
}

func TestProcess_Matches(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	o, _ := NewOrchestrator(reg, nil)
	l := newLearner()

	ev := NewEvent("lead.created", fixedTime(),
		map[string]any{"lead": map[string]any{"score": 8}})
	validated, err := o.Process(l, ev)
	if err != nil {
		t.Fatalf("Process : %v", err)
	}
	if len(validated) != 1 {
		t.Fatalf("attendu 1, obtenu %d", len(validated))
	}
	if validated[0].Mission.ID != "m1" {
		t.Errorf("Mission.ID : attendu m1, obtenu %s", validated[0].Mission.ID)
	}
	if validated[0].LessonID != "l1" {
		t.Errorf("LessonID : attendu l1, obtenu %s", validated[0].LessonID)
	}
}

func TestProcess_SkipsAlreadyCompleted(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	o, _ := NewOrchestrator(reg, nil)
	l := newLearner()
	l.MissionProgress["m1"] = domain.MissionProgress{
		MissionID: "m1",
		Status:    domain.MissionStatusCompleted,
	}

	ev := NewEvent("lead.created", fixedTime(),
		map[string]any{"lead": map[string]any{"score": 8}})
	validated, err := o.Process(l, ev)
	if err != nil {
		t.Fatalf("Process : %v", err)
	}
	if len(validated) != 0 {
		t.Errorf("mission complétée : attendu 0, obtenu %d", len(validated))
	}
}

func TestProcess_MultipleMatches(t *testing.T) {
	reg := newTestRegistry(t,
		testMissionBlock("m1", "lead.created", 7),
		testMissionBlock("m2", "lead.created", 5),
	)
	o, _ := NewOrchestrator(reg, nil)
	l := newLearner()

	ev := NewEvent("lead.created", fixedTime(),
		map[string]any{"lead": map[string]any{"score": 8}})
	validated, err := o.Process(l, ev)
	if err != nil {
		t.Fatalf("Process : %v", err)
	}
	if len(validated) != 2 {
		t.Errorf("attendu 2 missions, obtenu %d", len(validated))
	}
}

func TestProcess_NilLearner(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	o, _ := NewOrchestrator(reg, nil)

	ev := NewEvent("lead.created", fixedTime(), nil)
	_, err := o.Process(nil, ev)
	if !errors.Is(err, ErrNilLearner) {
		t.Errorf("attendu ErrNilLearner, obtenu %v", err)
	}
}

func TestProcess_NilEvent(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	o, _ := NewOrchestrator(reg, nil)
	l := newLearner()

	_, err := o.Process(l, nil)
	if err == nil {
		t.Fatal("attendu une erreur pour event nil")
	}
}

/* ─── AllMissions / PendingMissions ───────────────────────────────────── */

func TestAllMissions(t *testing.T) {
	reg := newTestRegistry(t,
		testMissionBlock("m1", "lead.created", 7),
		testMissionBlock("m2", "email.sent", 0),
	)
	o, _ := NewOrchestrator(reg, nil)

	all := o.AllMissions()
	if len(all) != 2 {
		t.Errorf("attendu 2, obtenu %d", len(all))
	}
}

func TestPendingMissions(t *testing.T) {
	reg := newTestRegistry(t,
		testMissionBlock("m1", "lead.created", 7),
		testMissionBlock("m2", "email.sent", 0),
	)
	o, _ := NewOrchestrator(reg, nil)

	l := newLearner()
	l.MissionProgress["m1"] = domain.MissionProgress{
		MissionID: "m1",
		Status:    domain.MissionStatusCompleted,
	}

	pending := o.PendingMissions(l)
	if len(pending) != 1 {
		t.Fatalf("attendu 1, obtenu %d", len(pending))
	}
	if pending[0].Mission.ID != "m2" {
		t.Errorf("attendu m2, obtenu %s", pending[0].Mission.ID)
	}
}

/* ─── Run ─────────────────────────────────────────────────────────────── */

func TestRun_HandlerCalled(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	bus := NewEventBus()
	defer bus.Close()

	o, err := NewOrchestrator(reg, bus)
	if err != nil {
		t.Fatalf("NewOrchestrator : %v", err)
	}
	l := newLearner()

	var handlerCalls int32
	handler := func(_ *domain.Learner, _ BusinessEvent, validated []ValidatedMission) {
		atomic.AddInt32(&handlerCalls, 1)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Lance la boucle.
	done := make(chan struct{})
	go func() {
		_ = o.Run(ctx, l, handler)
		close(done)
	}()

	// Laisse la boucle s'installer.
	time.Sleep(20 * time.Millisecond)

	// Publie un événement qui matche.
	_ = bus.Publish(NewEvent("lead.created", fixedTime(),
		map[string]any{"lead": map[string]any{"score": 8}}))

	// Attend que le handler soit appelé.
	deadline := time.Now().Add(500 * time.Millisecond)
	for time.Now().Before(deadline) {
		if atomic.LoadInt32(&handlerCalls) > 0 {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	if atomic.LoadInt32(&handlerCalls) == 0 {
		t.Error("handler non appelé")
	}

	cancel()
	<-done
}

func TestRun_ContextCancel(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	bus := NewEventBus()
	o, _ := NewOrchestrator(reg, bus)
	l := newLearner()

	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	go func() {
		done <- o.Run(ctx, l, func(_ *domain.Learner, _ BusinessEvent, _ []ValidatedMission) {})
	}()

	time.Sleep(20 * time.Millisecond)
	cancel()

	select {
	case err := <-done:
		if !errors.Is(err, context.Canceled) {
			t.Errorf("attendu context.Canceled, obtenu %v", err)
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("Run n'a pas terminé après cancel")
	}
	bus.Close()
}

func TestRun_BusClosed(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	bus := NewEventBus()
	o, _ := NewOrchestrator(reg, bus)
	l := newLearner()

	done := make(chan error, 1)
	go func() {
		done <- o.Run(context.Background(), l,
			func(_ *domain.Learner, _ BusinessEvent, _ []ValidatedMission) {})
	}()

	time.Sleep(20 * time.Millisecond)
	bus.Close()

	select {
	case err := <-done:
		// Bus fermé → Run retourne nil (fin normale).
		if err != nil {
			t.Errorf("attendu nil, obtenu %v", err)
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("Run n'a pas terminé après close")
	}
}

func TestRun_NoBus(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	o, _ := NewOrchestrator(reg, nil)
	l := newLearner()

	err := o.Run(context.Background(), l,
		func(_ *domain.Learner, _ BusinessEvent, _ []ValidatedMission) {})
	if err == nil {
		t.Fatal("attendu une erreur (pas de bus)")
	}
}

func TestRun_NilLearner(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	bus := NewEventBus()
	defer bus.Close()
	o, _ := NewOrchestrator(reg, bus)

	err := o.Run(context.Background(), nil,
		func(_ *domain.Learner, _ BusinessEvent, _ []ValidatedMission) {})
	if !errors.Is(err, ErrNilLearner) {
		t.Errorf("attendu ErrNilLearner, obtenu %v", err)
	}
}

func TestRun_NilHandler(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	bus := NewEventBus()
	defer bus.Close()
	o, _ := NewOrchestrator(reg, bus)
	l := newLearner()

	err := o.Run(context.Background(), l, nil)
	if err == nil {
		t.Fatal("attendu une erreur pour handler nil")
	}
}

/* ─── ValidateMissionByID ─────────────────────────────────────────────── */

func TestValidateMissionByID(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	o, _ := NewOrchestrator(reg, nil)
	l := newLearner()

	ev := NewEvent("lead.created", fixedTime(),
		map[string]any{"lead": map[string]any{"score": 8}})

	ok, err := o.ValidateMissionByID("m1", l, ev)
	if err != nil {
		t.Fatalf("ValidateMissionByID : %v", err)
	}
	if !ok {
		t.Error("attendu true")
	}
}

func TestValidateMissionByID_Unknown(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	o, _ := NewOrchestrator(reg, nil)
	l := newLearner()

	ev := NewEvent("lead.created", fixedTime(), nil)
	_, err := o.ValidateMissionByID("unknown", l, ev)
	if !errors.Is(err, ErrUnknownMission) {
		t.Errorf("attendu ErrUnknownMission, obtenu %v", err)
	}
}