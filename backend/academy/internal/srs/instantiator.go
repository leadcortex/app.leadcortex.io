// backend/academy/internal/srs/instantiator.go

package srs

import (
	"fmt"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

type InstantiateOptions struct {
	LearnerID string

	LessonID string

	Now time.Time

	IDPrefix string
}

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

func CardsByConcept(cards []domain.SrsCard) map[string][]domain.SrsCard {
	out := make(map[string][]domain.SrsCard)
	for _, c := range cards {
		out[c.ConceptID] = append(out[c.ConceptID], c)
	}
	return out
}