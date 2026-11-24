// backend/academy/internal/repository/repository.go

package repository

import (
	"context"
	"time"

	"github.com/leadcortex/academy/internal/domain"
	"github.com/leadcortex/academy/internal/gamification"
)

type Repository interface {

	GetLearner(ctx context.Context, learnerID string) (*domain.Learner, error)

	SaveLearner(ctx context.Context, l *domain.Learner) error

	DeleteLearner(ctx context.Context, learnerID string) error

	ListLearners(ctx context.Context) ([]*domain.Learner, error)


	GetSrsCards(ctx context.Context, learnerID string) ([]domain.SrsCard, error)

	SaveSrsCards(ctx context.Context, learnerID string, cards []domain.SrsCard) error


	GetQuests(ctx context.Context, learnerID string, date time.Time) ([]gamification.Quest, error)

	SaveQuests(ctx context.Context, learnerID string, date time.Time, quests []gamification.Quest) error


	AppendEvent(ctx context.Context, learnerID string, ev StoredEvent) error

	ListRecentEvents(ctx context.Context, learnerID string, limit int) ([]StoredEvent, error)


	Ping(ctx context.Context) error

	Close() error
}

type StoredEvent struct {
	ID string `json:"id"`

	Kind string `json:"kind"`

	At time.Time `json:"at"`

	Payload map[string]any `json:"payload,omitempty"`
}

const DefaultLearnerID = "default"

const DefaultTenantID = "tenant-default"

const maxStoredEvents = 500