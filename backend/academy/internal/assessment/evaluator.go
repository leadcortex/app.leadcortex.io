// backend/academy/internal/assessment/evaluator.go

package assessment

import (
	"errors"
	"fmt"

	"github.com/leadcortex/academy/internal/domain"
)

const DefaultPassingScore = 70

type Evaluator struct {
	PassingScore int

	scorers map[domain.ExerciseKind]scorer
}

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
		},
	}
}

func (e *Evaluator) Evaluate(ex domain.Exercise, ans Answer) (Result, error) {
	if ans.Kind() != ex.Kind {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			fmt.Sprintf("réponse de type %q inattendue", ans.Kind()), ErrInvalidAnswer)
	}

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

	if ex.Payload == nil {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"payload absent", ErrMissingPayload)
	}
	if ex.Payload.PayloadKind() != ex.Kind {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"payload de type incohérent", ErrInvalidAnswer)
	}

	res, err := sc(ex, ans, e.PassingScore)
	if err != nil {
		return Result{}, err
	}

	if res.Score < 0 {
		res.Score = 0
	}
	if res.Score > 100 {
		res.Score = 100
	}
	res.Correct = res.Score >= e.PassingScore

	if res.FeedbackMD == "" {
		res.FeedbackMD = buildFeedback(ex, res)
	}

	return res, nil
}

func (e *Evaluator) CanEvaluate(kind domain.ExerciseKind) bool {
	_, ok := e.scorers[kind]
	return ok
}

func IsNotEvaluable(err error) bool {
	return errors.Is(err, ErrNotEvaluable)
}

func IsInvalidAnswer(err error) bool {
	return errors.Is(err, ErrInvalidAnswer)
}