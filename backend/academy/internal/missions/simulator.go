package missions

import (
	"fmt"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

// SimulatedEvent décrit un événement fictif dans un scénario.
type SimulatedEvent struct {
	Kind    string
	Payload map[string]any

	// At — offset par rapport au début du scénario. Le simulateur
	// l'ajoute à `startAt`.
	At time.Duration
}

// Scenario décrit une séquence d'événements fictifs à rejouer sur un
// Learner pour vérifier que le contenu pédagogique se comporte comme
// attendu.
type Scenario struct {
	Name string

	// InitialState — hook optionnel pour préparer le Learner avant la
	// simulation. Utile pour injecter un niveau, un streak, etc.
	InitialState func(*domain.Learner)

	// Events — séquence ordonnée d'événements fictifs.
	Events []SimulatedEvent

	// ExpectedMissionIDs — missions qui doivent être validées à l'issue
	// de la simulation.
	ExpectedMissionIDs []string
}

// SimulationReport résume le résultat d'une simulation.
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

// Simulator rejoue des scénarios sur un registre de curriculum.
//
// Le Simulator est SANS ÉTAT : chaque simulation part d'un Learner vierge
// (créé par `NewLearner` puis muté par le hook InitialState du scénario).
type Simulator struct {
	registry *curriculum.Registry
}

// NewSimulator construit un simulateur.
func NewSimulator(registry *curriculum.Registry) (*Simulator, error) {
	if registry == nil {
		return nil, ErrNilRegistry
	}
	return &Simulator{registry: registry}, nil
}

// Run exécute un scénario et retourne un rapport.
//
// Chaque événement du scénario est traité par un Orchestrator interne
// (construit sans bus, en mode traitement direct). Les missions validées
// sont marquées comme complétées dans le Learner pour éviter les
// doublons sur les événements suivants.
func (s *Simulator) Run(scenario Scenario, startAt time.Time) SimulationReport {
	report := SimulationReport{
		ScenarioName: scenario.Name,
		Expected:     append([]string{}, scenario.ExpectedMissionIDs...),
	}
	start := time.Now()

	if startAt.IsZero() {
		startAt = time.Now().UTC()
	}

	// Learner vierge.
	learner := domain.NewLearner("sim-learner", "Simulateur", "sim@example.com")
	learner.LastActivityAt = startAt
	if scenario.InitialState != nil {
		scenario.InitialState(learner)
	}

	// Orchestrator en mode direct (sans bus).
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
			// Marque comme complétée pour les événements suivants.
			mp := learner.MissionProgress[vm.Mission.ID]
			mp.MissionID = vm.Mission.ID
			mp.Status = domain.MissionStatusCompleted
			learner.MissionProgress[vm.Mission.ID] = mp
		}
	}

	// Comparaison avec les attentes.
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

// RunAll exécute une série de scénarios.
func (s *Simulator) RunAll(scenarios []Scenario, startAt time.Time) []SimulationReport {
	out := make([]SimulationReport, 0, len(scenarios))
	for _, sc := range scenarios {
		out = append(out, s.Run(sc, startAt))
	}
	return out
}