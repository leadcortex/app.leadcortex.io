// backend/academy/internal/assessment/errors.go

package assessment

import (
	"errors"
	"fmt"

	"github.com/leadcortex/academy/internal/domain"
)

var (
	ErrUnsupportedKind = errors.New("assessment: type d'exercice non supporté")

	ErrInvalidAnswer = errors.New("assessment: réponse invalide pour cet exercice")

	ErrNotEvaluable = errors.New("assessment: exercice non évaluable localement")

	ErrMissingPayload = errors.New("assessment: payload manquant")
)

type EvaluationError struct {
	ExerciseID string
	Kind       domain.ExerciseKind
	Reason     string
	Cause      error
}

func (e *EvaluationError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("évaluation de %s (%s) : %s — %v",
			e.ExerciseID, e.Kind, e.Reason, e.Cause)
	}
	return fmt.Sprintf("évaluation de %s (%s) : %s", e.ExerciseID, e.Kind, e.Reason)
}

func (e *EvaluationError) Unwrap() error { return e.Cause }

func NewEvaluationError(
	exerciseID string,
	kind domain.ExerciseKind,
	reason string,
	cause error,
) *EvaluationError {
	return &EvaluationError{ExerciseID: exerciseID, Kind: kind, Reason: reason, Cause: cause}
}