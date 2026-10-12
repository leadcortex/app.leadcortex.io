package domain

// Module est une subdivision d'un programme. Exemple pour "Foundations" :
// "Bases de la prospection", "ICP & Persona", "Funnel & Signaux".
type Module struct {
	// ID — identifiant stable, ex. "p1-m2".
	ID string

	// ProgramID — ID du programme parent.
	ProgramID string

	// Order — ordre dans le programme (1-based).
	Order int

	// Title — titre lisible.
	Title string

	// Description — phrase d'accroche.
	Description string

	// Lessons — leçons ordonnées.
	Lessons []Lesson

	// Prerequisites — conditions pour débloquer ce module.
	Prerequisites ModulePrerequisites
}

// ModulePrerequisites définit quand un module devient accessible.
type ModulePrerequisites struct {
	// PreviousModuleIDs — ces modules doivent être terminés.
	PreviousModuleIDs []string

	// RequiredConceptIDs — ces concepts doivent être au moins vus.
	RequiredConceptIDs []string
}

// Validate vérifie les invariants.
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

// TotalXP renvoie l'XP totale distribuable dans ce module.
func (m Module) TotalXP() int {
	n := 0
	for _, l := range m.Lessons {
		n += l.XPTotal
	}
	return n
}

// EstimatedMinutes renvoie la durée totale estimée du module.
func (m Module) EstimatedMinutes() int {
	n := 0
	for _, l := range m.Lessons {
		n += l.DurationMin
	}
	return n
}