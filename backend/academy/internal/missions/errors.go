package missions

import "errors"

// Erreurs sentinel du package missions.
var (
	// ErrUnknownEvent — le type d'événement n'est pas reconnu (pas
	// levée par le bus, mais par les helpers de dispatch).
	ErrUnknownEvent = errors.New("missions: type d'événement inconnu")

	// ErrInvalidEvent — l'événement est malformé (Kind vide, payload
	// non conforme…).
	ErrInvalidEvent = errors.New("missions: événement invalide")

	// ErrUnknownMission — la mission référencée n'existe pas.
	ErrUnknownMission = errors.New("missions: mission introuvable")

	// ErrUnknownLesson — la leçon référencée n'existe pas.
	ErrUnknownLesson = errors.New("missions: leçon introuvable")

	// ErrBusClosed — une opération a été tentée sur un bus fermé.
	ErrBusClosed = errors.New("missions: bus fermé")

	// ErrSubscriberFull — le canal d'un abonné est plein ; l'événement
	// a été perdu (non bloquant côté Publish, mais signalé).
	ErrSubscriberFull = errors.New("missions: abonné saturé")

	// ErrNilLearner — un Learner nil a été fourni à une fonction qui
	// l'exige.
	ErrNilLearner = errors.New("missions: learner nil")

	// ErrNilRegistry — un Registry nil a été fourni à l'Orchestrator.
	ErrNilRegistry = errors.New("missions: registry nil")

	// ErrSimulationFailed — une simulation a échoué (résultat non
	// conforme aux attentes).
	ErrSimulationFailed = errors.New("missions: simulation échouée")
)