package avatars

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

// Context regroupe les informations nécessaires pour évaluer un
// déblocage d'avatar.
type Context struct {
	// Learner — l'apprenant.
	Learner *domain.Learner

	// Registry — registre du curriculum (utilisé pour vérifier les
	// programmes terminés).
	Registry *curriculum.Registry

	// Now — instant d'évaluation.
	Now time.Time

	// Values — valeurs libres, utilisées pour les déblocages `secret`
	// et `founding`. Ex. `Values["level-20"] = true`.
	Values map[string]any
}

// NewContext crée un contexte de déblocage minimal.
func NewContext(
	learner *domain.Learner,
	registry *curriculum.Registry,
	now time.Time,
) Context {
	return Context{
		Learner:  learner,
		Registry: registry,
		Now:      now,
		Values:   map[string]any{},
	}
}

// WithValue ajoute une valeur au contexte (fluent).
func (c Context) WithValue(key string, v any) Context {
	if c.Values == nil {
		c.Values = map[string]any{}
	}
	c.Values[key] = v
	return c
}

// Evaluate renvoie true si l'avatar est débloqué pour ce contexte.
func Evaluate(a domain.Avatar, ctx Context) (bool, error) {
	if ctx.Learner == nil {
		return false, fmt.Errorf("%w : learner nil", ErrInvalidContext)
	}

	switch a.Unlock.Kind {
	case domain.AvatarUnlockProgram:
		return evaluateProgram(a.Unlock.Value, ctx)
	case domain.AvatarUnlockStreak:
		return evaluateStreak(a.Unlock.Value, ctx)
	case domain.AvatarUnlockLessons:
		return evaluateLessons(a.Unlock.Value, ctx)
	case domain.AvatarUnlockMissionCount:
		return evaluateMissionCount(a.Unlock.Value, ctx)
	case domain.AvatarUnlockAllPrograms:
		return evaluateAllPrograms(ctx)
	case domain.AvatarUnlockSecret:
		return evaluateSecret(a.Unlock.Value, ctx)
	case domain.AvatarUnlockFounding:
		return evaluateFounding(ctx)
	default:
		return false, fmt.Errorf("%w : %q", ErrUnknownUnlockKind, a.Unlock.Kind)
	}
}

// EvaluateByID — raccourci pour Evaluate depuis un ID.
func EvaluateByID(avatarID string, ctx Context) (bool, error) {
	a, ok := Find(avatarID)
	if !ok {
		return false, fmt.Errorf("%w : %s", ErrUnknownAvatar, avatarID)
	}
	return Evaluate(a, ctx)
}

/* ─── Évaluateurs par kind ────────────────────────────────────────────── */

func evaluateProgram(programID string, ctx Context) (bool, error) {
	if programID == "" {
		return false, fmt.Errorf("%w : program vide", ErrInvalidUnlockValue)
	}
	// 1. Le Learner a-t-il marqué le programme terminé ?
	if pp, ok := ctx.Learner.ProgramProgress[programID]; ok && pp.IsCompleted() {
		return true, nil
	}
	// 2. Sinon, vérifions les leçons via le registre.
	if ctx.Registry == nil {
		return false, nil
	}
	p, ok := ctx.Registry.Program(programID)
	if !ok {
		return false, nil
	}
	if p.TotalLessons() == 0 {
		return false, nil
	}
	for mi := range p.Modules {
		for li := range p.Modules[mi].Lessons {
			lp, ok := ctx.Learner.LessonProgress[p.Modules[mi].Lessons[li].ID]
			if !ok || !lp.IsCompleted() {
				return false, nil
			}
		}
	}
	return true, nil
}

func evaluateStreak(raw string, ctx Context) (bool, error) {
	target, err := parsePositiveInt(raw)
	if err != nil {
		return false, err
	}
	return ctx.Learner.StreakDays >= target, nil
}

func evaluateLessons(raw string, ctx Context) (bool, error) {
	target, err := parsePositiveInt(raw)
	if err != nil {
		return false, err
	}
	n := 0
	for _, lp := range ctx.Learner.LessonProgress {
		if lp.IsCompleted() {
			n++
		}
	}
	return n >= target, nil
}

func evaluateMissionCount(raw string, ctx Context) (bool, error) {
	target, err := parsePositiveInt(raw)
	if err != nil {
		return false, err
	}
	n := 0
	for _, mp := range ctx.Learner.MissionProgress {
		if mp.Status == domain.MissionStatusCompleted {
			n++
		}
	}
	return n >= target, nil
}

func evaluateAllPrograms(ctx Context) (bool, error) {
	if ctx.Registry == nil {
		return false, nil
	}
	programs := ctx.Registry.AllPrograms()
	if len(programs) == 0 {
		return false, nil
	}
	for _, p := range programs {
		// On saute les programmes qui n'ont pas encore de contenu.
		if p.TotalLessons() == 0 {
			continue
		}
		pp, ok := ctx.Learner.ProgramProgress[p.ID]
		if !ok || !pp.IsCompleted() {
			return false, nil
		}
	}
	return true, nil
}

// evaluateSecret utilise ctx.Values pour les conditions cachées.
//
// La `Value` de l'avatar sert de clé (ex. "level-20"). Si la clé est
// présente et truthy, le déblocage est accordé. Le service est
// responsable de la peupler (via le niveau réel, un compteur, etc.).
func evaluateSecret(key string, ctx Context) (bool, error) {
	if key == "" {
		return false, fmt.Errorf("%w : clé secret vide", ErrInvalidUnlockValue)
	}
	if ctx.Values == nil {
		return false, nil
	}
	v, ok := ctx.Values[key]
	if !ok {
		return false, nil
	}
	return toBool(v), nil
}

// evaluateFounding — condition spéciale : la complétion totale.
//
// On s'appuie sur ctx.Values["founding"] qui est positionné par le
// service quand toutes les conditions sont remplies (tous programmes
// terminés ET Founding Dolphin non encore débloqué).
func evaluateFounding(ctx Context) (bool, error) {
	if ctx.Values == nil {
		return false, nil
	}
	if v, ok := ctx.Values["founding"]; ok {
		return toBool(v), nil
	}
	// Fallback : tous les programmes terminés.
	return evaluateAllPrograms(ctx)
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

func parsePositiveInt(raw string) (int, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return 0, fmt.Errorf("%w : valeur vide", ErrInvalidUnlockValue)
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return 0, fmt.Errorf("%w : %q non entier", ErrInvalidUnlockValue, raw)
	}
	if n < 0 {
		return 0, fmt.Errorf("%w : %d négatif", ErrInvalidUnlockValue, n)
	}
	return n, nil
}

func toBool(v any) bool {
	switch x := v.(type) {
	case nil:
		return false
	case bool:
		return x
	case int:
		return x != 0
	case int64:
		return x != 0
	case float64:
		return x != 0
	case string:
		return x != "" && x != "false" && x != "0"
	}
	return false
}