package repository

import (
	"context"
	"sync"
	"time"

	"github.com/leadcortex/academy/internal/domain"
	"github.com/leadcortex/academy/internal/gamification"
)

// Memory est l'implémentation in-memory du Repository.
//
// Elle est safe en lecture/écriture concurrente. Les données sont
// conservées en RAM jusqu'à Close (ou fin de process). Utilisée :
//
//   - en développement (pas de PostgreSQL requis)
//   - dans les tests d'API (seed rapide)
//
// # Deep-copy défensif
//
// Toutes les valeurs écrites ou lues sont copiées. Aucun pointeur interne
// n'est exposé.
type Memory struct {
	mu       sync.RWMutex
	learners map[string]*domain.Learner
	srsCards map[string][]domain.SrsCard
	quests   map[string]map[string][]gamification.Quest // learnerID → dateKey → quests
	events   map[string][]StoredEvent                   // learnerID → event log
	closed   bool

	// maxEvents — capacité par apprenant du journal d'événements.
	maxEvents int
}

// NewMemory construit un repository in-memory vide.
func NewMemory() *Memory {
	return &Memory{
		learners:  make(map[string]*domain.Learner),
		srsCards:  make(map[string][]domain.SrsCard),
		quests:    make(map[string]map[string][]gamification.Quest),
		events:    make(map[string][]StoredEvent),
		maxEvents: maxStoredEvents,
	}
}

// NewMemoryWithEvents construit un repository in-memory avec une capacité
// de journal d'événements surchargée.
func NewMemoryWithEvents(maxEvents int) *Memory {
	m := NewMemory()
	if maxEvents > 0 {
		m.maxEvents = maxEvents
	}
	return m
}

/* ─── Learner ─────────────────────────────────────────────────────────── */

func (m *Memory) GetLearner(_ context.Context, learnerID string) (*domain.Learner, error) {
	if learnerID == "" {
		return nil, ErrInvalidArgument
	}
	m.mu.RLock()
	defer m.mu.RUnlock()
	if m.closed {
		return nil, ErrClosed
	}
	l, ok := m.learners[learnerID]
	if !ok {
		return nil, ErrNotFound
	}
	return cloneLearner(l), nil
}

