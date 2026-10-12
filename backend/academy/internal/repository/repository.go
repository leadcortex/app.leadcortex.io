package repository

import (
	"context"
	"time"

	"github.com/leadcortex/academy/internal/domain"
	"github.com/leadcortex/academy/internal/gamification"
)

// Repository est le contrat de persistance de l'academy.
//
// Toutes les méthodes prennent un context.Context (annulation, deadline,
// tracing). L'implémentation Memory l'accepte mais ne s'en sert pas
// activement ; l'implémentation SQL l'utilisera pour les requêtes.
type Repository interface {
	// ─── Learner ──────────────────────────────────────────────────────

	// GetLearner retourne une copie du Learner identifié par learnerID.
	// Renvoie ErrNotFound si l'apprenant n'existe pas.
	GetLearner(ctx context.Context, learnerID string) (*domain.Learner, error)

	// SaveLearner crée ou met à jour le Learner. La copie est défensive :
	// l'appelant peut modifier son objet après l'appel sans impacter le
	// repository.
	SaveLearner(ctx context.Context, l *domain.Learner) error

	// DeleteLearner supprime le Learner et toutes ses données associées.
	// Idempotent (pas d'erreur si l'apprenant n'existe plus).
	DeleteLearner(ctx context.Context, learnerID string) error

	// ListLearners retourne tous les Learners connus (mono-utilisateur :
	// au plus un en V1).
	ListLearners(ctx context.Context) ([]*domain.Learner, error)

	// ─── SRS ──────────────────────────────────────────────────────────

	// GetSrsCards retourne toutes les cartes SRS d'un apprenant.
	// Slice vide (non nil) si aucune carte.
	GetSrsCards(ctx context.Context, learnerID string) ([]domain.SrsCard, error)

	// SaveSrsCards remplace la collection complète des cartes SRS d'un
	// apprenant (delete + insert atomique).
	SaveSrsCards(ctx context.Context, learnerID string, cards []domain.SrsCard) error

	// ─── Quests ───────────────────────────────────────────────────────

	// GetQuests retourne les quêtes quotidiennes d'un apprenant pour une
	// date donnée (jour civil UTC). Slice vide si aucune quête.
	GetQuests(ctx context.Context, learnerID string, date time.Time) ([]gamification.Quest, error)

	// SaveQuests remplace la collection de quêtes d'un apprenant pour
	// une date donnée.
	SaveQuests(ctx context.Context, learnerID string, date time.Time, quests []gamification.Quest) error

	// ─── Event log ────────────────────────────────────────────────────

	// AppendEvent ajoute un événement au journal borné de l'apprenant.
	// La taille maximale du journal est fixée par l'implémentation
	// (les plus anciens événements sont éjectés).
	AppendEvent(ctx context.Context, learnerID string, ev StoredEvent) error

	// ListRecentEvents retourne les N derniers événements d'un apprenant,
	// du plus récent au plus ancien. Si limit <= 0, retourne tous les
	// événements conservés.
	ListRecentEvents(ctx context.Context, learnerID string, limit int) ([]StoredEvent, error)

	// ─── Cycle de vie ─────────────────────────────────────────────────

	// Ping vérifie que le repository répond. Utilisé par /readyz.
	Ping(ctx context.Context) error

	// Close libère les ressources. Idempotent.
	Close() error
}

// StoredEvent est la représentation persistée d'un événement métier.
// C'est volontairement minimal (pas de dépendance vers missions.BusinessEvent
// pour éviter une dépendance circulaire).
type StoredEvent struct {
	// ID — identifiant unique de l'événement (généré par l'appelant).
	ID string `json:"id"`

	// Kind — type d'événement, ex. "lead.created".
	Kind string `json:"kind"`

	// At — instant d'occurrence (UTC).
	At time.Time `json:"at"`

	// Payload — données brutes de l'événement (aplaties ou non).
	Payload map[string]any `json:"payload,omitempty"`
}

// DefaultLearnerID est l'identifiant du Learner mono-utilisateur en V1.
// L'API l'utilise comme fallback quand aucun header X-Learner-ID n'est
// fourni en développement.
const DefaultLearnerID = "default"

// DefaultTenantID est le TenantID par défaut (multi-tenant futur).
const DefaultTenantID = "tenant-default"

// maxStoredEvents par défaut — surchargé par l'implémentation.
const maxStoredEvents = 500