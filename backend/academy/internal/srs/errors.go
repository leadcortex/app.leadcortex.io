package srs

import (
	"errors"
	"fmt"
)

// Erreurs sentinel du moteur SRS.
var (
	// ErrCardNotDue — la carte n'est pas encore prête à être révisée.
	ErrCardNotDue = errors.New("srs: carte non due")

	// ErrInvalidQuality — la qualité de réponse est hors limites (0-5).
	ErrInvalidQuality = errors.New("srs: qualité de réponse invalide")

	// ErrInvalidCard — la carte est malformée ou contient des valeurs
	// incohérentes (ease factor hors bornes, intervalle négatif…).
	ErrInvalidCard = errors.New("srs: carte invalide")

	// ErrCardNotFound — la carte référencée n'existe pas.
	ErrCardNotFound = errors.New("srs: carte introuvable")

	// ErrEmptyTemplates — la leçon ne contient aucun template SRS.
	ErrEmptyTemplates = errors.New("srs: aucun template SRS à instancier")
)

// ReviewError attache un contexte à une erreur de révision.
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

// NewReviewError — helper de construction.
func NewReviewError(cardID string, quality int, reason string, cause error) *ReviewError {
	return &ReviewError{CardID: cardID, Quality: quality, Reason: reason, Cause: cause}
}