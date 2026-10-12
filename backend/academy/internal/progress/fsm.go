package progress

import (
	"github.com/leadcortex/academy/internal/domain"
)

// transitionRules décrit toutes les transitions FSM autorisées.
// Chaque entrée : from → set(to...) des états cibles possibles.
var transitionRules = map[domain.LessonStatus][]domain.LessonStatus{
	domain.LessonStatusLocked: {
		domain.LessonStatusAvailable, // débloquée par un gate
	},
	domain.LessonStatusAvailable: {
		domain.LessonStatusInProgress, // démarrée par l'apprenant
		domain.LessonStatusLocked,     // re-verrouillée (cas rare : rollback de prérequis)
	},
	domain.LessonStatusInProgress: {
		domain.LessonStatusCompleted, // tous les blocs terminés
		domain.LessonStatusAvailable, // reset (abandon explicite)
	},
	domain.LessonStatusCompleted: {
		domain.LessonStatusMastered, // tous les concepts maîtrisés
		domain.LessonStatusInProgress, // révision (rare)
	},
	domain.LessonStatusMastered: {
		// État terminal — aucune transition sortante par défaut.
	},
}

// canTransition indique si la transition est autorisée par la FSM.
func canTransition(from, to domain.LessonStatus) bool {
	targets, ok := transitionRules[from]
	if !ok {
		return false
	}
	for _, t := range targets {
		if t == to {
			return true
		}
	}
	return false
}

// assertTransition panique si la transition est interdite.
// Utilisé en interne pour garantir que le moteur ne propose jamais
// une transition illégale.
func assertTransition(lessonID string, from, to domain.LessonStatus) error {
	if !canTransition(from, to) {
		return &TransitionError{
			LessonID: lessonID,
			From:     from,
			To:       to,
			Reason:   "transition non autorisée par la FSM",
		}
	}
	return nil
}

// nextStatus calcule l'état suivant logique d'une leçon en fonction de
// son état actuel et de l'avancement des blocs.
//
// Retourne l'état cible (peut être identique à l'état actuel si rien ne
// change). L'appelant doit ensuite vérifier la validité de la transition.
func nextStatus(current domain.LessonStatus, allBlocksDone bool) domain.LessonStatus {
	switch current {
	case domain.LessonStatusAvailable:
		if allBlocksDone {
			// Un bloc ne peut être terminé sans avoir commencé ;
			// on transitionne via InProgress par cohérence.
			return domain.LessonStatusInProgress
		}
		return current
	case domain.LessonStatusInProgress:
		if allBlocksDone {
			return domain.LessonStatusCompleted
		}
		return current
	default:
		return current
	}
}

// shouldMaster détermine si une leçon complétée doit passer en mastered.
// Condition : tous ses concepts ont un niveau de maîtrise >= MasteryMastered.
func shouldMaster(learner *domain.Learner, lesson *domain.Lesson) bool {
	if len(lesson.Concepts) == 0 {
		// Une leçon sans concept est considérée maîtrisée dès qu'elle est
		// complétée — sinon elle ne pourrait jamais passer en mastered.
		return true
	}
	for _, cid := range lesson.Concepts {
		m, ok := learner.ConceptMastery[cid]
		if !ok || !m.IsMastered() {
			return false
		}
	}
	return true
}