// backend/academy/internal/srs/errors.go

package srs

import (
	"errors"
	"fmt"
)

var (
	ErrCardNotDue = errors.New("srs: carte non due")

	ErrInvalidQuality = errors.New("srs: qualité de réponse invalide")

	ErrInvalidCard = errors.New("srs: carte invalide")

	ErrCardNotFound = errors.New("srs: carte introuvable")

	ErrEmptyTemplates = errors.New("srs: aucun template SRS à instancier")
)

type ReviewError struct {
	CardID  string
	Quality int
	Reason  string
	Cause   error
}

func (e *ReviewError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("révision de %s (q=%d) : %s — %v",
			e.CardID, e.Quality, e.Reason, e.Cause)
	}
	return fmt.Sprintf("révision de %s (q=%d) : %s", e.CardID, e.Quality, e.Reason)
}

func (e *ReviewError) Unwrap() error { return e.Cause }

func NewReviewError(cardID string, quality int, reason string, cause error) *ReviewError {
	return &ReviewError{CardID: cardID, Quality: quality, Reason: reason, Cause: cause}
}