func (m *Memory) SaveLearner(_ context.Context, l *domain.Learner) error {
	if l == nil {
		return ErrInvalidArgument
	}
	if l.ID == "" {
		return ErrInvalidArgument
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.closed {
		return ErrClosed
	}
	m.learners[l.ID] = cloneLearner(l)
	return nil
}

func (m *Memory) DeleteLearner(_ context.Context, learnerID string) error {
	if learnerID == "" {
		return ErrInvalidArgument
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.closed {
		return ErrClosed
	}
	delete(m.learners, learnerID)
	delete(m.srsCards, learnerID)
	delete(m.quests, learnerID)
	delete(m.events, learnerID)
	return nil
}

func (m *Memory) ListLearners(_ context.Context) ([]*domain.Learner, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if m.closed {
		return nil, ErrClosed
	}
	out := make([]*domain.Learner, 0, len(m.learners))
	for _, l := range m.learners {
		out = append(out, cloneLearner(l))
	}
	return out, nil
}

/* ─── SRS ─────────────────────────────────────────────────────────────── */

func (m *Memory) GetSrsCards(_ context.Context, learnerID string) ([]domain.SrsCard, error) {
	if learnerID == "" {
		return nil, ErrInvalidArgument
	}
	m.mu.RLock()
	defer m.mu.RUnlock()
	if m.closed {
		return nil, ErrClosed
	}
	cards := m.srsCards[learnerID]
	if cards == nil {
		return []domain.SrsCard{}, nil
	}
	return cloneSrsCards(cards), nil
}

func (m *Memory) SaveSrsCards(_ context.Context, learnerID string, cards []domain.SrsCard) error {
	if learnerID == "" {
		return ErrInvalidArgument
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.closed {
		return ErrClosed
	}
	if cards == nil {
		m.srsCards[learnerID] = []domain.SrsCard{}
		return nil
	}
	m.srsCards[learnerID] = cloneSrsCards(cards)
	return nil
}

/* ─── Quests ──────────────────────────────────────────────────────────── */

func (m *Memory) GetQuests(_ context.Context, learnerID string, date time.Time) ([]gamification.Quest, error) {
	if learnerID == "" {
		return nil, ErrInvalidArgument
	}
	if date.IsZero() {
		return nil, ErrInvalidArgument
	}
	m.mu.RLock()
	defer m.mu.RUnlock()
	if m.closed {
		return nil, ErrClosed
	}
	byDate, ok := m.quests[learnerID]
	if !ok {
		return []gamification.Quest{}, nil
	}
	key := dateKey(date)
	quests, ok := byDate[key]
	if !ok {
		return []gamification.Quest{}, nil
	}
	return cloneQuests(quests), nil
}

func (m *Memory) SaveQuests(_ context.Context, learnerID string, date time.Time, quests []gamification.Quest) error {
	if learnerID == "" {
		return ErrInvalidArgument
	}
	if date.IsZero() {
		return ErrInvalidArgument
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.closed {
		return ErrClosed
	}
	byDate, ok := m.quests[learnerID]
	if !ok {
		byDate = make(map[string][]gamification.Quest)
		m.quests[learnerID] = byDate
	}
	key := dateKey(date)
	if quests == nil {
		byDate[key] = []gamification.Quest{}
		return nil
	}
	byDate[key] = cloneQuests(quests)
	return nil
}

/* ─── Event log ───────────────────────────────────────────────────────── */

func (m *Memory) AppendEvent(_ context.Context, learnerID string, ev StoredEvent) error {
	if learnerID == "" {
		return ErrInvalidArgument
	}
	if ev.Kind == "" {
		return ErrInvalidArgument
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.closed {
		return ErrClosed
	}

	log := m.events[learnerID]
	log = append(log, cloneStoredEvent(ev))

	// Éjection FIFO si au-delà de la capacité.
	if len(log) > m.maxEvents {
		overflow := len(log) - m.maxEvents
		log = log[overflow:]
	}
	m.events[learnerID] = log
	return nil
}

func (m *Memory) ListRecentEvents(_ context.Context, learnerID string, limit int) ([]StoredEvent, error) {
	if learnerID == "" {
		return nil, ErrInvalidArgument
	}
	m.mu.RLock()
	defer m.mu.RUnlock()
	if m.closed {
		return nil, ErrClosed
	}
	log := m.events[learnerID]
	if len(log) == 0 {
		return []StoredEvent{}, nil
	}

	// Copie inversée (du plus récent au plus ancien).
	n := len(log)
	if limit > 0 && limit < n {
		n = limit
	}
	out := make([]StoredEvent, 0, n)
	for i := len(log) - 1; i >= 0 && len(out) < n; i-- {
		out = append(out, cloneStoredEvent(log[i]))
	}
	return out, nil
}

/* ─── Cycle de vie ────────────────────────────────────────────────────── */

func (m *Memory) Ping(_ context.Context) error {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if m.closed {
		return ErrClosed
	}
	return nil
}

func (m *Memory) Close() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.closed {
		return nil
	}
	m.closed = true
	m.learners = nil
	m.srsCards = nil
	m.quests = nil
	m.events = nil
	return nil
}

/* ─── Helpers : deep-copy ─────────────────────────────────────────────── */

// cloneLearner retourne une copie profonde du Learner.
// Toutes les maps et slices sont dupliquées.
func cloneLearner(src *domain.Learner) *domain.Learner {
	if src == nil {
		return nil
	}
	dst := *src

	// UnlockedAvatarIDs.
	if src.UnlockedAvatarIDs != nil {
		dst.UnlockedAvatarIDs = make([]string, len(src.UnlockedAvatarIDs))
		copy(dst.UnlockedAvatarIDs, src.UnlockedAvatarIDs)
	}

	// EarnedBadges.
	if src.EarnedBadges != nil {
		dst.EarnedBadges = make([]domain.BadgeEarned, len(src.EarnedBadges))
		copy(dst.EarnedBadges, src.EarnedBadges)
	}

	// ConceptMastery.
	if src.ConceptMastery != nil {
		dst.ConceptMastery = make(map[string]domain.Mastery, len(src.ConceptMastery))
		for k, v := range src.ConceptMastery {
			dst.ConceptMastery[k] = v
		}
	}

	// ProgramProgress.
	if src.ProgramProgress != nil {
		dst.ProgramProgress = make(map[string]domain.ProgramProgress, len(src.ProgramProgress))
		for k, v := range src.ProgramProgress {
			pp := v
			if v.CompletedLessonIDs != nil {
				ids := make([]string, len(v.CompletedLessonIDs))
				copy(ids, v.CompletedLessonIDs)
				pp.CompletedLessonIDs = ids
			}
			dst.ProgramProgress[k] = pp
		}
	}

	// LessonProgress.
	if src.LessonProgress != nil {
		dst.LessonProgress = make(map[string]domain.LessonProgress, len(src.LessonProgress))
		for k, v := range src.LessonProgress {
			dst.LessonProgress[k] = cloneLessonProgress(v)
		}
	}

	// MissionProgress.
	if src.MissionProgress != nil {
		dst.MissionProgress = make(map[string]domain.MissionProgress, len(src.MissionProgress))
		for k, v := range src.MissionProgress {
			mp := v
			if v.LastEventPayload != nil {
				payload := make(map[string]any, len(v.LastEventPayload))
				for pk, pv := range v.LastEventPayload {
					payload[pk] = pv
				}
				mp.LastEventPayload = payload
			}
			dst.MissionProgress[k] = mp
		}
	}

	return &dst
}

// cloneLessonProgress duplique les maps et slices internes.
func cloneLessonProgress(src domain.LessonProgress) domain.LessonProgress {
	dst := src
	if src.BlockStates != nil {
		dst.BlockStates = make([]domain.BlockState, len(src.BlockStates))
		copy(dst.BlockStates, src.BlockStates)
	}
	if src.Scores != nil {
		dst.Scores = make(map[string]int, len(src.Scores))
		for k, v := range src.Scores {
			dst.Scores[k] = v
		}
	}
	if src.AttemptsByExercise != nil {
		dst.AttemptsByExercise = make(map[string]int, len(src.AttemptsByExercise))
		for k, v := range src.AttemptsByExercise {
			dst.AttemptsByExercise[k] = v
		}
	}
	return dst
}

// cloneSrsCards retourne une copie de la slice. SrsCard est un struct
// de valeurs (pas de map/slice interne), une copie superficielle suffit.
func cloneSrsCards(src []domain.SrsCard) []domain.SrsCard {
	out := make([]domain.SrsCard, len(src))
	copy(out, src)
	return out
}

// cloneQuests retourne une copie de la slice de quêtes. Quest est un
// struct de valeurs.
func cloneQuests(src []gamification.Quest) []gamification.Quest {
	out := make([]gamification.Quest, len(src))
	copy(out, src)
	return out
}

// cloneStoredEvent duplique le payload (map[string]any).
func cloneStoredEvent(src StoredEvent) StoredEvent {
	dst := src
	if src.Payload != nil {
		dst.Payload = make(map[string]any, len(src.Payload))
		for k, v := range src.Payload {
			dst.Payload[k] = v
		}
	}
	return dst
}

// dateKey normalise une date en clé "YYYY-MM-DD" (UTC).
func dateKey(t time.Time) string {
	return t.UTC().Format("2006-01-02")
}