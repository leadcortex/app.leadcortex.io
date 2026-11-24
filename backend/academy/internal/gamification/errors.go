// backend/academy/internal/gamification/errors.go

package gamification

import "errors"

var (
	ErrUnknownLevel = errors.New("gamification: niveau inconnu")

	ErrInvalidContext = errors.New("gamification: contexte invalide")

	ErrUnknownPath = errors.New("gamification: chemin de condition introuvable")

	ErrUnknownOperator = errors.New("gamification: opérateur inconnu")

	ErrTypeMismatch = errors.New("gamification: types incompatibles")

	ErrQuestNotFound = errors.New("gamification: quête introuvable")

	ErrQuestAlreadyClaimed = errors.New("gamification: quête déjà réclamée")

	ErrQuestNotComplete = errors.New("gamification: quête non terminée")

	ErrBadgeAlreadyEarned = errors.New("gamification: badge déjà obtenu")

	ErrStreakNotBroken = errors.New("gamification: streak non rompu")

	ErrHeartsAtMax = errors.New("gamification: cœurs au maximum")
)