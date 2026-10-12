package assessment

import (
	"fmt"
	"strings"

	"github.com/leadcortex/academy/internal/domain"
)

// scorer — signature commune à tous les scorers.
// Retourne un Result (Score 0-100, Details éventuels) et éventuellement
// une erreur si la réponse ne correspond pas au type d'exercice.
type scorer func(ex domain.Exercise, ans Answer, passingScore int) (Result, error)

// ─── MCQ ───────────────────────────────────────────────────────────────

func scoreMCQ(ex domain.Exercise, ans Answer, passing int) (Result, error) {
	payload, ok := ex.Payload.(domain.MCqPayload)
	if !ok {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind, "payload MCQ attendu", ErrMissingPayload)
	}
	a, ok := ans.(MCQAnswer)
	if !ok {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"réponse MCQ attendue", ErrInvalidAnswer)
	}

	correct := a.Selected == payload.Correct
	score := 0
	if correct {
		score = 100
	}

	return Result{
		Score:           score,
		Correct:         score >= passing,
		ConceptsTouched: conceptsOf(ex),
		Details: &ResultDetails{
			BlankResults: []SubResult{{
				Index:   0,
				Expected: payload.Options[payload.Correct],
				Got:     safeIndex(payload.Options, a.Selected),
				Correct: correct,
			}},
		},
	}, nil
}

// ─── MultiSelect ───────────────────────────────────────────────────────

// scoreMultiSelect utilise un score de Jaccard : |A ∩ B| / |A ∪ B|.
// Pour éviter qu'une réponse qui coche tout obtienne un score élevé,
// on pénalise les faux positifs et les faux négatifs de la même façon.
func scoreMultiSelect(ex domain.Exercise, ans Answer, passing int) (Result, error) {
	payload, ok := ex.Payload.(domain.MultiSelectPayload)
	if !ok {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"payload MultiSelect attendu", ErrMissingPayload)
	}
	a, ok := ans.(MultiSelectAnswer)
	if !ok {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"réponse MultiSelect attendue", ErrInvalidAnswer)
	}

	expected := indexSet(payload.Correct)
	got := indexSet(a.Selected)

	intersection := 0
	for i := range got {
		if _, ok := expected[i]; ok {
			intersection++
		}
	}
	union := len(expected) + len(got) - intersection
	if union == 0 {
		return Result{
			Score:           100,
			Correct:         true,
			ConceptsTouched: conceptsOf(ex),
		}, nil
	}
	score := (intersection * 100) / union

	// Construction du détail : un SubResult par option.
	details := &ResultDetails{}
	for i, opt := range payload.Options {
		_, wantIt := expected[i]
		_, hasIt := got[i]
		details.BlankResults = append(details.BlankResults, SubResult{
			Index:    i,
			Expected: optionLabel(opt, wantIt),
			Got:      optionLabel(opt, hasIt),
			Correct:  wantIt == hasIt,
		})
	}

	return Result{
		Score:           score,
		Correct:         score >= passing,
		ConceptsTouched: conceptsOf(ex),
		Details:         details,
	}, nil
}

// ─── FillBlank ─────────────────────────────────────────────────────────

// scoreFillBlank compare chaque trou à la liste des réponses acceptées.
// La comparaison utilise NormalizeText (casse, accents, ponctuation).
func scoreFillBlank(ex domain.Exercise, ans Answer, passing int) (Result, error) {
	payload, ok := ex.Payload.(domain.FillBlankPayload)
	if !ok {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"payload FillBlank attendu", ErrMissingPayload)
	}
	a, ok := ans.(FillBlankAnswer)
	if !ok {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"réponse FillBlank attendue", ErrInvalidAnswer)
	}

	details := &ResultDetails{}
	correctCount := 0
	n := len(payload.Blanks)

	for i, blank := range payload.Blanks {
		var got string
		if i < len(a.Blanks) {
			got = a.Blanks[i]
		}
		correct := false
		for _, expected := range blank.Correct {
			if EqualNormalized(got, expected) {
				correct = true
				break
			}
		}
		if correct {
			correctCount++
		}
		details.BlankResults = append(details.BlankResults, SubResult{
			Index:    i,
			Expected: strings.Join(blank.Correct, " | "),
			Got:      got,
			Correct:  correct,
		})
	}

	score := 0
	if n > 0 {
		score = (correctCount * 100) / n
	}
	return Result{
		Score:           score,
		Correct:         score >= passing,
		ConceptsTouched: conceptsOf(ex),
		Details:         details,
	}, nil
}

// ─── OrderSteps ────────────────────────────────────────────────────────

