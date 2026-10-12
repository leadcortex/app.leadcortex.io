package curriculum

import (
	"fmt"

	"github.com/leadcortex/academy/internal/domain"
)

// ValidateAll effectue la validation croisée de tous les programmes :
//   - unicité des IDs à l'échelle globale (lessons, concepts, avatars, badges)
//   - cohérence des références (prereq → existe, unlocks → existe)
//   - présence d'au moins un bloc mission par leçon (règle pédagogique)
//   - concepts référencés par les leçons → déclarés dans le programme
//
// Renvoie la liste des problèmes trouvés (vide = tout OK).
func ValidateAll(programs []*domain.Program, avatars []*domain.Avatar, badges []*domain.Badge) []ValidationIssue {
	var issues []ValidationIssue

	// Index globaux.
	allLessonIDs := map[string]struct{}{}
	allConceptIDs := map[string]struct{}{}
	allAvatarIDs := map[string]struct{}{}
	allBadgeIDs := map[string]struct{}{}
	allProgramIDs := map[string]struct{}{}

	for _, a := range avatars {
		allAvatarIDs[a.ID] = struct{}{}
	}
	for _, b := range badges {
		allBadgeIDs[b.ID] = struct{}{}
	}

	for _, p := range programs {
		if _, dup := allProgramIDs[p.ID]; dup {
			issues = append(issues, issue(SeverityError, "Program", p.ID, "",
				"identifiant de programme dupliqué", nil))
		}
		allProgramIDs[p.ID] = struct{}{}
	}

	for _, p := range programs {
		issues = append(issues, validateProgram(p, allLessonIDs, allConceptIDs, allAvatarIDs, allBadgeIDs)...)
	}

	return issues
}

func validateProgram(
	p *domain.Program,
	globalLessons, globalConcepts, globalAvatars, globalBadges map[string]struct{},
) []ValidationIssue {
	var issues []ValidationIssue
	path := fmt.Sprintf("programs/%s", p.ID)

	// Concepts déclarés dans le programme.
	programConcepts := map[string]struct{}{}
	for _, m := range p.Modules {
		for _, l := range m.Lessons {
			for _, cid := range l.Concepts {
				programConcepts[cid] = struct{}{}
			}
			for _, t := range l.SrsTemplates {
				programConcepts[t.ConceptID] = struct{}{}
			}
		}
	}

	for _, m := range p.Modules {
		mPath := fmt.Sprintf("%s/modules/%s", path, m.ID)

		// Le module doit référencer des concepts connus.
		for _, cid := range m.Prerequisites.RequiredConceptIDs {
			if _, ok := programConcepts[cid]; !ok {
				issues = append(issues, issue(SeverityError, "Module", m.ID, mPath,
					fmt.Sprintf("concept requis inconnu : %q", cid), nil))
			}
		}

		for _, l := range m.Lessons {
			lPath := fmt.Sprintf("%s/lessons/%s", mPath, l.ID)

			// Unicité globale des leçons.
			if _, dup := globalLessons[l.ID]; dup {
				issues = append(issues, issue(SeverityError, "Lesson", l.ID, lPath,
					"identifiant de leçon dupliqué", nil))
			}
			globalLessons[l.ID] = struct{}{}

			// Concepts référencés par la leçon → déclarés.
			for _, cid := range l.Concepts {
				if _, ok := programConcepts[cid]; !ok {
					issues = append(issues, issue(SeverityError, "Lesson", l.ID, lPath,
						fmt.Sprintf("concept inconnu dans le programme : %q", cid), nil))
				}
				globalConcepts[cid] = struct{}{}
			}

			// Templates SRS → concept déclaré.
			for i, t := range l.SrsTemplates {
				if _, ok := programConcepts[t.ConceptID]; !ok {
					issues = append(issues, issue(SeverityError, "Lesson", l.ID, lPath,
						fmt.Sprintf("srs_templates[%d] : concept inconnu %q", i, t.ConceptID), nil))
				}
			}

			// Avatars débloqués → connus.
			for _, aid := range l.Unlocks.AvatarIDs {
				if _, ok := globalAvatars[aid]; !ok {
					issues = append(issues, issue(SeverityError, "Lesson", l.ID, lPath,
						fmt.Sprintf("avatar inconnu : %q", aid), nil))
				}
			}

			// Badges débloqués → connus.
			for _, bid := range l.Unlocks.BadgeIDs {
				if _, ok := globalBadges[bid]; !ok {
					issues = append(issues, issue(SeverityError, "Lesson", l.ID, lPath,
						fmt.Sprintf("badge inconnu : %q", bid), nil))
				}
			}

			// Règle pédagogique : une leçon doit contenir au moins un bloc mission.
			hasMission := false
			hasCover := false
			hasDebrief := false
			for _, b := range l.Blocks {
				switch b.BlockType() {
				case domain.BlockTypeMission:
					hasMission = true
				case domain.BlockTypeCover:
					hasCover = true
				case domain.BlockTypeDebrief:
					hasDebrief = true
				}
			}
			if !hasMission {
				issues = append(issues, issue(SeverityError, "Lesson", l.ID, lPath,
					"aucun bloc mission (règle pédagogique)", nil))
			}
			if !hasCover {
				issues = append(issues, issue(SeverityWarning, "Lesson", l.ID, lPath,
					"aucun bloc cover (recommandé)", nil))
			}
			if !hasDebrief {
				issues = append(issues, issue(SeverityWarning, "Lesson", l.ID, lPath,
					"aucun bloc debrief (recommandé)", nil))
			}
		}
	}

	return issues
}

func issue(sev Severity, entity, id, path, msg string, cause error) ValidationIssue {
	return ValidationIssue{
		Severity: sev,
		Entity:   entity,
		EntityID: id,
		Path:     path,
		Message:  msg,
		Cause:    cause,
	}
}

// HasErrors renvoie vrai si au moins une issue est une erreur bloquante.
func HasErrors(issues []ValidationIssue) bool {
	for _, i := range issues {
		if i.Severity == SeverityError {
			return true
		}
	}
	return false
}