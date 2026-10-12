package missions

import (
	"context"
	"fmt"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

// ValidatedMission décrit une mission qui vient d'être validée par un
// événement métier.
type ValidatedMission struct {
	// Mission — la mission validée (copie).
	Mission domain.Mission

	// LessonID — leçon à laquelle appartient la mission.
	LessonID string

	// Event — événement qui a déclenché la validation.
	Event BusinessEvent

	// At — instant de la validation.
	At time.Time
}

// Orchestrator confronte des événements métier aux missions en attente
// du curriculum.
//
// L'Orchestrator est sans état mutable : il peut être partagé entre
// goroutines. Toutes les opérations sont pures — aucune mutation de
// Learner ou de Registry.
type Orchestrator struct {
	registry *curriculum.Registry
	bus      *EventBus
}

// NewOrchestrator construit un orchestrateur.
//
// Le bus peut être nil : dans ce cas, l'appelant devra invoquer Process
// manuellement (pas de boucle d'écoute).
func NewOrchestrator(registry *curriculum.Registry, bus *EventBus) (*Orchestrator, error) {
	if registry == nil {
		return nil, ErrNilRegistry
	}
	return &Orchestrator{registry: registry, bus: bus}, nil
}

// Registry — accesseur.
func (o *Orchestrator) Registry() *curriculum.Registry { return o.registry }

// Bus — accesseur.
func (o *Orchestrator) Bus() *EventBus { return o.bus }

/* ─── Traitement d'un événement ───────────────────────────────────────── */

// Process confronte un événement à toutes les missions du registre et
// retourne celles qui sont validées.
//
// Une mission est candidate si :
//   - elle porte un Trigger non vide ;
//   - elle n'est pas déjà marquée `completed` dans Learner.MissionProgress.
//
// L'ordre des ValidatedMission suit l'ordre des leçons du registre.
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
			// Skip si déjà réussie.
			if mp, ok := learner.MissionProgress[mission.ID]; ok {
				if mp.Status == domain.MissionStatusCompleted {
					continue
				}
			}
			// Skip si pas de trigger.
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

/* ─── Boucle d'écoute ─────────────────────────────────────────────────── */

// Handler est la signature d'un callback invoqué pour chaque ensemble de
// missions validées par un même événement.
//
// L'appelant (typiquement l'API HTTP) est responsable de :
//   - appliquer les conséquences sur le Learner (via progress.Engine) ;
//   - déclencher les notifications UI.
type Handler func(learner *domain.Learner, event BusinessEvent, validated []ValidatedMission)

// Run démarre la boucle d'écoute sur le bus. Bloque jusqu'à ce que ctx
// soit annulé ou que le bus soit fermé.
//
// `learner` est utilisé en lecture seule : le Handler ne doit PAS muter
// le Learner directement s'il est partagé — il doit cloner ou passer par
// un repository.
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
				// Bus fermé.
				return nil
			}
			validated, err := o.Process(learner, ev)
			if err != nil {
				// On ne bloque pas la boucle pour une erreur unitaire ;
				// le Handler peut journaliser.
				continue
			}
			if len(validated) == 0 {
				continue
			}
			handler(learner, ev, validated)
		}
	}
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

// findMission cherche une mission par ID dans le registre.
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

// AllMissions retourne toutes les missions du registre, avec leur leçon.
func (o *Orchestrator) AllMissions() []ValidatedMission {
	// Réutilise la structure mais seul Mission et LessonID sont remplis.
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

// PendingMissions retourne les missions non encore réussies par le
// Learner.
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