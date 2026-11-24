// backend/academy/internal/progress/errors.go

package progress

import (
	"errors"
	"fmt"

	"github.com/leadcortex/academy/internal/domain"
)

var (
	ErrLessonNotInRegistry = errors.New("progress: leçon absente du registre")

	ErrLessonNotStarted = errors.New("progress: leçon non démarrée")

	ErrBlockOutOfOrder = errors.New("progress: bloc hors séquence")

	ErrInvalidEvent = errors.New("progress: événement invalide")
)

type TransitionError struct {
	LessonID string

	From domain.LessonStatus

	To domain.LessonStatus

	Reason string
}

func (e *TransitionError) Error() string {
	return fmt.Sprintf(
		"progress: transition refusée pour %s : %s → %s (%s)",
		e.LessonID, e.From, e.To, e.Reason,
	)
}

func (e *TransitionError) Unwrap() error { return ErrInvalidEvent }

type UnlockError struct {
	LessonID string

	MissingPreqs []string

	MissingConcepts []string

	Reason string
}

func (e *UnlockError) Error() string {
	if e.Reason != "" {
		return fmt.Sprintf("progress: leçon %s verrouillée (%s)", e.LessonID, e.Reason)
	}
	return fmt.Sprintf("progress: leçon %s verrouillée", e.LessonID)
}

func (e *UnlockError) Unwrap() error { return ErrLessonNotStarted }


func IsLessonNotInRegistry(err error) bool {
	return errors.Is(err, ErrLessonNotInRegistry)
}

func IsLessonNotStarted(err error) bool {
	return errors.Is(err, ErrLessonNotStarted)
}

func IsBlockOutOfOrder(err error) bool {
	return errors.Is(err, ErrBlockOutOfOrder)
}

func IsInvalidEvent(err error) bool {
	return errors.Is(err, ErrInvalidEvent)
}

func IsTransitionError(err error) bool {
	var te *TransitionError
	return errors.As(err, &te)
}

func IsUnlockError(err error) bool {
	var ue *UnlockError
	return errors.As(err, &ue)
}