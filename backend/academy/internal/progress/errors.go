package progress

import (
	"errors"
	"fmt"

	"github.com/leadcortex/academy/internal/domain"
)

// Erreurs sentinel du moteur de progression.
//
// Ces sentinelles permettent aux appelants (API, tests) de classifier
// les erreurs sans dépendre des messages. Elles sont toutes enveloppées
// via fmt.Errorf("...: %w", ErrXxx) dans le code du package.
var (
	// ErrLessonNotInRegistry — la leçon référencée par un événement
	// n'existe pas dans le curriculum.
	ErrLessonNotInRegistry = errors.New("progress: leçon absente du registre")

	// ErrLessonNotStarted — un événement a été reçu pour une leçon qui
	// n'a jamais été démarrée (pas de LessonProgress enregistré).
	ErrLessonNotStarted = errors.New("progress: leçon non démarrée")

	// ErrBlockOutOfOrder — l'index de bloc fourni est hors des bornes
	// de la leçon, ou l'ordre des événements est incohérent.
	ErrBlockOutOfOrder = errors.New("progress: bloc hors séquence")

	// ErrInvalidEvent — l'événement est malformé (champ manquant, type
	// inconnu, valeur hors bornes).
	ErrInvalidEvent = errors.New("progress: événement invalide")
)

// TransitionError décrit une transition FSM refusée.
//
// Utilisée par fsm.go (assertTransition) et par engine.go lorsqu'une
// transition d'état est demandée depuis un état incompatible.
type TransitionError struct {
	// LessonID — leçon concernée.
	LessonID string

	// From — état actuel.
	From domain.LessonStatus

	// To — état cible refusé.
	To domain.LessonStatus

	// Reason — explication lisible.
	Reason string
}

func (e *TransitionError) Error() string {
	return fmt.Sprintf(
		"progress: transition refusée pour %s : %s → %s (%s)",
		e.LessonID, e.From, e.To, e.Reason,
	)
}

// Unwrap permet à errors.Is/As de classifier une TransitionError comme
// ErrInvalidEvent (une transition refusée est un événement invalide du
// point de vue de la FSM).
func (e *TransitionError) Unwrap() error { return ErrInvalidEvent }

// UnlockError décrit un accès refusé par un gate.
//
// Utilisée par engine.go quand un LessonStarted est reçu pour une leçon
// dont les prérequis ne sont pas satisfaits.
type UnlockError struct {
	// LessonID — leçon verrouillée.
	LessonID string

	// MissingPreqs — IDs des leçons prérequises non complétées.
	MissingPreqs []string

	// MissingConcepts — IDs des concepts requis non maîtrisés.
	MissingConcepts []string

	// Reason — explication lisible produite par le gate.
	Reason string
}

func (e *UnlockError) Error() string {
	if e.Reason != "" {
		return fmt.Sprintf("progress: leçon %s verrouillée (%s)", e.LessonID, e.Reason)
	}
	return fmt.Sprintf("progress: leçon %s verrouillée", e.LessonID)
}

// Unwrap permet de classifier une UnlockError comme ErrLessonNotStarted
// (l'appelant voulait démarrer une leçon mais celle-ci n'est pas encore
// accessible).
func (e *UnlockError) Unwrap() error { return ErrLessonNotStarted }

/* ─── Helpers de classification ───────────────────────────────────────── */

// IsLessonNotInRegistry — raccourci d'usage courant.
func IsLessonNotInRegistry(err error) bool {
	return errors.Is(err, ErrLessonNotInRegistry)
}

// IsLessonNotStarted — raccourci d'usage courant.
func IsLessonNotStarted(err error) bool {
	return errors.Is(err, ErrLessonNotStarted)
}

// IsBlockOutOfOrder — raccourci d'usage courant.
func IsBlockOutOfOrder(err error) bool {
	return errors.Is(err, ErrBlockOutOfOrder)
}

// IsInvalidEvent — raccourci d'usage courant.
func IsInvalidEvent(err error) bool {
	return errors.Is(err, ErrInvalidEvent)
}

// IsTransitionError — indique si l'erreur est (ou enveloppe) une
// TransitionError.
func IsTransitionError(err error) bool {
	var te *TransitionError
	return errors.As(err, &te)
}

// IsUnlockError — indique si l'erreur est (ou enveloppe) une
// UnlockError.
func IsUnlockError(err error) bool {
	var ue *UnlockError
	return errors.As(err, &ue)
}