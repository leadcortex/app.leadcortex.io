package domain

import "time"

// Program est un grand ensemble pédagogique. Exemple : "Foundations",
// "Prospection outbound", "Closing & post-vente".
type Program struct {
	// ID — identifiant stable, ex. "p1-foundations".
	ID string

	// Order — ordre d'affichage et de déblocage (1 = premier).
	Order int

	// Title — titre lisible, ex. "Foundations".
	Title string

	// Subtitle — sous-titre court affiché dans les cartes.
	Subtitle string

	// Description — phrase d'accroche (1-2 lignes).
	Description string

	// Icon — nom logique d'icône (résolu côté UI React).
	Icon string

	// Color — couleur d'accent (hex ou token), pour l'UI.
	Color string

	// Modules — modules ordonnés qui composent le programme.
	Modules []Module

	// Prerequisites — conditions pour débloquer ce programme.
	Prerequisites ProgramPrerequisites

	// EstimatedMinutes — durée totale estimée (minutes).
	EstimatedMinutes int

	// Difficulty — niveau global 1-5.
	Difficulty int
}

// ProgramPrerequisites définit quand un programme devient accessible.
type ProgramPrerequisites struct {
	// PreviousProgramIDs — tous ces programmes doivent être terminés.
	PreviousProgramIDs []string

	// MinLevel — niveau minimum de l'apprenant (0 = pas de contrainte).
	MinLevel int

	// MinXP — XP minimum (0 = pas de contrainte).
	MinXP int
}

// Validate vérifie les invariants.
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
	// Évite l'import de strconv pour rester minimal dans le domaine.
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

// TotalLessons renvoie le nombre total de leçons du programme.
func (p Program) TotalLessons() int {
	n := 0
	for _, m := range p.Modules {
		n += len(m.Lessons)
	}
	return n
}

// ProgramProgress regroupe l'état de progression d'un apprenant sur un
// programme donné.
type ProgramProgress struct {
	ProgramID string

	// StartedAt — date de première activité sur ce programme.
	StartedAt time.Time

	// CompletedAt — date de complétion, zéro si non terminé.
	CompletedAt time.Time

	// CompletedLessonIDs — IDs des leçons terminées du programme.
	CompletedLessonIDs []string

	// TotalXP — XP gagnée sur ce programme.
	TotalXP int
}

// IsCompleted indique si toutes les leçons sont terminées.
func (p ProgramProgress) IsCompleted() bool {
	return !p.CompletedAt.IsZero()
}

// ProgressRatio renvoie le ratio d'avancement (0-1) si l'on connaît
// le nombre total de leçons. Renvoie 0 si total = 0.
func (p ProgramProgress) ProgressRatio(totalLessons int) float64 {
	if totalLessons == 0 {
		return 0
	}
	return float64(len(p.CompletedLessonIDs)) / float64(totalLessons)
}