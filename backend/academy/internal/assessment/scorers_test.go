package assessment

import (
	"testing"

	"github.com/leadcortex/academy/internal/domain"
)

/* ─── Fixtures ────────────────────────────────────────────────────────── */

func mkMCQ(payload domain.MCqPayload) domain.Exercise {
	return domain.Exercise{
		ID: "ex-mcq", Kind: domain.ExerciseMCQ, Prompt: "?", XP: 10, Difficulty: 1,
		Concepts: []string{"c1"}, Payload: payload,
	}
}

func mkMulti(payload domain.MultiSelectPayload) domain.Exercise {
	return domain.Exercise{
		ID: "ex-multi", Kind: domain.ExerciseMultiSelect, Prompt: "?", XP: 10, Difficulty: 1,
		Concepts: []string{"c1"}, Payload: payload,
	}
}

func mkFill(payload domain.FillBlankPayload) domain.Exercise {
	return domain.Exercise{
		ID: "ex-fill", Kind: domain.ExerciseFillBlank, Prompt: "?", XP: 10, Difficulty: 1,
		Concepts: []string{"c1"}, Payload: payload,
	}
}

func mkOrder(payload domain.OrderStepsPayload) domain.Exercise {
	return domain.Exercise{
		ID: "ex-order", Kind: domain.ExerciseOrderSteps, Prompt: "?", XP: 10, Difficulty: 1,
		Concepts: []string{"c1"}, Payload: payload,
	}
}

func mkMatch(payload domain.MatchPairsPayload) domain.Exercise {
	return domain.Exercise{
		ID: "ex-match", Kind: domain.ExerciseMatchPairs, Prompt: "?", XP: 10, Difficulty: 1,
		Concepts: []string{"c1"}, Payload: payload,
	}
}

func mkFree(payload domain.FreeTextPayload) domain.Exercise {
	return domain.Exercise{
		ID: "ex-free", Kind: domain.ExerciseFreeText, Prompt: "?", XP: 10, Difficulty: 1,
		Concepts: []string{"c1"}, Payload: payload,
	}
}

func mkScenario(payload domain.ScenarioPayload) domain.Exercise {
	return domain.Exercise{
		ID: "ex-scenario", Kind: domain.ExerciseScenario, Prompt: "?", XP: 10, Difficulty: 1,
		Concepts: []string{"c1"}, Payload: payload,
	}
}

/* ─── MCQ ─────────────────────────────────────────────────────────────── */

func TestScoreMCQ_Correct(t *testing.T) {
	ex := mkMCQ(domain.MCqPayload{Options: []string{"A", "B", "C"}, Correct: 1})
	res, err := scoreMCQ(ex, MCQAnswer{Selected: 1}, 70)
	if err != nil {
		t.Fatalf("err : %v", err)
	}
	if res.Score != 100 || !res.Correct {
		t.Errorf("attendu score=100 correct=true, obtenu %d/%v", res.Score, res.Correct)
	}
}

func TestScoreMCQ_Incorrect(t *testing.T) {
	ex := mkMCQ(domain.MCqPayload{Options: []string{"A", "B"}, Correct: 0})
	res, err := scoreMCQ(ex, MCQAnswer{Selected: 1}, 70)
	if err != nil {
		t.Fatalf("err : %v", err)
	}
	if res.Score != 0 || res.Correct {
		t.Errorf("attendu score=0 correct=false, obtenu %d/%v", res.Score, res.Correct)
	}
}

/* ─── MultiSelect ─────────────────────────────────────────────────────── */

func TestScoreMultiSelect_PerfectMatch(t *testing.T) {
	ex := mkMulti(domain.MultiSelectPayload{
		Options: []string{"A", "B", "C", "D"},
		Correct: []int{0, 2},
	})
	res, _ := scoreMultiSelect(ex, MultiSelectAnswer{Selected: []int{0, 2}}, 70)
	if res.Score != 100 || !res.Correct {
		t.Errorf("attendu 100, obtenu %d", res.Score)
	}
}

func TestScoreMultiSelect_PartialMatch(t *testing.T) {
	ex := mkMulti(domain.MultiSelectPayload{
		Options: []string{"A", "B", "C", "D"},
		Correct: []int{0, 1, 2, 3},
	})
	// Sélectionne 2 sur 4.
	res, _ := scoreMultiSelect(ex, MultiSelectAnswer{Selected: []int{0, 1}}, 70)
	// |A∩B| = 2, |A∪B| = 4 → 50.
	if res.Score != 50 {
		t.Errorf("attendu 50, obtenu %d", res.Score)
	}
	if res.Correct {
		t.Error("50 < 70 → ne devrait pas être correct")
	}
}

/* ─── FillBlank ───────────────────────────────────────────────────────── */

