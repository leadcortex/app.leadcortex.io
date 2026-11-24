// backend/academy/internal/progress/gates.go

package progress

import (
	"fmt"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

type UnlockResult struct {
	Unlocked bool
	MissingLessons []string
	MissingConcepts []string
	Reason string
}

type gate struct {
	registry *curriculum.Registry
}

func newGate(registry *curriculum.Registry) *gate {
	return &gate{registry: registry}
}

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

	if module, ok := g.registry.Module(lesson.ModuleID); ok {
		modMissing := g.checkPreviousModules(learner, module.Prerequisites.PreviousModuleIDs)
		missingLessons = append(missingLessons, modMissing...)
		modMissingConcepts := g.checkRequiredConcepts(learner,
			module.Prerequisites.RequiredConceptIDs)
		missingConcepts = append(missingConcepts, modMissingConcepts...)
	}

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