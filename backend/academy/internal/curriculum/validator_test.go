package curriculum

import (
	"testing"

	"github.com/leadcortex/academy/internal/domain"
)

func TestHasErrors(t *testing.T) {
	cases := []struct {
		name   string
		issues []ValidationIssue
		want   bool
	}{
		{"vide", nil, false},
		{"warning seul", []ValidationIssue{{Severity: SeverityWarning}}, false},
		{"error seule", []ValidationIssue{{Severity: SeverityError}}, true},
		{"mixte", []ValidationIssue{
			{Severity: SeverityWarning},
			{Severity: SeverityError},
		}, true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := HasErrors(tc.issues); got != tc.want {
				t.Errorf("HasErrors = %v, attendu %v", got, tc.want)
			}
		})
	}
}

func TestValidateAll_EmptyInputs(t *testing.T) {
	issues := ValidateAll(nil, nil, nil)
	if len(issues) != 0 {
		t.Errorf("attendu 0 issue, obtenu %d : %v", len(issues), issues)
	}
}

func TestValidateAll_MissingMission(t *testing.T) {
	lesson := domain.Lesson{
		ID:          "l-missing-mission",
		ModuleID:    "m1",
		Order:       1,
		Title:       "Leçon sans mission",
		DurationMin: 5,
		Difficulty:  2,
		XPTotal:     10,
		Concepts:    []string{"c1"},
		Blocks: []domain.Block{
			domain.CoverBlock{Title: "Cover", Objectives: []string{"Objectif"}},
			domain.DebriefBlock{Sections: []domain.DebriefSection{domain.DebriefScoreBreakdown}},
		},
	}
	program := &domain.Program{
		ID:         "p-test",
		Order:      1,
		Title:      "Test",
		Difficulty: 1,
		Modules: []domain.Module{
			{
				ID:        "m1",
				ProgramID: "p-test",
				Order:     1,
				Title:     "Module",
				Lessons:   []domain.Lesson{lesson},
			},
		},
	}
	// On injecte le concept manuellement (pas dans le YAML ici).
	program.Modules[0].Lessons[0].Concepts = []string{"c1"}

	issues := ValidateAll([]*domain.Program{program}, nil, nil)

	// On s'attend à au moins une erreur "mission manquante".
	found := false
	for _, i := range issues {
		if i.Severity == SeverityError && i.Entity == "Lesson" &&
			i.Message == "aucun bloc mission (règle pédagogique)" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("attendu erreur 'aucun bloc mission', issues : %v", issues)
	}
}