package missions

import (
	"fmt"
	"time"

	"github.com/leadcortex/academy/internal/domain"
	"github.com/leadcortex/academy/internal/gamification"
)

// ValidateMission vérifie si une mission est validée par un événement
// métier donné.
//
// Retourne (true, nil) si la mission doit être marquée comme réussie.
// Retourne (false, nil) si l'événement ne la concerne pas ou si ses
// conditions ne sont pas satisfaites.
//
// Le Learner est utilisé pour évaluer les chemins `learner.*` dans les
// conditions. Il n'est jamais muté.
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

	// 1. Trigger.
	if !triggerMatches(mission.Validation.Trigger, event.Kind()) {
		return false, nil
	}

	// 2. Construire le contexte d'évaluation.
	ctx := buildValidationContext(learner, event)

	// 3. Évaluer les conditions.
	ok, err := gamification.Evaluate(mission.Validation.Conditions, ctx)
	if err != nil {
		return false, fmt.Errorf("mission %s : %w", mission.ID, err)
	}
	return ok, nil
}

// ValidateMissionByID — raccourci via registry.
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

/* ─── Helpers ─────────────────────────────────────────────────────────── */

// triggerMatches renvoie vrai si la mission doit être testée contre cet
// événement.
//
//   - Si le Trigger est vide, la mission N'EST PAS validée par événement :
//     elle relève d'un mécanisme de polling d'état.
//   - Sinon, le Kind doit correspondre exactement.
func triggerMatches(trigger, eventKind string) bool {
	if trigger == "" {
		return false
	}
	return trigger == eventKind
}

// buildValidationContext construit un gamification.Context prêt à
// évaluer les conditions, en injectant :
//   - le Learner ;
//   - le payload aplati (chemins pointés) ;
//   - `event.kind` et `event.at`.
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

// flattenPayload aplatit récursivement une map imbriquée en chemins
// pointés.
//
//	{"lead": {"score": 8, "country": "FR"}}
//	→ {"lead.score": 8, "lead.country": "FR"}
//
// Les valeurs non-map (scalaires, slices, booléens…) sont conservées
// telles quelles.
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