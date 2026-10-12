package progress

import (
	"fmt"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

// UnlockResult décrit le résultat d'une évaluation de déblocage.
type UnlockResult struct {
	Unlocked bool
	// MissingLessons — leçons prérequises non complétées.
	MissingLessons []string
	// MissingConcepts — concepts requis non maîtrisés.
	MissingConcepts []string
	// Reason — message lisible (utile pour l'UI).
	Reason string
}

// gate évalue les conditions de déblocage d'une leçon pour un apprenant.
//
// Les gates sont pures : elles lisent l'état du Learner mais ne le mutent pas.
type gate struct {
	registry *curriculum.Registry
}

func newGate(registry *curriculum.Registry) *gate {
	return &gate{registry: registry}
}

// EvaluateLesson vérifie si une leçon est accessible.
func (g *gate) EvaluateLesson(learner *domain.Learner, lessonID string) UnlockResult {
	lesson, ok := g.registry.Lesson(lessonID)
	if !ok {
		return UnlockResult{
			Unlocked: false,
			Reason:   fmt.Sprintf("leçon %q absente du registre", lessonID),
		}
	}

	missingLessons := g.checkPreviousLessons(learner, lesson.Prerequisites.PreviousLessonIDs)
	missingConcepts := g.checkRequiredConcepts(learner, lesson.Prerequisites.RequiredConceptIDs)

	// Vérifier aussi les prérequis du module parent.
	if module, ok := g.registry.Module(lesson.ModuleID); ok {
		modMissing := g.checkPreviousModules(learner, module.Prerequisites.PreviousModuleIDs)
		missingLessons = append(missingLessons, modMissing...)
		modMissingConcepts := g.checkRequiredConcepts(learner,
			module.Prerequisites.RequiredConceptIDs)
		missingConcepts = append(missingConcepts, modMissingConcepts...)
	}

	// Vérifier aussi les prérequis du programme parent.
	if module, ok := g.registry.Module(lesson.ModuleID); ok {
		if program, ok := g.registry.Program(module.ProgramID); ok {
			progMissing := g.checkPreviousPrograms(learner, program.Prerequisites.PreviousProgramIDs)
			missingLessons = append(missingLessons, progMissing...)
			if program.Prerequisites.MinLevel > 0 && learner.Level < program.Prerequisites.MinLevel {
				return UnlockResult{
					Unlocked: false,
					Reason: fmt.Sprintf("niveau %d requis (actuel : %d)",
						program.Prerequisites.MinLevel, learner.Level),
				}
			}
			if program.Prerequisites.MinXP > 0 && learner.XP < program.Prerequisites.MinXP {
				return UnlockResult{
					Unlocked: false,
					Reason: fmt.Sprintf("%d XP requis (actuel : %d)",
						program.Prerequisites.MinXP, learner.XP),
				}
			}
		}
	}

	if len(missingLessons) == 0 && len(missingConcepts) == 0 {
		return UnlockResult{Unlocked: true}
	}

	return UnlockResult{
		Unlocked:        false,
		MissingLessons:  dedupe(missingLessons),
		MissingConcepts: dedupe(missingConcepts),
		Reason:          buildUnlockReason(missingLessons, missingConcepts),
	}
}

// EvaluateModule vérifie si un module est entièrement accessible.
func (g *gate) EvaluateModule(learner *domain.Learner, moduleID string) UnlockResult {
	module, ok := g.registry.Module(moduleID)
	if !ok {
		return UnlockResult{
			Unlocked: false,
			Reason:   fmt.Sprintf("module %q absent du registre", moduleID),
		}
	}
	missing := g.checkPreviousModules(learner, module.Prerequisites.PreviousModuleIDs)
	missingConcepts := g.checkRequiredConcepts(learner, module.Prerequisites.RequiredConceptIDs)
	if len(missing) == 0 && len(missingConcepts) == 0 {
		return UnlockResult{Unlocked: true}
	}
	return UnlockResult{
		Unlocked:        false,
		MissingLessons:  dedupe(missing),
		MissingConcepts: dedupe(missingConcepts),
		Reason:          buildUnlockReason(missing, missingConcepts),
	}
}

/* ─── Checks élémentaires ─────────────────────────────────────────────── */

// checkPreviousLessons renvoie les IDs des leçons prérequises non terminées.
func (g *gate) checkPreviousLessons(learner *domain.Learner, lessonIDs []string) []string {
	var missing []string
	for _, id := range lessonIDs {
		progress, ok := learner.LessonProgress[id]
		if !ok || !progress.IsCompleted() {
			missing = append(missing, id)
		}
	}
	return missing
}

// checkPreviousModules renvoie les IDs des leçons des modules précédents
// non terminées.
func (g *gate) checkPreviousModules(learner *domain.Learner, moduleIDs []string) []string {
	var missing []string
	for _, mid := range moduleIDs {
		mod, ok := g.registry.Module(mid)
		if !ok {
			continue
		}
		for _, lesson := range mod.Lessons {
			progress, ok := learner.LessonProgress[lesson.ID]
			if !ok || !progress.IsCompleted() {
				missing = append(missing, lesson.ID)
			}
		}
	}
	return missing
}

// checkPreviousPrograms vérifie que tous les programmes précédents sont
// terminés (toutes les leçons de chaque module).
func (g *gate) checkPreviousPrograms(learner *domain.Learner, programIDs []string) []string {
	var missing []string
	for _, pid := range programIDs {
		prog, ok := g.registry.Program(pid)
		if !ok {
			continue
		}
		for _, mod := range prog.Modules {
			for _, lesson := range mod.Lessons {
				progress, ok := learner.LessonProgress[lesson.ID]
				if !ok || !progress.IsCompleted() {
					missing = append(missing, lesson.ID)
				}
			}
		}
	}
	return missing
}

// checkRequiredConcepts vérifie que les concepts requis sont maîtrisés.
func (g *gate) checkRequiredConcepts(learner *domain.Learner, conceptIDs []string) []string {
	var missing []string
	for _, cid := range conceptIDs {
		m, ok := learner.ConceptMastery[cid]
		if !ok || !m.IsMastered() {
			missing = append(missing, cid)
		}
	}
	return missing
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

func dedupe(in []string) []string {
	if len(in) == 0 {
		return nil
	}
	seen := make(map[string]struct{}, len(in))
	out := make([]string, 0, len(in))
	for _, s := range in {
		if _, dup := seen[s]; dup {
			continue
		}
		seen[s] = struct{}{}
		out = append(out, s)
	}
	return out
}

func buildUnlockReason(missingLessons, missingConcepts []string) string {
	switch {
	case len(missingLessons) > 0 && len(missingConcepts) > 0:
		return fmt.Sprintf("%d leçon(s) prérequise(s) et %d concept(s) à maîtriser",
			len(missingLessons), len(missingConcepts))
	case len(missingLessons) > 0:
		return fmt.Sprintf("%d leçon(s) prérequise(s) à terminer", len(missingLessons))
	case len(missingConcepts) > 0:
		return fmt.Sprintf("%d concept(s) à maîtriser", len(missingConcepts))
	default:
		return ""
	}
}