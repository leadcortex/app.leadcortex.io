// backend/academy/internal/missions/orchestrator.go

package missions

import (
	"context"
	"fmt"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

type ValidatedMission struct {
	Mission domain.Mission

	LessonID string

	Event BusinessEvent

	At time.Time
}

type Orchestrator struct {
	registry *curriculum.Registry
	bus      *EventBus
}

func NewOrchestrator(registry *curriculum.Registry, bus *EventBus) (*Orchestrator, error) {
	if registry == nil {
		return nil, ErrNilRegistry
	}
	return &Orchestrator{registry: registry, bus: bus}, nil
}

func (o *Orchestrator) Registry() *curriculum.Registry { return o.registry }

func (o *Orchestrator) Bus() *EventBus { return o.bus }


func (o *Orchestrator) Process(
	learner *domain.Learner,
	event BusinessEvent,
) ([]ValidatedMission, error) {
	if learner == nil {
		return nil, ErrNilLearner
	}
	if event == nil {
		return nil, fmt.Errorf("%w : nil", ErrInvalidEvent)
	}

	at := event.At()
	if at.IsZero() {
		at = time.Now().UTC()
	}

	var validated []ValidatedMission
	for _, lesson := range o.registry.AllLessons() {
		for _, block := range lesson.Blocks {
			mb, ok := block.(domain.MissionBlock)
			if !ok {
				continue
			}
			mission := mb.Mission
			if mp, ok := learner.MissionProgress[mission.ID]; ok {
				if mp.Status == domain.MissionStatusCompleted {
					continue
				}
			}
			if mission.Validation.Trigger == "" {
				continue
			}
			ok, err := ValidateMission(&mission, learner, event)
			if err != nil {
				return nil, fmt.Errorf("validation %s : %w", mission.ID, err)
			}
			if !ok {
				continue
			}
			validated = append(validated, ValidatedMission{
				Mission:  mission,
				LessonID: lesson.ID,
				Event:    event,
				At:       at,
			})
		}
	}
	return validated, nil
}


type Handler func(learner *domain.Learner, event BusinessEvent, validated []ValidatedMission)

func (o *Orchestrator) Run(
	ctx context.Context,
	learner *domain.Learner,
	handler Handler,
) error {
	if o.bus == nil {
		return fmt.Errorf("%w : pas de bus configuré", ErrInvalidEvent)
	}
	if learner == nil {
		return ErrNilLearner
	}
	if handler == nil {
		return fmt.Errorf("%w : handler nil", ErrInvalidEvent)
	}

	ch, err := o.bus.SubscribeAll()
	if err != nil {
		return err
	}

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case ev, ok := <-ch:
			if !ok {
				return nil
			}
			validated, err := o.Process(learner, ev)
			if err != nil {
				continue
			}
			if len(validated) == 0 {
				continue
			}
			handler(learner, ev, validated)
		}
	}
}


func (o *Orchestrator) findMission(missionID string) (*domain.Mission, string, error) {
	for _, lesson := range o.registry.AllLessons() {
		for _, block := range lesson.Blocks {
			mb, ok := block.(domain.MissionBlock)
			if !ok {
				continue
			}
			if mb.Mission.ID == missionID {
				m := mb.Mission
				return &m, lesson.ID, nil
			}
		}
	}
	return nil, "", fmt.Errorf("%w : %s", ErrUnknownMission, missionID)
}

func (o *Orchestrator) AllMissions() []ValidatedMission {
	var out []ValidatedMission
	for _, lesson := range o.registry.AllLessons() {
		for _, block := range lesson.Blocks {
			mb, ok := block.(domain.MissionBlock)
			if !ok {
				continue
			}
			out = append(out, ValidatedMission{
				Mission:  mb.Mission,
				LessonID: lesson.ID,
			})
		}
	}
	return out
}

func (o *Orchestrator) PendingMissions(learner *domain.Learner) []ValidatedMission {
	if learner == nil {
		return nil
	}
	var out []ValidatedMission
	for _, lesson := range o.registry.AllLessons() {
		for _, block := range lesson.Blocks {
			mb, ok := block.(domain.MissionBlock)
			if !ok {
				continue
			}
			mission := mb.Mission
			if mp, ok := learner.MissionProgress[mission.ID]; ok {
				if mp.Status == domain.MissionStatusCompleted {
					continue
				}
			}
			out = append(out, ValidatedMission{
				Mission:  mission,
				LessonID: lesson.ID,
			})
		}
	}
	return out
}