// scoreOrderSteps utilise une variante de Kendall tau : on compte le nombre
// de paires correctement ordonnées parmi toutes les paires possibles.
//
// Avantages vs comptage brut de positions correctes :
//   - Une étape légèrement décalée (A B C D au lieu de A C B D) est moins
//     pénalisée qu'une étape complètement à l'envers.
func scoreOrderSteps(ex domain.Exercise, ans Answer, passing int) (Result, error) {
	payload, ok := ex.Payload.(domain.OrderStepsPayload)
	if !ok {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"payload OrderSteps attendu", ErrMissingPayload)
	}
	a, ok := ans.(OrderStepsAnswer)
	if !ok {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"réponse OrderSteps attendue", ErrInvalidAnswer)
	}

	expected := payload.Steps
	if len(expected) < 2 {
		return Result{Score: 100, Correct: true, ConceptsTouched: conceptsOf(ex)}, nil
	}

	// Position attendue de chaque étape (par libellé normalisé).
	expectedIndex := make(map[string]int, len(expected))
	for i, s := range expected {
		expectedIndex[NormalizeText(s)] = i
	}

	// Position effective dans la réponse.
	gotIndex := make(map[string]int, len(a.Steps))
	for i, s := range a.Steps {
		gotIndex[NormalizeText(s)] = i
	}

	// Compte les paires concordantes.
	total := 0
	concordant := 0
	for i := 0; i < len(expected); i++ {
		for j := i + 1; j < len(expected); j++ {
			total++
			ei := expectedIndex[NormalizeText(expected[i])]
			ej := expectedIndex[NormalizeText(expected[j])]
			gi, okI := gotIndex[NormalizeText(expected[i])]
			gj, okJ := gotIndex[NormalizeText(expected[j])]
			if !okI || !okJ {
				continue
			}
			if (ei < ej) == (gi < gj) {
				concordant++
			}
		}
	}

	score := 0
	if total > 0 {
		score = (concordant * 100) / total
	}

	// Détail par étape : correcte si à la bonne position.
	details := &ResultDetails{}
	for i, s := range expected {
		gotPos := -1
		if pos, ok := gotIndex[NormalizeText(s)]; ok {
			gotPos = pos
		}
		correct := gotPos == i
		details.StepResults = append(details.StepResults, SubResult{
			Index:    i,
			Expected: s,
			Got:      positionLabel(gotPos),
			Correct:  correct,
		})
	}

	return Result{
		Score:           score,
		Correct:         score >= passing,
		ConceptsTouched: conceptsOf(ex),
		Details:         details,
	}, nil
}

// ─── MatchPairs ────────────────────────────────────────────────────────

// scoreMatchPairs évalue chaque paire indépendamment.
// Score final = (nombre de paires correctes / total) * 100.
//
// Les paires sont comparées par libellé normalisé : si l'apprenant associe
// « A » à « B », c'est correct même si l'ordre de gauche/droite n'est pas
// dans le même ordre que la solution.
func scoreMatchPairs(ex domain.Exercise, ans Answer, passing int) (Result, error) {
	payload, ok := ex.Payload.(domain.MatchPairsPayload)
	if !ok {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"payload MatchPairs attendu", ErrMissingPayload)
	}
	a, ok := ans.(MatchPairsAnswer)
	if !ok {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"réponse MatchPairs attendue", ErrInvalidAnswer)
	}

	// Index des paires attendues par libellé gauche.
	want := make(map[string]string, len(payload.Pairs))
	for _, p := range payload.Pairs {
		want[NormalizeText(p.Left)] = NormalizeText(p.Right)
	}

	details := &ResultDetails{}
	correctCount := 0
	for i, p := range a.Pairs {
		expected := want[NormalizeText(p.Left)]
		got := NormalizeText(p.Right)
		correct := expected != "" && expected == got
		if correct {
			correctCount++
		}
		details.PairResults = append(details.PairResults, SubResult{
			Index:    i,
			Expected: p.Left + " → " + reverseLookup(want, expected),
			Got:      p.Left + " → " + p.Right,
			Correct:  correct,
		})
	}

	score := 0
	if len(payload.Pairs) > 0 {
		score = (correctCount * 100) / len(payload.Pairs)
	}
	return Result{
		Score:           score,
		Correct:         score >= passing,
		ConceptsTouched: conceptsOf(ex),
		Details:         details,
	}, nil
}

// ─── FreeText ──────────────────────────────────────────────────────────

