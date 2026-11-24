// backend/academy/internal/missions/errors.go

package missions

import "errors"

var (
	ErrUnknownEvent = errors.New("missions: type d'événement inconnu")

	ErrInvalidEvent = errors.New("missions: événement invalide")

	ErrUnknownMission = errors.New("missions: mission introuvable")

	ErrUnknownLesson = errors.New("missions: leçon introuvable")

	ErrBusClosed = errors.New("missions: bus fermé")

	ErrSubscriberFull = errors.New("missions: abonné saturé")

	ErrNilLearner = errors.New("missions: learner nil")

	ErrNilRegistry = errors.New("missions: registry nil")

	ErrSimulationFailed = errors.New("missions: simulation échouée")
)