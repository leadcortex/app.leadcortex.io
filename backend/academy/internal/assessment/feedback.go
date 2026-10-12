package assessment

import (
	"fmt"
	"strings"

	"github.com/leadcortex/academy/internal/domain"
)

// buildFeedback construit le message de feedback affiché à l'apprenant.
//
// Règles :
//   - Si l'exercice a une ExplanationMD non vide, elle est utilisée en
//     priorité (c'est l'explication prévue par l'auteur du contenu).
//   - Sinon, un feedback générique est produit selon le type d'exercice
//     et le score.
//   - Pour les exercices multi-éléments, un récapitulatif est ajouté.
func buildFeedback(ex domain.Exercise, res Result) string {
	var sb strings.Builder

	// 1. Verdict.
	if res.Correct {
		sb.WriteString("✔ **Correct** — ")
	} else {
		sb.WriteString("✖ **Incorrect** — ")
	}
	fmt.Fprintf(&sb, "score %d/100.\n\n", res.Score)

	// 2. Explication de l'auteur (si présente).
	if ex.ExplanationMD != "" {
		sb.WriteString(ex.ExplanationMD)
		sb.WriteString("\n\n")
	} else {
		// Feedback générique selon le type.
		sb.WriteString(genericFeedback(ex, res))
	}

	// 3. Récapitulatif des sous-résultats (si applicable).
	if res.Details != nil {
		if recap := buildRecap(ex, res.Details); recap != "" {
			sb.WriteString(recap)
		}
	}

	return strings.TrimSpace(sb.String())
}

func genericFeedback(ex domain.Exercise, res Result) string {
	if res.Correct {
		switch ex.Kind {
		case domain.ExerciseMCQ:
			return "Bonne réponse !\n\n"
		case domain.ExerciseMultiSelect:
			return "Sélection correcte.\n\n"
		case domain.ExerciseFillBlank:
			return "Tous les trous sont bien remplis.\n\n"
		case domain.ExerciseOrderSteps:
			return "L'ordre est respecté.\n\n"
		case domain.ExerciseMatchPairs:
			return "Toutes les paires sont correctes.\n\n"
		case domain.ExerciseFreeText:
			return "Réponse bien structurée.\n\n"
		case domain.ExerciseScenario:
			return "Tu as fait les bons choix tout au long du scénario.\n\n"
		}
	}
	switch ex.Kind {
	case domain.ExerciseMCQ:
		return "Ce n'est pas la bonne réponse. Relis la théorie puis réessaie.\n\n"
	case domain.ExerciseMultiSelect:
		return "Ta sélection contient des erreurs. Vérifie chaque option.\n\n"
	case domain.ExerciseFillBlank:
		return "Certains trous ne sont pas corrects. Vérifie la casse et l'orthographe.\n\n"
	case domain.ExerciseOrderSteps:
		return "L'ordre n'est pas tout à fait correct. Reprends les étapes une par une.\n\n"
	case domain.ExerciseMatchPairs:
		return "Certaines associations sont incorrectes.\n\n"
	case domain.ExerciseFreeText:
		return "Ta réponse mérite d'être développée ou d'aborder d'autres points.\n\n"
	case domain.ExerciseScenario:
		return "Certains choix ne sont pas optimaux. Rejoue le scénario.\n\n"
	}
	return ""
}

// buildRecap résume les sous-résultats pour l'UI.
func buildRecap(ex domain.Exercise, d *ResultDetails) string {
	var sb strings.Builder
	switch ex.Kind {
	case domain.ExerciseMCQ:
		// Pour un MCQ, un seul SubResult ; pas de récap séparé.
		return ""
	case domain.ExerciseFillBlank:
		if len(d.BlankResults) == 0 {
			return ""
		}
		sb.WriteString("**Détail des trous**\n\n")
		for _, r := range d.BlankResults {
			mark := "✖"
			if r.Correct {
				mark = "✔"
			}
			fmt.Fprintf(&sb, "- %s Trou %d — attendu : `%s` · fourni : `%s`\n",
				mark, r.Index+1, r.Expected, r.Got)
		}
	case domain.ExerciseMultiSelect:
		if len(d.BlankResults) == 0 {
			return ""
		}
		sb.WriteString("**Détail de la sélection**\n\n")
		for _, r := range d.BlankResults {
			mark := "✖"
			if r.Correct {
				mark = "✔"
			}
			fmt.Fprintf(&sb, "- %s %s\n", mark, r.Got)
		}
	case domain.ExerciseOrderSteps:
		if len(d.StepResults) == 0 {
			return ""
		}
		sb.WriteString("**Détail de l'ordre**\n\n")
		for _, r := range d.StepResults {
			mark := "✖"
			if r.Correct {
				mark = "✔"
			}
			fmt.Fprintf(&sb, "- %s Position %d — %s\n", mark, r.Index+1, r.Expected)
		}
	case domain.ExerciseMatchPairs:
		if len(d.PairResults) == 0 {
			return ""
		}
		sb.WriteString("**Détail des associations**\n\n")
		for _, r := range d.PairResults {
			mark := "✖"
			if r.Correct {
				mark = "✔"
			}
			fmt.Fprintf(&sb, "- %s %s\n", mark, r.Got)
		}
	case domain.ExerciseScenario:
		if len(d.ScenarioResults) == 0 {
			return ""
		}
		sb.WriteString("**Détail du scénario**\n\n")
		for _, r := range d.ScenarioResults {
			mark := "✖"
			if r.Correct {
				mark = "✔"
			}
			fmt.Fprintf(&sb, "- %s Étape %d — %s\n", mark, r.Index+1, r.Expected)
		}
	case domain.ExerciseFreeText:
		fmt.Fprintf(&sb, "**Analyse**\n\n- Mots : %d\n", d.WordCount)
		if len(d.MatchedKeywords) > 0 {
			fmt.Fprintf(&sb, "- Concepts présents : %s\n",
				strings.Join(d.MatchedKeywords, ", "))
		}
		if len(d.MissingKeywords) > 0 {
			fmt.Fprintf(&sb, "- Concepts à ajouter : %s\n",
				strings.Join(d.MissingKeywords, ", "))
		}
	}
	sb.WriteString("\n")
	return sb.String()
}