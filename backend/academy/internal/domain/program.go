// backend/academy/internal/domain/program.go

package domain

import "time"

type Program struct {
	ID string

	Order int

	Title string

	Subtitle string

	Description string

	Icon string

	Color string

	Modules []Module

	Prerequisites ProgramPrerequisites

	EstimatedMinutes int

	Difficulty int
}

type ProgramPrerequisites struct {
	PreviousProgramIDs []string

	MinLevel int

	MinXP int
}

func (p Program) Validate() error {
	if p.ID == "" {
		return NewValidationError("Program", "id", "obligatoire")
	}
	if p.Title == "" {
		return NewValidationError("Program", "title", "obligatoire")
	}
	if p.Order <= 0 {
		return NewValidationError("Program", "order", "doit être > 0")
	}
	if p.Difficulty < 1 || p.Difficulty > 5 {
		return NewValidationError("Program", "difficulty", "doit être entre 1 et 5")
	}
	if len(p.Modules) == 0 {
		return NewValidationError("Program", "modules", "au moins un module requis")
	}
	for i, m := range p.Modules {
		if err := m.Validate(); err != nil {
			return wrapModuleErr(i, err)
		}
	}
	return nil
}

func wrapModuleErr(i int, err error) error {
	return &ValidationError{
		Entity: "Program",
		Field:  "modules",
		Reason: "module " + itoa(i) + " : " + err.Error(),
	}
}

func itoa(i int) string {
	if i == 0 {
		return "0"
	}
	neg := false
	if i < 0 {
		neg = true
		i = -i
	}
	var buf [20]byte
	pos := len(buf)
	for i > 0 {
		pos--
		buf[pos] = byte('0' + i%10)
		i /= 10
	}
	if neg {
		pos--
		buf[pos] = '-'
	}
	return string(buf[pos:])
}

func (p Program) TotalLessons() int {
	n := 0
	for _, m := range p.Modules {
		n += len(m.Lessons)
	}
	return n
}

type ProgramProgress struct {
	ProgramID string

	StartedAt time.Time

	CompletedAt time.Time

	CompletedLessonIDs []string

	TotalXP int
}

func (p ProgramProgress) IsCompleted() bool {
	return !p.CompletedAt.IsZero()
}

func (p ProgramProgress) ProgressRatio(totalLessons int) float64 {
	if totalLessons == 0 {
		return 0
	}
	return float64(len(p.CompletedLessonIDs)) / float64(totalLessons)
}