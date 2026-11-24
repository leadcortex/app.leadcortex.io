// backend/academy/internal/domain/srs_template.go

package domain

type SrsCardTemplate struct {
	ConceptID string

	Front string

	Back string
}

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