// backend/academy/internal/domain/module.go

package domain

type Module struct {
	ID string

	ProgramID string

	Order int

	Chapter int

	Title string

	Description string

	Lessons []Lesson

	Prerequisites ModulePrerequisites
}

type ModulePrerequisites struct {
	PreviousModuleIDs []string

	RequiredConceptIDs []string
}

func (m Module) Validate() error {
	if m.ID == "" {
		return NewValidationError("Module", "id", "obligatoire")
	}
	if m.ProgramID == "" {
		return NewValidationError("Module", "program_id", "obligatoire")
	}
	if m.Order <= 0 {
		return NewValidationError("Module", "order", "doit être > 0")
	}
	if m.Chapter < 0 || m.Chapter > 2 {
		return NewValidationError("Module", "chapter", "doit être 0, 1 ou 2")
	}
	if m.Title == "" {
		return NewValidationError("Module", "title", "obligatoire")
	}
	if len(m.Lessons) == 0 {
		return NewValidationError("Module", "lessons", "au moins une leçon requise")
	}
	for i, l := range m.Lessons {
		if err := l.Validate(); err != nil {
			return &ValidationError{
				Entity: "Module",
				Field:  "lessons",
				Reason: "leçon " + itoa(i) + " : " + err.Error(),
			}
		}
	}
	return nil
}

func (m Module) EffectiveChapter() int {
	if m.Chapter <= 0 {
		return 1
	}
	return m.Chapter
}

func (m Module) TotalXP() int {
	n := 0
	for _, l := range m.Lessons {
		n += l.XPTotal
	}
	return n
}

func (m Module) EstimatedMinutes() int {
	n := 0
	for _, l := range m.Lessons {
		n += l.DurationMin
	}
	return n
}