package assessment

import (
	"errors"
	"fmt"

	"github.com/leadcortex/academy/internal/domain"
)

// Erreurs sentinel du moteur d'évaluation.
var (
	// ErrUnsupportedKind — le type d'exercice n'est pas géré par l'évaluateur.
	ErrUnsupportedKind = errors.New("assessment: type d'exercice non supporté")

	// ErrInvalidAnswer — la réponse fournie ne correspond pas au type d'exercice.
	ErrInvalidAnswer = errors.New("assessment: réponse invalide pour cet exercice")

	// ErrNotEvaluable — l'exercice ne peut pas être évalué localement
	// (typiquement : in_app_mission, évalué par événement métier).
	ErrNotEvaluable = errors.New("assessment: exercice non évaluable localement")

	// ErrMissingPayload — l'exercice n'a pas de payload (ne devrait pas arriver
	// après validation du curriculum).
	ErrMissingPayload = errors.New("assessment: payload manquant")
)

// EvaluationError attache un contexte précis à une erreur d'évaluation.
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

// NewEvaluationError — helper de construction.
func NewEvaluationError(
	exerciseID string,
	kind domain.ExerciseKind,
	reason string,
	cause error,
) *EvaluationError {
	return &EvaluationError{ExerciseID: exerciseID, Kind: kind, Reason: reason, Cause: cause}
}