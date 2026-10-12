package assessment

import (
	"errors"
	"fmt"

	"github.com/leadcortex/academy/internal/domain"
)

// DefaultPassingScore — seuil de réussite par défaut.
const DefaultPassingScore = 70

// Evaluator évalue un exercice en fonction de sa réponse.
//
// Un Evaluator est immuable et safe en lecture concurrente. On peut le
// partager entre goroutines.
type Evaluator struct {
	// PassingScore — score minimum (0-100) pour qu'un exercice soit
	// considéré comme réussi.
	PassingScore int

	// scorers — table de dispatch des scorers par type d'exercice.
	scorers map[domain.ExerciseKind]scorer
}

// NewEvaluator crée un évaluateur avec un seuil de réussite.
// Si passingScore <= 0, DefaultPassingScore est utilisé.
func NewEvaluator(passingScore int) *Evaluator {
	if passingScore <= 0 || passingScore > 100 {
		passingScore = DefaultPassingScore
	}
	return &Evaluator{
		PassingScore: passingScore,
		scorers: map[domain.ExerciseKind]scorer{
			domain.ExerciseMCQ:           scoreMCQ,
			domain.ExerciseMultiSelect:   scoreMultiSelect,
			domain.ExerciseFillBlank:     scoreFillBlank,
			domain.ExerciseOrderSteps:    scoreOrderSteps,
			domain.ExerciseMatchPairs:    scoreMatchPairs,
			domain.ExerciseFreeText:      scoreFreeText,
			domain.ExerciseScenario:      scoreScenario,
			// ExerciseInAppMission volontairement absent : voir plus bas.
		},
	}
}

// Evaluate évalue une réponse à un exercice.
//
// Erreurs possibles :
//   - ErrUnsupportedKind : le type d'exercice n'est pas géré localement.
//   - ErrInvalidAnswer  : la réponse ne correspond pas au type d'exercice.
//   - ErrMissingPayload : l'exercice n'a pas de payload.
func (e *Evaluator) Evaluate(ex domain.Exercise, ans Answer) (Result, error) {
	// Vérification de la cohérence Kind.
	if ans.Kind() != ex.Kind {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			fmt.Sprintf("réponse de type %q inattendue", ans.Kind()), ErrInvalidAnswer)
	}

	// Dispatch.
	sc, ok := e.scorers[ex.Kind]
	if !ok {
		if ex.Kind == domain.ExerciseInAppMission {
			return Result{}, NewEvaluationError(ex.ID, ex.Kind,
				"les missions in-app sont validées par événement métier, pas par l'Evaluator",
				ErrNotEvaluable)
		}
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"type d'exercice non supporté", ErrUnsupportedKind)
	}

	// Validation rapide du payload avant délégation.
	if ex.Payload == nil {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"payload absent", ErrMissingPayload)
	}
	if ex.Payload.PayloadKind() != ex.Kind {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"payload de type incohérent", ErrInvalidAnswer)
	}

	// Délégation au scorer.
	res, err := sc(ex, ans, e.PassingScore)
	if err != nil {
		return Result{}, err
	}

	// Cohérence du score.
	if res.Score < 0 {
		res.Score = 0
	}
	if res.Score > 100 {
		res.Score = 100
	}
	res.Correct = res.Score >= e.PassingScore

	// Feedback généré.
	if res.FeedbackMD == "" {
		res.FeedbackMD = buildFeedback(ex, res)
	}

	return res, nil
}

// CanEvaluate — indique si un type d'exercice est évaluable localement.
// Renvoie false pour ExerciseInAppMission.
func (e *Evaluator) CanEvaluate(kind domain.ExerciseKind) bool {
	_, ok := e.scorers[kind]
	return ok
}

// IsNotEvaluable — helper d'usage courant pour tester une erreur d'évaluation.
func IsNotEvaluable(err error) bool {
	return errors.Is(err, ErrNotEvaluable)
}

// IsInvalidAnswer — helper d'usage courant.
func IsInvalidAnswer(err error) bool {
	return errors.Is(err, ErrInvalidAnswer)
}