// scoreFreeText évalue une réponse texte libre.
//
// Version locale (sans LLM) :
//   - Pénalise si le nombre de mots est inférieur à MinWords (score plafonné à 50).
//   - Récompense la présence des ExpectedKeywords (jusqu'à 100 si tous présents).
//   - Si aucun mot-clé n'est déclaré, le score = min(100, words/MinWords * 100).
//
// Cette implémentation est conçue pour être remplacée par un appel LLM
// sans changer la signature. Voir doc.go pour la note d'évolutivité.
func scoreFreeText(ex domain.Exercise, ans Answer, passing int) (Result, error) {
	payload, ok := ex.Payload.(domain.FreeTextPayload)
	if !ok {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"payload FreeText attendu", ErrMissingPayload)
	}
	a, ok := ans.(FreeTextAnswer)
	if !ok {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"réponse FreeText attendue", ErrInvalidAnswer)
	}

	wordCount := CountWords(a.Text)
	found, missing := FindKeywords(a.Text, payload.ExpectedKeywords)

	score := 0

	// Règle 1 : nombre minimum de mots.
	if wordCount < payload.MinWords {
		// Score plafonné à 50 si trop court.
		ratio := float64(wordCount) / float64(payload.MinWords)
		score = int(ratio * 50)
	} else if len(payload.ExpectedKeywords) == 0 {
		// Aucun mot-clé : réussite dès que le nombre de mots est atteint.
		score = 100
	} else {
		// Score basé sur les mots-clés.
		score = (len(found) * 100) / len(payload.ExpectedKeywords)
	}

	// Pénalité de concision : si MaxWords est défini et dépassé.
	if payload.MaxWords > 0 && wordCount > payload.MaxWords {
		over := wordCount - payload.MaxWords
		penalty := over * 2
		if penalty > 30 {
			penalty = 30
		}
		score -= penalty
	}
	if score < 0 {
		score = 0
	}

	return Result{
		Score:           score,
		Correct:         score >= passing,
		ConceptsTouched: conceptsOf(ex),
		Details: &ResultDetails{
			MatchedKeywords: found,
			MissingKeywords: missing,
			WordCount:       wordCount,
		},
	}, nil
}

// ─── Scenario ──────────────────────────────────────────────────────────

// scoreScenario évalue chaque étape d'un scénario.
// Score = (étapes correctes / total) * 100.
func scoreScenario(ex domain.Exercise, ans Answer, passing int) (Result, error) {
	payload, ok := ex.Payload.(domain.ScenarioPayload)
	if !ok {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"payload Scenario attendu", ErrMissingPayload)
	}
	a, ok := ans.(ScenarioAnswer)
	if !ok {
		return Result{}, NewEvaluationError(ex.ID, ex.Kind,
			"réponse Scenario attendue", ErrInvalidAnswer)
	}

	details := &ResultDetails{}
	correctCount := 0

	for i, step := range payload.Steps {
		var got int = -1
		if i < len(a.Choices) {
			got = a.Choices[i]
		}
		// Trouver l'index du bon choix.
		expectedIdx := -1
		for j, c := range step.Choices {
			if c.Correct {
				expectedIdx = j
				break
			}
		}
		correct := got == expectedIdx
		if correct {
			correctCount++
		}
		details.ScenarioResults = append(details.ScenarioResults, SubResult{
			Index:    i,
			Expected: choiceLabel(step.Choices, expectedIdx),
			Got:      choiceLabel(step.Choices, got),
			Correct:  correct,
		})
	}

	score := 0
	if len(payload.Steps) > 0 {
		score = (correctCount * 100) / len(payload.Steps)
	}
	return Result{
		Score:           score,
		Correct:         score >= passing,
		ConceptsTouched: conceptsOf(ex),
		Details:         details,
	}, nil
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

func indexSet(xs []int) map[int]struct{} {
	out := make(map[int]struct{}, len(xs))
	for _, x := range xs {
		out[x] = struct{}{}
	}
	return out
}

func safeIndex(xs []string, i int) string {
	if i < 0 || i >= len(xs) {
		return fmt.Sprintf("(index %d)", i)
	}
	return xs[i]
}

func optionLabel(opt string, selected bool) string {
	if selected {
		return "[x] " + opt
	}
	return "[ ] " + opt
}

func positionLabel(pos int) string {
	if pos < 0 {
		return "(non placée)"
	}
	return fmt.Sprintf("position %d", pos+1)
}

func reverseLookup(m map[string]string, value string) string {
	for k, v := range m {
		if v == value {
			return k
		}
	}
	return "(?)"
}

func choiceLabel(choices []domain.ScenarioChoice, idx int) string {
	if idx < 0 || idx >= len(choices) {
		return "(aucun choix)"
	}
	return choices[idx].Label
}