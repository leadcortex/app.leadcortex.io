// backend/academy/internal/assessment/answer.go

package assessment

import "github.com/leadcortex/academy/internal/domain"

type Answer interface {
	Kind() domain.ExerciseKind
}


type MCQAnswer struct {
	Selected int
}

func (MCQAnswer) Kind() domain.ExerciseKind { return domain.ExerciseMCQ }


type MultiSelectAnswer struct {
	Selected []int
}

func (MultiSelectAnswer) Kind() domain.ExerciseKind { return domain.ExerciseMultiSelect }


type FillBlankAnswer struct {
	Blanks []string
}

func (FillBlankAnswer) Kind() domain.ExerciseKind { return domain.ExerciseFillBlank }


type OrderStepsAnswer struct {
	Steps []string
}

func (OrderStepsAnswer) Kind() domain.ExerciseKind { return domain.ExerciseOrderSteps }


type MatchPairsAnswer struct {
	Pairs []domain.MatchPair
}

func (MatchPairsAnswer) Kind() domain.ExerciseKind { return domain.ExerciseMatchPairs }


type FreeTextAnswer struct {
	Text string
}

func (FreeTextAnswer) Kind() domain.ExerciseKind { return domain.ExerciseFreeText }


type ScenarioAnswer struct {
	Choices []int
}

func (ScenarioAnswer) Kind() domain.ExerciseKind { return domain.ExerciseScenario }


type InAppMissionAnswer struct {
	MissionID string
}

func (InAppMissionAnswer) Kind() domain.ExerciseKind { return domain.ExerciseInAppMission }