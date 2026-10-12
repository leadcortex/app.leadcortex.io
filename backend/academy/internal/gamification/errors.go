package gamification

import "errors"

// Erreurs sentinel du package gamification.
var (
	// ErrUnknownLevel — le niveau demandé est hors bornes.
	ErrUnknownLevel = errors.New("gamification: niveau inconnu")

	// ErrInvalidContext — le contexte d'évaluation est incomplet
	// (Learner nil, path non résoluble, etc.).
	ErrInvalidContext = errors.New("gamification: contexte invalide")

	// ErrUnknownPath — le path d'une condition ne peut pas être résolu.
	ErrUnknownPath = errors.New("gamification: chemin de condition introuvable")

	// ErrUnknownOperator — l'opérateur de condition n'est pas supporté.
	ErrUnknownOperator = errors.New("gamification: opérateur inconnu")

	// ErrTypeMismatch — la valeur attendue et la valeur observée ont des
	// types incompatibles.
	ErrTypeMismatch = errors.New("gamification: types incompatibles")

	// ErrQuestNotFound — la quête demandée n'existe pas dans la collection.
	ErrQuestNotFound = errors.New("gamification: quête introuvable")

	// ErrQuestAlreadyClaimed — la quête a déjà été réclamée.
	ErrQuestAlreadyClaimed = errors.New("gamification: quête déjà réclamée")

	// ErrQuestNotComplete — la quête n'est pas encore terminée.
	ErrQuestNotComplete = errors.New("gamification: quête non terminée")

	// ErrBadgeAlreadyEarned — le badge est déjà dans la collection du Learner.
	ErrBadgeAlreadyEarned = errors.New("gamification: badge déjà obtenu")

	// ErrStreakNotBroken — tentative de freeze alors que le streak est intact.
	ErrStreakNotBroken = errors.New("gamification: streak non rompu")

	// ErrHeartsAtMax — tentative de régénération alors que les cœurs sont pleins.
	ErrHeartsAtMax = errors.New("gamification: cœurs au maximum")
)