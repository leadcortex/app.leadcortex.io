// backend/academy/internal/domain/errors.go

package domain

import (
	"errors"
	"fmt"
)

var (
	ErrNotFound = errors.New("domain: entité introuvable")

	ErrInvalid = errors.New("domain: entité invalide")

	ErrConflict = errors.New("domain: conflit")

	ErrPrerequisiteNotMet = errors.New("domain: prérequis non satisfait")

	ErrLocked = errors.New("domain: ressource verrouillée")

	ErrAlreadyCompleted = errors.New("domain: action déjà effectuée")
)

type ValidationError struct {
	Entity string
	Field  string
	Reason string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s: champ %q — %s", e.Entity, e.Field, e.Reason)
}

func (e *ValidationError) Unwrap() error { return ErrInvalid }

func NewValidationError(entity, field, reason string) *ValidationError {
	return &ValidationError{Entity: entity, Field: field, Reason: reason}
}