package domain

import (
	"errors"
	"fmt"
)

// Sentinel errors du domaine. Les couches supérieures (curriculum, API)
// peuvent les tester via errors.Is / errors.As pour distinguer les causes.
var (
	// ErrNotFound : l'entité demandée n'existe pas.
	ErrNotFound = errors.New("domain: entité introuvable")

	// ErrInvalid : l'entité est malformée (champ manquant, invariant violé).
	ErrInvalid = errors.New("domain: entité invalide")

	// ErrConflict : conflit d'unicité ou de version (ex. même ID déjà présent).
	ErrConflict = errors.New("domain: conflit")

	// ErrPrerequisiteNotMet : une condition préalable n'est pas satisfaite.
	ErrPrerequisiteNotMet = errors.New("domain: prérequis non satisfait")

	// ErrLocked : la ressource est verrouillée (leçon non débloquée).
	ErrLocked = errors.New("domain: ressource verrouillée")

	// ErrAlreadyCompleted : l'action a déjà été effectuée (idempotence).
	ErrAlreadyCompleted = errors.New("domain: action déjà effectuée")
)

// ValidationError porte un détail structuré sur un échec de validation.
// Utilisé par les constructeurs `NewXxx()` du domaine pour expliquer
// précisément quel champ pose problème.
type ValidationError struct {
	Entity string // "Program", "Lesson", "Exercise"…
	Field  string // "id", "title", "duration_min"…
	Reason string // message lisible par un dev
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s: champ %q — %s", e.Entity, e.Field, e.Reason)
}

func (e *ValidationError) Unwrap() error { return ErrInvalid }

// NewValidationError — helper pour construire une ValidationError.
func NewValidationError(entity, field, reason string) *ValidationError {
	return &ValidationError{Entity: entity, Field: field, Reason: reason}
}