// backend/academy/internal/repository/errors.go

package repository

import "errors"

var (
	ErrNotFound = errors.New("repository: entité introuvable")

	ErrConflict = errors.New("repository: conflit")

	ErrInvalidArgument = errors.New("repository: argument invalide")

	ErrNotImplemented = errors.New("repository: non implémenté")

	ErrClosed = errors.New("repository: déjà fermé")
)