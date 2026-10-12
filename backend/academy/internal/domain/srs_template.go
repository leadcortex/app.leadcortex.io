package domain

// SrsCardTemplate est un modèle de carte SRS déclaré dans une leçon YAML.
// À la complétion de la leçon, une SrsCard est créée pour chaque template
// (voir package srs, Partie 6).
type SrsCardTemplate struct {
	// ConceptID — concept évalué par cette carte.
	ConceptID string

	// Front — face avant (question).
	Front string

	// Back — face arrière (réponse).
	Back string
}

// Validate vérifie les invariants.
func (t SrsCardTemplate) Validate() error {
	if t.ConceptID == "" {
		return NewValidationError("SrsCardTemplate", "concept_id", "obligatoire")
	}
	if t.Front == "" {
		return NewValidationError("SrsCardTemplate", "front", "obligatoire")
	}
	if t.Back == "" {
		return NewValidationError("SrsCardTemplate", "back", "obligatoire")
	}
	return nil
}