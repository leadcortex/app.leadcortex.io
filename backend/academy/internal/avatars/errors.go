// backend/academy/internal/avatars/errors.go

package avatars

import "errors"

var (
	ErrUnknownAvatar = errors.New("avatars: avatar introuvable")

	ErrUnknownPose = errors.New("avatars: pose inconnue")

	ErrUnknownTier = errors.New("avatars: tier inconnu")

	ErrInvalidContext = errors.New("avatars: contexte invalide")

	ErrUnknownUnlockKind = errors.New("avatars: type de déblocage inconnu")

	ErrInvalidUnlockValue = errors.New("avatars: valeur de déblocage invalide")

	ErrCatalogDuplicate = errors.New("avatars: identifiant dupliqué dans le catalogue")
)