package avatars

import (
	"fmt"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

// Service orchestre les déblocages d'avatars pour un Learner.
//
// Le Service est sans état : il peut être partagé entre goroutines. Toute
// mutation est effectuée sur le Learner passé en argument.
type Service struct {
	registry *curriculum.Registry
}

// NewService construit un service adossé au registre de curriculum.
// Le registre peut être nil : dans ce cas, seules les conditions qui ne
// nécessitent pas de résolution de programme seront évaluées.
func NewService(registry *curriculum.Registry) *Service {
	return &Service{registry: registry}
}

// EvaluateAll renvoie l'ensemble des avatars que le Learner débloque
// MAINTENANT (mais ne les attribue pas).
//
// Le slice retourné est trié par ordre du catalogue.
func (s *Service) EvaluateAll(l *domain.Learner, now time.Time) ([]domain.Avatar, error) {
	if l == nil {
		return nil, fmt.Errorf("%w : learner nil", ErrInvalidContext)
	}

	// Déjà débloqués : on les saute.
	already := make(map[string]struct{}, len(l.UnlockedAvatarIDs))
	for _, id := range l.UnlockedAvatarIDs {
		already[id] = struct{}{}
	}

	// Construire un contexte enrichi.
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

// ApplyAndUnlock évalue puis attribue tous les avatars débloqués au
// Learner. Renvoie les IDs effectivement ajoutés (idempotent).
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

// Snapshot renvoie l'état complet des 12 avatars pour l'UI.
type Snapshot struct {
	// UnlockedIDs — IDs débloqués, dans l'ordre du catalogue.
	UnlockedIDs []string `json:"unlocked_ids"`

	// EquippedID — ID équipé (vide si aucun).
	EquippedID string `json:"equipped_id"`

	// Avatars — liste prête à l'affichage.
	Avatars []Render `json:"avatars"`

	// Total — nombre total d'avatars (12).
	Total int `json:"total"`

	// UnlockedCount — nombre d'avatars débloqués.
	UnlockedCount int `json:"unlocked_count"`
}

// Snapshot construit l'état complet à afficher dans la galerie.
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

// buildContext enrichit le contexte avec les signaux dérivés du Learner
// (niveau, compteurs) et du registre.
func (s *Service) buildContext(l *domain.Learner, now time.Time) Context {
	ctx := NewContext(l, s.registry, now)

	// Signal : niveau 20 atteint.
	if l.Level >= 20 {
		ctx = ctx.WithValue("level-20", true)
	}
	// Signal : niveau 50 atteint.
	if l.Level >= 50 {
		ctx = ctx.WithValue("level-50", true)
	}
	// Signal : 100 exercices réussis.
	if countCorrectExercises(l) >= 100 {
		ctx = ctx.WithValue("exercises-100", true)
	}
	// Signal : founding — tous les programmes terminés + dolphin pas
	// encore débloqué.
	if !containsID(l.UnlockedAvatarIDs, "dolphin") {
		if founding, _ := evaluateAllPrograms(ctx); founding {
			ctx = ctx.WithValue("founding", true)
		}
	}
	return ctx
}

// countCorrectExercises compte les exercices réussis (score >= 70) sur
// l'ensemble des leçons.
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