package avatars

import "errors"

// Erreurs sentinel du package avatars.
var (
	// ErrUnknownAvatar — l'avatar demandé n'existe pas dans le catalogue.
	ErrUnknownAvatar = errors.New("avatars: avatar introuvable")

	// ErrUnknownPose — la pose demandée n'est pas valide pour cet avatar.
	ErrUnknownPose = errors.New("avatars: pose inconnue")

	// ErrUnknownTier — le tier demandé n'existe pas.
	ErrUnknownTier = errors.New("avatars: tier inconnu")

	// ErrInvalidContext — le contexte de déblocage est incomplet.
	ErrInvalidContext = errors.New("avatars: contexte invalide")

	// ErrUnknownUnlockKind — le type de déblocage n'est pas reconnu.
	ErrUnknownUnlockKind = errors.New("avatars: type de déblocage inconnu")

	// ErrInvalidUnlockValue — la valeur d'un déblocage est malformée
	// (ex. entier attendu, chaîne fournie).
	ErrInvalidUnlockValue = errors.New("avatars: valeur de déblocage invalide")

	// ErrCatalogDuplicate — un identifiant est présent deux fois dans le
	// catalogue.
	ErrCatalogDuplicate = errors.New("avatars: identifiant dupliqué dans le catalogue")
)