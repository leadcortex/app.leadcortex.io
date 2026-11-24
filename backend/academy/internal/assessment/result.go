// backend/academy/internal/assessment/result.go

package assessment

import "github.com/leadcortex/academy/internal/domain"

type Result struct {
	Score int

	Correct bool

	FeedbackMD string

	ConceptsTouched []string

	Details *ResultDetails
}

type ResultDetails struct {
	BlankResults []SubResult

	PairResults []SubResult

	StepResults []SubResult

	ScenarioResults []SubResult

	MatchedKeywords []string

	MissingKeywords []string

	WordCount int
}

type SubResult struct {
	Index int

	Expected string

	Got string

	Correct bool
}

func (r Result) HasDetails() bool { return r.Details != nil }


func conceptsOf(ex domain.Exercise) []string {
	if len(ex.Concepts) == 0 {
		return nil
	}
	out := make([]string, len(ex.Concepts))
	copy(out, ex.Concepts)
	return out
}