// backend/academy/internal/missions/validator.go

package missions

import (
	"fmt"
	"time"

	"github.com/leadcortex/academy/internal/domain"
	"github.com/leadcortex/academy/internal/gamification"
)

func ValidateMission(
	mission *domain.Mission,
	learner *domain.Learner,
	event BusinessEvent,
) (bool, error) {
	if mission == nil {
		return false, fmt.Errorf("%w : mission nil", ErrUnknownMission)
	}
	if learner == nil {
		return false, ErrNilLearner
	}
	if event == nil {
		return false, fmt.Errorf("%w : nil", ErrInvalidEvent)
	}

	if !triggerMatches(mission.Validation.Trigger, event.Kind()) {
		return false, nil
	}

	ctx := buildValidationContext(learner, event)

	ok, err := gamification.Evaluate(mission.Validation.Conditions, ctx)
	if err != nil {
		return false, fmt.Errorf("mission %s : %w", mission.ID, err)
	}
	return ok, nil
}

func (o *Orchestrator) ValidateMissionByID(
	missionID string,
	learner *domain.Learner,
	event BusinessEvent,
) (bool, error) {
	mission, _, err := o.findMission(missionID)
	if err != nil {
		return false, err
	}
	return ValidateMission(mission, learner, event)
}


func triggerMatches(trigger, eventKind string) bool {
	if trigger == "" {
		return false
	}
	return trigger == eventKind
}

func buildValidationContext(
	learner *domain.Learner,
	event BusinessEvent,
) gamification.Context {
	ctx := gamification.NewContext(learner, event.At())
	for k, v := range flattenPayload(event.Payload()) {
		ctx.Values[k] = v
	}
	ctx.Values["event.kind"] = event.Kind()
	ctx.Values["event.at"] = event.At().Format(time.RFC3339)
	return ctx
}

func flattenPayload(m map[string]any) map[string]any {
	out := make(map[string]any, len(m))
	if len(m) == 0 {
		return out
	}
	var walk func(prefix string, v any)
	walk = func(prefix string, v any) {
		if sub, ok := v.(map[string]any); ok {
			for k, val := range sub {
				key := k
				if prefix != "" {
					key = prefix + "." + k
				}
				walk(key, val)
			}
			return
		}
		out[prefix] = v
	}
	for k, v := range m {
		walk(k, v)
	}
	return out
}