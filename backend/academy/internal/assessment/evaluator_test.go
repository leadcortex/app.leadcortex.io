package assessment

import (
	"errors"
	"testing"

	"github.com/leadcortex/academy/internal/domain"
)

func TestEvaluator_MCQ_Correct(t *testing.T) {
	ev := NewEvaluator(70)
	ex := domain.Exercise{
		ID: "ex1", Kind: domain.ExerciseMCQ, Prompt: "?",
		XP: 10, Difficulty: 1, Concepts: []string{"c1"},
		ExplanationMD: "Voilà pourquoi c'est la bonne réponse.",
		Payload: domain.MCqPayload{Options: []string{"A", "B"}, Correct: 1},
	}
	res, err := ev.Evaluate(ex, MCQAnswer{Selected: 1})
	if err != nil {
		t.Fatalf("Evaluate : %v", err)
	}
	if !res.Correct || res.Score != 100 {
		t.Errorf("attendu 100/correct, obtenu %d/%v", res.Score, res.Correct)
	}
	if res.FeedbackMD == "" {
		t.Error("feedback attendu non vide")
	}
	if len(res.ConceptsTouched) != 1 || res.ConceptsTouched[0] != "c1" {
		t.Errorf("concepts : attendu [c1], obtenu %v", res.ConceptsTouched)
	}
}

func TestEvaluator_MCQ_KindMismatch(t *testing.T) {
	ev := NewEvaluator(70)
	ex := domain.Exercise{
		ID: "ex1", Kind: domain.ExerciseMCQ, Prompt: "?",
		XP: 10, Difficulty: 1,
		Payload: domain.MCqPayload{Options: []string{"A", "B"}, Correct: 0},
	}
	// Answer de type FillBlank fourni pour un MCQ.
	_, err := ev.Evaluate(ex, FillBlankAnswer{Blanks: []string{"A"}})
	if err == nil {
		t.Fatal("attendu : erreur de type de réponse")
	}
	if !IsInvalidAnswer(err) {
		t.Errorf("attendu ErrInvalidAnswer, obtenu %v", err)
	}
}

func TestEvaluator_InAppMission_NotEvaluable(t *testing.T) {
	ev := NewEvaluator(70)
	ex := domain.Exercise{
		ID: "ex-mission", Kind: domain.ExerciseInAppMission, Prompt: "?",
		XP: 10, Difficulty: 1,
		Payload: domain.InAppMissionPayload{MissionID: "m1"},
	}
	_, err := ev.Evaluate(ex, InAppMissionAnswer{MissionID: "m1"})
	if err == nil {
		t.Fatal("attendu : erreur (non évaluable)")
	}
	if !IsNotEvaluable(err) {
		t.Errorf("attendu ErrNotEvaluable, obtenu %v", err)
	}
}

func TestEvaluator_PassingScore(t *testing.T) {
	// Scorer MultiSelect : 2/4 correct → 50.
	ev := NewEvaluator(60)
	ex := domain.Exercise{
		ID: "ex", Kind: domain.ExerciseMultiSelect, Prompt: "?",
		XP: 10, Difficulty: 1,
		Payload: domain.MultiSelectPayload{
			Options: []string{"A", "B", "C", "D"},
			Correct: []int{0, 1, 2, 3},
		},
	}
	res, err := ev.Evaluate(ex, MultiSelectAnswer{Selected: []int{0, 1}})
	if err != nil {
		t.Fatalf("Evaluate : %v", err)
	}
	if res.Score != 50 {
		t.Errorf("attendu 50, obtenu %d", res.Score)
	}
	if res.Correct {
		t.Errorf("50 < 60 → ne devrait pas être correct")
	}
}

func TestEvaluator_DefaultsToPassingScore70(t *testing.T) {
	ev := NewEvaluator(0) // → 70
	if ev.PassingScore != 70 {
		t.Errorf("attendu 70, obtenu %d", ev.PassingScore)
	}
	ev = NewEvaluator(150) // → 70 (clampé)
	if ev.PassingScore != 70 {
		t.Errorf("attendu 70 (clampé), obtenu %d", ev.PassingScore)
	}
}

func TestEvaluator_CanEvaluate(t *testing.T) {
	ev := NewEvaluator(70)
	if !ev.CanEvaluate(domain.ExerciseMCQ) {
		t.Error("MCQ devrait être évaluable")
	}
	if ev.CanEvaluate(domain.ExerciseInAppMission) {
		t.Error("InAppMission ne devrait pas être évaluable")
	}
}

func TestEvaluator_NilPayload(t *testing.T) {
	ev := NewEvaluator(70)
	ex := domain.Exercise{
		ID: "ex", Kind: domain.ExerciseMCQ, Prompt: "?",
		XP: 10, Difficulty: 1,
		// Payload nil.
	}
	_, err := ev.Evaluate(ex, MCQAnswer{Selected: 0})
	if err == nil {
		t.Fatal("attendu : erreur payload manquant")
	}
	if !errors.Is(err, ErrMissingPayload) {
		t.Errorf("attendu ErrMissingPayload, obtenu %v", err)
	}
}