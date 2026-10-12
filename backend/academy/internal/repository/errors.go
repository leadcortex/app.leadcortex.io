package repository

import "errors"

// Erreurs sentinel du package repository.
//
// L'API mappe ces sentinelles vers les codes HTTP appropriés (voir
// api/errors.go) : 404 pour ErrNotFound, 409 pour ErrConflict, etc.
var (
	// ErrNotFound — l'entité demandée n'existe pas.
	ErrNotFound = errors.New("repository: entité introuvable")

	// ErrConflict — conflit d'unicité ou de version (création avec un
	// ID déjà existant, save concurrent…).
	ErrConflict = errors.New("repository: conflit")

	// ErrInvalidArgument — argument invalide (ID vide, date zéro…).
	ErrInvalidArgument = errors.New("repository: argument invalide")

	// ErrNotImplemented — opération non supportée par cette implémentation.
	ErrNotImplemented = errors.New("repository: non implémenté")

	// ErrClosed — opération tentée sur un repository fermé.
	ErrClosed = errors.New("repository: déjà fermé")
)