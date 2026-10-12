package curriculum

import (
	"fmt"

	"github.com/leadcortex/academy/internal/domain"
)

// Resolver répond à des questions sur les dépendances entre leçons et
// modules (transitivité, cycles).
type Resolver struct {
	registry *Registry
}

// NewResolver — construit un resolver adossé au registre.
func NewResolver(r *Registry) *Resolver {
	return &Resolver{registry: r}
}

// ResolveLessonPrereqs renvoie l'ensemble (transitif) des leçons qui
// doivent être terminées avant `lessonID`.
//
// En cas de cycle, renvoie une erreur explicite.
func (r *Resolver) ResolveLessonPrereqs(lessonID string) ([]string, error) {
	visited := map[string]bool{}
	var order []string
	var stack []string

	var walk func(id string) error
	walk = func(id string) error {
		if visited[id] {
			return nil
		}
		for _, ancestor := range stack {
			if ancestor == id {
				return fmt.Errorf("%w : %s", ErrCyclicDependency, append(stack, id))
			}
		}
		stack = append(stack, id)
		defer func() { stack = stack[:len(stack)-1] }()

		l, ok := r.registry.Lesson(id)
		if !ok {
			return NewFileError("<registry>", 0, ErrInvalidReference,
				fmt.Sprintf("leçon introuvable : %q", id))
		}
		for _, pid := range l.Prerequisites.PreviousLessonIDs {
			if err := walk(pid); err != nil {
				return err
			}
		}
		visited[id] = true
		order = append(order, id)
		return nil
	}

	if err := walk(lessonID); err != nil {
		return nil, err
	}

	// Le dernier élément de `order` est la leçon elle-même : on l'exclut.
	if len(order) > 0 {
		order = order[:len(order)-1]
	}
	return order, nil
}

// CheckNoCycles vérifie l'absence de cycle de prérequis entre leçons.
func (r *Resolver) CheckNoCycles() []ValidationIssue {
	var issues []ValidationIssue
	for _, l := range r.registry.AllLessons() {
		if _, err := r.ResolveLessonPrereqs(l.ID); err != nil {
			issues = append(issues, issue(SeverityError, "Lesson", l.ID, "",
				fmt.Sprintf("cycle de prérequis : %v", err), err))
		}
	}
	return issues
}

// ResolveProgramLessons renvoie toutes les leçons d'un programme, dans
// l'ordre d'apprentissage recommandé (résolution topologique).
func (r *Resolver) ResolveProgramLessons(programID string) ([]*domain.Lesson, error) {
	p, ok := r.registry.Program(programID)
	if !ok {
		return nil, NewFileError("<registry>", 0, ErrInvalidReference,
			fmt.Sprintf("programme introuvable : %q", programID))
	}
	var lessons []*domain.Lesson
	for _, m := range p.Modules {
		for _, l := range m.Lessons {
			lCopy := l // copie pour éviter la capture par référence
			lessons = append(lessons, &lCopy)
		}
	}
	return lessons, nil
}