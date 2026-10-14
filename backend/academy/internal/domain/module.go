package domain

// Module est une subdivision d'un programme. Exemple pour "Foundations" :
// "Bases de la prospection", "ICP & Persona", "Funnel & Signaux".
//
// Le champ Chapter permet de regrouper les modules en chapitres
// (1 = fondations, 2 = pratique). 0 = non spécifié (traité comme 1).
type Module struct {
	// ID — identifiant stable, ex. "p1-m2".
	ID string

	// ProgramID — ID du programme parent.
	ProgramID string

	// Order — ordre dans le programme (1-based).
	Order int

	// Chapter — chapitre auquel appartient ce module (1 ou 2).
	// 0 = non spécifié, traité comme 1 par les consommateurs.
	Chapter int

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

// EffectiveChapter renvoie le chapitre effectif (1 si non spécifié).
func (m Module) EffectiveChapter() int {
	if m.Chapter <= 0 {
		return 1
	}
	return m.Chapter
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