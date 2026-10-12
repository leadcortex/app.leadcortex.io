package domain

import "time"

// Concept est une notion enseignée dans une ou plusieurs leçons.
// C'est l'unité atomique du spaced repetition : à chaque concept
// correspondent une ou plusieurs cartes SRS et un niveau de maîtrise.
type Concept struct {
	// ID — identifiant stable, snake_case, ex. "icp_definition".
	ID string

	// Label — libellé court affiché à l'apprenant, ex. "Définition ICP".
	Label string

	// Description — phrase optionnelle pour clarifier le concept.
	Description string
}

// Validate vérifie les invariants de base.
func (c Concept) Validate() error {
	if c.ID == "" {
		return NewValidationError("Concept", "id", "obligatoire")
	}
	if c.Label == "" {
		return NewValidationError("Concept", "label", "obligatoire")
	}
	return nil
}

// MasteryLevel est un palier de maîtrise d'un concept (0-100).
// Le seuil "maîtrisé" est défini à 80 (voir IsMastered).
type MasteryLevel int

const (
	// MasteryUnseen : jamais évalué.
	MasteryUnseen MasteryLevel = 0
	// MasteryFragile : vu une fois, mais pas consolidé (< 40).
	MasteryFragile MasteryLevel = 30
	// MasteryOK : maîtrise partielle (40-79).
	MasteryOK MasteryLevel = 60
	// MasteryMastered : maîtrise solide (>= 80).
	MasteryMastered MasteryLevel = 80
)

// Mastery regroupe l'état de maîtrise d'un concept par un apprenant.
// C'est le feedback utilisé par la partie 10 (adaptatif) pour choisir
// les prochaines leçons et les révisions SRS.
type Mastery struct {
	ConceptID string
	Level     MasteryLevel

	// Attempts — nombre total de tentatives d'exercices liés à ce concept.
	Attempts int
	// Correct — nombre de tentatives réussies.
	Correct int

	// LastReviewed — dernière interaction (exercice ou carte SRS).
	LastReviewed time.Time
	// NextReviewAt — date de la prochaine révision SRS (voir SrsCard).
	NextReviewAt time.Time
}

// Accuracy renvoie le taux de réussite (0-1). Renvoie 0 si aucun essai.
func (m Mastery) Accuracy() float64 {
	if m.Attempts == 0 {
		return 0
	}
	return float64(m.Correct) / float64(m.Attempts)
}

// IsMastered indique si le concept est considéré comme maîtrisé.
func (m Mastery) IsMastered() bool {
	return m.Level >= MasteryMastered
}