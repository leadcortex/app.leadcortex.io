package missions

import (
	"errors"
	"testing"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

func TestNewSimulator_NilRegistry(t *testing.T) {
	_, err := NewSimulator(nil)
	if !errors.Is(err, ErrNilRegistry) {
		t.Errorf("attendu ErrNilRegistry, obtenu %v", err)
	}
}

func TestSimulator_Passed(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	sim, _ := NewSimulator(reg)

	sc := Scenario{
		Name: "Création d'un lead scoré",
		Events: []SimulatedEvent{
			{
				Kind:    "lead.created",
				Payload: map[string]any{"lead": map[string]any{"score": 8}},
			},
		},
		ExpectedMissionIDs: []string{"m1"},
	}

	report := sim.Run(sc, fixedTime())
	if !report.Passed {
		t.Errorf("attendu passed, obtenu %+v", report)
	}
	if len(report.MissionsValidated) != 1 || report.MissionsValidated[0] != "m1" {
		t.Errorf("MissionsValidated : attendu [m1], obtenu %v", report.MissionsValidated)
	}
	if report.EventsProcessed != 1 {
		t.Errorf("EventsProcessed : attendu 1, obtenu %d", report.EventsProcessed)
	}
}

func TestSimulator_ConditionNotMet_Missing(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	sim, _ := NewSimulator(reg)

	sc := Scenario{
		Name: "Score trop bas",
		Events: []SimulatedEvent{
			{
				Kind:    "lead.created",
				Payload: map[string]any{"lead": map[string]any{"score": 3}},
			},
		},
		ExpectedMissionIDs: []string{"m1"},
	}

	report := sim.Run(sc, fixedTime())
	if report.Passed {
		t.Errorf("attendu non-passed, obtenu %+v", report)
	}
	if len(report.Missing) != 1 || report.Missing[0] != "m1" {
		t.Errorf("Missing : attendu [m1], obtenu %v", report.Missing)
	}
}

func TestSimulator_Unexpected(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	sim, _ := NewSimulator(reg)

	sc := Scenario{
		Name: "Match non attendu",
		Events: []SimulatedEvent{
			{
				Kind:    "lead.created",
				Payload: map[string]any{"lead": map[string]any{"score": 8}},
			},
		},
		// Aucune mission attendue, mais m1 va matcher → Unexpected.
		ExpectedMissionIDs: []string{},
	}

	report := sim.Run(sc, fixedTime())
	if report.Passed {
		t.Error("attendu non-passed (unexpected)")
	}
	if len(report.Unexpected) != 1 || report.Unexpected[0] != "m1" {
		t.Errorf("Unexpected : attendu [m1], obtenu %v", report.Unexpected)
	}
}

func TestSimulator_MultipleEvents(t *testing.T) {
	reg := newTestRegistry(t,
		testMissionBlock("m1", "lead.created", 7),
		testMissionBlock("m2", "email.sent", 0),
	)
	sim, _ := NewSimulator(reg)

	sc := Scenario{
		Name: "Séquence complète",
		Events: []SimulatedEvent{
			{
				Kind:    "lead.created",
				Payload: map[string]any{"lead": map[string]any{"score": 8}},
			},
			{
				Kind:    "email.sent",
				Payload: map[string]any{},
			},
		},
		ExpectedMissionIDs: []string{"m1", "m2"},
	}

	report := sim.Run(sc, fixedTime())
	if !report.Passed {
		t.Errorf("attendu passed, obtenu %+v", report)
	}
	if report.EventsProcessed != 2 {
		t.Errorf("EventsProcessed : attendu 2, obtenu %d", report.EventsProcessed)
	}
	if len(report.MissionsValidated) != 2 {
		t.Errorf("MissionsValidated : attendu 2, obtenu %d", len(report.MissionsValidated))
	}
}

func TestSimulator_DeduplicatesRepeats(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	sim, _ := NewSimulator(reg)

	// Deux événements qui matchent la même mission.
	sc := Scenario{
		Name: "Événements dupliqués",
		Events: []SimulatedEvent{
			{Kind: "lead.created", Payload: map[string]any{"lead": map[string]any{"score": 8}}},
			{Kind: "lead.created", Payload: map[string]any{"lead": map[string]any{"score": 9}}},
		},
		ExpectedMissionIDs: []string{"m1"},
	}

	report := sim.Run(sc, fixedTime())
	if !report.Passed {
		t.Errorf("attendu passed, obtenu %+v", report)
	}
	// m1 ne doit apparaître qu'une fois.
	if len(report.MissionsValidated) != 1 {
		t.Errorf("attendu 1, obtenu %d", len(report.MissionsValidated))
	}
}

func TestSimulator_InitialState(t *testing.T) {
	// Mission dont la condition porte sur le niveau du Learner.
	missionWithLevel := domain.MissionBlock{
		Mission: domain.Mission{
			ID: "m-level", LessonID: "l1", Title: "M", BriefMD: "b",
			Target: domain.MissionTarget{Route: "/app", CTA: "Go"},
			Validation: domain.MissionValidation{
				Trigger: "level.check",
				Conditions: domain.ConditionGroup{
					All: []domain.Condition{
						{Path: "learner.level", Op: domain.OpGreaterThanEqual, Value: 5},
					},
				},
			},
			OnSuccess: domain.MissionOnSuccess{XP: 10},
			OnFailure: domain.MissionOnFailure{FeedbackMD: "b"},
		},
	}
	reg := newTestRegistry(t, missionWithLevel)
	sim, _ := NewSimulator(reg)

	sc := Scenario{
		Name: "Initial state injecte le niveau",
		InitialState: func(l *domain.Learner) {
			l.Level = 10
		},
		Events: []SimulatedEvent{
			{Kind: "level.check", Payload: map[string]any{}},
		},
		ExpectedMissionIDs: []string{"m-level"},
	}

	report := sim.Run(sc, fixedTime())
	if !report.Passed {
		t.Errorf("attendu passed, obtenu %+v", report)
	}
}

func TestSimulator_AtOffset(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	sim, _ := NewSimulator(reg)

	start := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	sc := Scenario{
		Name: "Offsets temporels",
		Events: []SimulatedEvent{
			{Kind: "lead.created", Payload: map[string]any{"lead": map[string]any{"score": 8}},
				At: 0},
			{Kind: "lead.created", Payload: map[string]any{"lead": map[string]any{"score": 9}},
				At: 24 * time.Hour},
		},
		ExpectedMissionIDs: []string{"m1"},
	}

	report := sim.Run(sc, start)
	if !report.Passed {
		t.Errorf("attendu passed, obtenu %+v", report)
	}
}

func TestSimulator_RunAll(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	sim, _ := NewSimulator(reg)

	scenarios := []Scenario{
		{
			Name: "OK",
			Events: []SimulatedEvent{
				{Kind: "lead.created", Payload: map[string]any{"lead": map[string]any{"score": 8}}},
			},
			ExpectedMissionIDs: []string{"m1"},
		},
		{
			Name: "KO",
			Events: []SimulatedEvent{
				{Kind: "lead.created", Payload: map[string]any{"lead": map[string]any{"score": 2}}},
			},
			ExpectedMissionIDs: []string{"m1"},
		},
	}

	reports := sim.RunAll(scenarios, fixedTime())
	if len(reports) != 2 {
		t.Fatalf("attendu 2 rapports, obtenu %d", len(reports))
	}
	if !reports[0].Passed {
		t.Errorf("scénario 0 devrait passer : %+v", reports[0])
	}
	if reports[1].Passed {
		t.Errorf("scénario 1 ne devrait pas passer : %+v", reports[1])
	}
}

func TestSimulator_ReportHasDuration(t *testing.T) {
	reg := newTestRegistry(t, testMissionBlock("m1", "lead.created", 7))
	sim, _ := NewSimulator(reg)

	sc := Scenario{
		Name:   "Durée",
		Events: []SimulatedEvent{},
	}
	report := sim.Run(sc, fixedTime())
	if report.Duration <= 0 {
		t.Errorf("Duration devrait être > 0, obtenu %v", report.Duration)
	}
	if report.ScenarioName != "Durée" {
		t.Errorf("ScenarioName : attendu Durée, obtenu %s", report.ScenarioName)
	}
}