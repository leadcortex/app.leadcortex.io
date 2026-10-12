package srs

import (
	"fmt"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

// InstantiateOptions contrôle la création de cartes à partir de templates.
type InstantiateOptions struct {
	// LearnerID — l'apprenant à qui appartiennent les cartes.
	LearnerID string

	// LessonID — la leçon source (pour la traçabilité).
	LessonID string

	// Now — l'instant de création (injectable pour les tests).
	Now time.Time

	// IDPrefix — préfixe des IDs générés (défaut : "card").
	IDPrefix string
}

// InstantiateFromLesson crée une carte SRS par template déclaré dans une leçon.
//
// Si la leçon ne contient aucun template, renvoie ErrEmptyTemplates.
// L'ordre des cartes suit l'ordre des templates dans la leçon.
//
// Les IDs générés sont déterministes : "<prefix>_<lessonID>_<index>".
// Cela permet d'éviter les doublons si la même leçon est complétée deux fois.
func InstantiateFromLesson(
	lesson *domain.Lesson,
	opts InstantiateOptions,
) ([]domain.SrsCard, error) {
	if len(lesson.SrsTemplates) == 0 {
		return nil, fmt.Errorf("%w : leçon %s", ErrEmptyTemplates, lesson.ID)
	}

	prefix := opts.IDPrefix
	if prefix == "" {
		prefix = "card"
	}
	now := opts.Now
	if now.IsZero() {
		now = time.Now().UTC()
	}

	out := make([]domain.SrsCard, 0, len(lesson.SrsTemplates))
	for i, tpl := range lesson.SrsTemplates {
		id := fmt.Sprintf("%s_%s_%d", prefix, lesson.ID, i)
		card := NewCard(id, tpl, now)
		out = append(out, card)
	}
	return out, nil
}

// MergeCards fusionne de nouvelles cartes dans une collection existante,
// en évitant les doublons par ID.
//
// Les cartes existantes ne sont pas écrasées : seules les nouvelles sont
// ajoutées. Renvoie la collection fusionnée et le nombre de cartes ajoutées.
func MergeCards(existing []domain.SrsCard, incoming []domain.SrsCard) ([]domain.SrsCard, int) {
	byID := make(map[string]struct{}, len(existing))
	for _, c := range existing {
		byID[c.ID] = struct{}{}
	}

	added := 0
	merged := make([]domain.SrsCard, len(existing), len(existing)+len(incoming))
	copy(merged, existing)

	for _, c := range incoming {
		if _, exists := byID[c.ID]; exists {
			continue
		}
		byID[c.ID] = struct{}{}
		merged = append(merged, c)
		added++
	}
	return merged, added
}

// CardsByConcept regroupe des cartes par ConceptID.
func CardsByConcept(cards []domain.SrsCard) map[string][]domain.SrsCard {
	out := make(map[string][]domain.SrsCard)
	for _, c := range cards {
		out[c.ConceptID] = append(out[c.ConceptID], c)
	}
	return out
}