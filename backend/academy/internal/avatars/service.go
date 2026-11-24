// backend/academy/internal/avatars/service.go

package avatars

import (
	"fmt"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

type Service struct {
	registry *curriculum.Registry
}

func NewService(registry *curriculum.Registry) *Service {
	return &Service{registry: registry}
}

func (s *Service) EvaluateAll(l *domain.Learner, now time.Time) ([]domain.Avatar, error) {
	if l == nil {
		return nil, fmt.Errorf("%w : learner nil", ErrInvalidContext)
	}

	already := make(map[string]struct{}, len(l.UnlockedAvatarIDs))
	for _, id := range l.UnlockedAvatarIDs {
		already[id] = struct{}{}
	}

	ctx := s.buildContext(l, now)

	var out []domain.Avatar
	for _, a := range All() {
		if _, ok := already[a.ID]; ok {
			continue
		}
		ok, err := Evaluate(a, ctx)
		if err != nil {
			return nil, fmt.Errorf("évaluation de %s : %w", a.ID, err)
		}
		if ok {
			out = append(out, a)
		}
	}
	return out, nil
}

func (s *Service) ApplyAndUnlock(l *domain.Learner, now time.Time) ([]string, error) {
	candidates, err := s.EvaluateAll(l, now)
	if err != nil {
		return nil, err
	}
	var added []string
	for _, a := range candidates {
		if l.UnlockAvatar(a.ID) {
			added = append(added, a.ID)
		}
	}
	return added, nil
}

type Snapshot struct {
	UnlockedIDs []string `json:"unlocked_ids"`

	EquippedID string `json:"equipped_id"`

	Avatars []Render `json:"avatars"`

	Total int `json:"total"`

	UnlockedCount int `json:"unlocked_count"`
}

func (s *Service) Snapshot(l *domain.Learner) Snapshot {
	snap := Snapshot{
		Avatars:    BuildCatalog(l),
		EquippedID: l.EquippedAvatarID,
		Total:      Count(),
	}
	if l != nil {
		for _, id := range l.UnlockedAvatarIDs {
			if _, ok := Find(id); ok {
				snap.UnlockedIDs = append(snap.UnlockedIDs, id)
			}
		}
		snap.UnlockedCount = len(snap.UnlockedIDs)
	}
	return snap
}

func (s *Service) buildContext(l *domain.Learner, now time.Time) Context {
	ctx := NewContext(l, s.registry, now)

	if l.Level >= 20 {
		ctx = ctx.WithValue("level-20", true)
	}
	if l.Level >= 50 {
		ctx = ctx.WithValue("level-50", true)
	}
	if countCorrectExercises(l) >= 100 {
		ctx = ctx.WithValue("exercises-100", true)
	}
	if !containsID(l.UnlockedAvatarIDs, "dolphin") {
		if founding, _ := evaluateAllPrograms(ctx); founding {
			ctx = ctx.WithValue("founding", true)
		}
	}
	return ctx
}

func countCorrectExercises(l *domain.Learner) int {
	n := 0
	for _, lp := range l.LessonProgress {
		for _, score := range lp.Scores {
			if score >= 70 {
				n++
			}
		}
	}
	return n
}