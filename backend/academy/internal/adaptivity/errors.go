package adaptivity

import "errors"

// Erreurs sentinel du package adaptivity.
var (
	// ErrNilLearner — un Learner nil a été fourni.
	ErrNilLearner = errors.New("adaptivity: learner nil")

	// ErrNilRegistry — un Registry nil a été fourni alors qu'il est requis.
	ErrNilRegistry = errors.New("adaptivity: registry nil")

	// ErrInvalidMode — le mode de plan demandé n'existe pas.
	ErrInvalidMode = errors.New("adaptivity: mode de plan invalide")

	// ErrNoCandidate — aucune action candidate ne peut être produite
	// (curriculum vide, learner vierge sans contexte).
	ErrNoCandidate = errors.New("adaptivity: aucune action candidate")

	// ErrInvalidSignal — un signal est malformé (kind vide, sévérité hors
	// bornes).
	ErrInvalidSignal = errors.New("adaptivity: signal invalide")
)