func TestScoreFillBlank_AllCorrect(t *testing.T) {
	ex := mkFill(domain.FillBlankPayload{Blanks: []domain.Blank{
		{Correct: []string{"bonjour", "salut"}},
		{Correct: []string{"monde"}},
	}})
	res, _ := scoreFillBlank(ex, FillBlankAnswer{Blanks: []string{"Bonjour", "monde"}}, 70)
	if res.Score != 100 {
		t.Errorf("attendu 100, obtenu %d", res.Score)
	}
}

func TestScoreFillBlank_AccentInsensitive(t *testing.T) {
	ex := mkFill(domain.FillBlankPayload{Blanks: []domain.Blank{
		{Correct: []string{"école"}},
	}})
	res, _ := scoreFillBlank(ex, FillBlankAnswer{Blanks: []string{"ecole"}}, 70)
	if res.Score != 100 {
		t.Errorf("accent ignoré attendu, obtenu %d", res.Score)
	}
}

func TestScoreFillBlank_HalfCorrect(t *testing.T) {
	ex := mkFill(domain.FillBlankPayload{Blanks: []domain.Blank{
		{Correct: []string{"a"}},
		{Correct: []string{"b"}},
	}})
	res, _ := scoreFillBlank(ex, FillBlankAnswer{Blanks: []string{"a", "mauvais"}}, 70)
	if res.Score != 50 {
		t.Errorf("attendu 50, obtenu %d", res.Score)
	}
}

/* ─── OrderSteps ──────────────────────────────────────────────────────── */

func TestScoreOrderSteps_Perfect(t *testing.T) {
	ex := mkOrder(domain.OrderStepsPayload{Steps: []string{"A", "B", "C", "D"}})
	res, _ := scoreOrderSteps(ex, OrderStepsAnswer{Steps: []string{"A", "B", "C", "D"}}, 70)
	if res.Score != 100 {
		t.Errorf("attendu 100, obtenu %d", res.Score)
	}
}

func TestScoreOrderSteps_OneSwapped(t *testing.T) {
	ex := mkOrder(domain.OrderStepsPayload{Steps: []string{"A", "B", "C", "D"}})
	// B et C inversés → 5 paires concordantes sur 6.
	res, _ := scoreOrderSteps(ex, OrderStepsAnswer{Steps: []string{"A", "C", "B", "D"}}, 70)
	if res.Score != 83 {
		t.Errorf("attendu 83 (5/6), obtenu %d", res.Score)
	}
	if !res.Correct {
		t.Error("83 >= 70 → correct")
	}
}

/* ─── MatchPairs ──────────────────────────────────────────────────────── */

func TestScoreMatchPairs_Perfect(t *testing.T) {
	ex := mkMatch(domain.MatchPairsPayload{Pairs: []domain.MatchPair{
		{Left: "A", Right: "1"},
		{Left: "B", Right: "2"},
	}})
	res, _ := scoreMatchPairs(ex, MatchPairsAnswer{Pairs: []domain.MatchPair{
		{Left: "A", Right: "1"},
		{Left: "B", Right: "2"},
	}}, 70)
	if res.Score != 100 {
		t.Errorf("attendu 100, obtenu %d", res.Score)
	}
}

/* ─── FreeText ────────────────────────────────────────────────────────── */

func TestScoreFreeText_AllKeywords(t *testing.T) {
	ex := mkFree(domain.FreeTextPayload{
		MinWords:         3,
		ExpectedKeywords: []string{"ICP", "persona"},
	})
	res, _ := scoreFreeText(ex, FreeTextAnswer{
		Text: "Un ICP c'est l'entreprise idéale, tandis qu'un persona c'est la personne.",
	}, 70)
	if res.Score != 100 {
		t.Errorf("attendu 100, obtenu %d", res.Score)
	}
}

func TestScoreFreeText_TooShort(t *testing.T) {
	ex := mkFree(domain.FreeTextPayload{
		MinWords: 20,
	})
	res, _ := scoreFreeText(ex, FreeTextAnswer{Text: "court"}, 70)
	if res.Score > 50 {
		t.Errorf("attendu <= 50 (trop court), obtenu %d", res.Score)
	}
}

/* ─── Scenario ────────────────────────────────────────────────────────── */

func TestScoreScenario_Perfect(t *testing.T) {
	ex := mkScenario(domain.ScenarioPayload{Steps: []domain.ScenarioStep{
		{ID: "s1", Situation: "?", Question: "?",
			Choices: []domain.ScenarioChoice{
				{Label: "Mauvais", Correct: false},
				{Label: "Bon", Correct: true},
			}},
	}})
	res, _ := scoreScenario(ex, ScenarioAnswer{Choices: []int{1}}, 70)
	if res.Score != 100 {
		t.Errorf("attendu 100, obtenu %d", res.Score)
	}
}