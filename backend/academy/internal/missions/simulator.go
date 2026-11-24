// backend/academy/internal/missions/simulator.go

package missions

import (
	"fmt"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

type SimulatedEvent struct {
	Kind    string
	Payload map[string]any

	At time.Duration
}

type Scenario struct {
	Name string

	InitialState func(*domain.Learner)

	Events []SimulatedEvent

	ExpectedMissionIDs []string
}

type SimulationReport struct {
	ScenarioName      string        `json:"scenario_name"`
	EventsProcessed   int           `json:"events_processed"`
	MissionsValidated []string      `json:"missions_validated"`
	Expected          []string      `json:"expected"`
	Missing           []string      `json:"missing"`
	Unexpected        []string      `json:"unexpected"`
	Passed            bool          `json:"passed"`
	Error             string        `json:"error,omitempty"`
	Duration          time.Duration `json:"duration"`
}

type Simulator struct {
	registry *curriculum.Registry
}

func NewSimulator(registry *curriculum.Registry) (*Simulator, error) {
	if registry == nil {
		return nil, ErrNilRegistry
	}
	return &Simulator{registry: registry}, nil
}

func (s *Simulator) Run(scenario Scenario, startAt time.Time) SimulationReport {
	report := SimulationReport{
		ScenarioName: scenario.Name,
		Expected:     append([]string{}, scenario.ExpectedMissionIDs...),
	}
	start := time.Now()

	if startAt.IsZero() {
		startAt = time.Now().UTC()
	}

	learner := domain.NewLearner("sim-learner", "Simulateur", "sim@example.com")
	learner.LastActivityAt = startAt
	if scenario.InitialState != nil {
		scenario.InitialState(learner)
	}

	orch, err := NewOrchestrator(s.registry, nil)
	if err != nil {
		report.Error = err.Error()
		report.Duration = time.Since(start)
		return report
	}

	validatedSet := map[string]bool{}

	for i, se := range scenario.Events {
		at := startAt.Add(se.At)
		ev := NewEvent(se.Kind, at, se.Payload)

		validated, err := orch.Process(learner, ev)
		if err != nil {
			report.Error = fmt.Sprintf("event %d (%s) : %v", i, se.Kind, err)
			report.Duration = time.Since(start)
			return report
		}
		report.EventsProcessed++
		for _, vm := range validated {
			if validatedSet[vm.Mission.ID] {
				continue
			}
			validatedSet[vm.Mission.ID] = true
			report.MissionsValidated = append(report.MissionsValidated, vm.Mission.ID)
			mp := learner.MissionProgress[vm.Mission.ID]
			mp.MissionID = vm.Mission.ID
			mp.Status = domain.MissionStatusCompleted
			learner.MissionProgress[vm.Mission.ID] = mp
		}
	}

	expectedSet := make(map[string]bool, len(scenario.ExpectedMissionIDs))
	for _, id := range scenario.ExpectedMissionIDs {
		expectedSet[id] = true
	}
	for id := range validatedSet {
		if !expectedSet[id] {
			report.Unexpected = append(report.Unexpected, id)
		}
	}
	for _, id := range scenario.ExpectedMissionIDs {
		if !validatedSet[id] {
			report.Missing = append(report.Missing, id)
		}
	}

	report.Passed = len(report.Missing) == 0 && len(report.Unexpected) == 0
	report.Duration = time.Since(start)
	return report
}

func (s *Simulator) RunAll(scenarios []Scenario, startAt time.Time) []SimulationReport {
	out := make([]SimulationReport, 0, len(scenarios))
	for _, sc := range scenarios {
		out = append(out, s.Run(sc, startAt))
	}
	return out
}