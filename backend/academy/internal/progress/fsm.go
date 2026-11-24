// backend/academy/internal/progress/fsm.go

package progress

import (
	"github.com/leadcortex/academy/internal/domain"
)

var transitionRules = map[domain.LessonStatus][]domain.LessonStatus{
	domain.LessonStatusLocked: {
		domain.LessonStatusAvailable,
	},
	domain.LessonStatusAvailable: {
		domain.LessonStatusInProgress,
		domain.LessonStatusLocked,
	},
	domain.LessonStatusInProgress: {
		domain.LessonStatusCompleted,
		domain.LessonStatusAvailable,
	},
	domain.LessonStatusCompleted: {
		domain.LessonStatusMastered,
		domain.LessonStatusInProgress,
	},
	domain.LessonStatusMastered: {
	},
}

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

func nextStatus(current domain.LessonStatus, allBlocksDone bool) domain.LessonStatus {
	switch current {
	case domain.LessonStatusAvailable:
		if allBlocksDone {
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

func shouldMaster(learner *domain.Learner, lesson *domain.Lesson) bool {
	if len(lesson.Concepts) == 0 {
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