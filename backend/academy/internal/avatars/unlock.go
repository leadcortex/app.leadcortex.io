// backend/academy/internal/avatars/unlock.go

package avatars

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

type Context struct {
	Learner *domain.Learner

	Registry *curriculum.Registry

	Now time.Time

	Values map[string]any
}

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

func (c Context) WithValue(key string, v any) Context {
	if c.Values == nil {
		c.Values = map[string]any{}
	}
	c.Values[key] = v
	return c
}

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

func EvaluateByID(avatarID string, ctx Context) (bool, error) {
	a, ok := Find(avatarID)
	if !ok {
		return false, fmt.Errorf("%w : %s", ErrUnknownAvatar, avatarID)
	}
	return Evaluate(a, ctx)
}


func evaluateProgram(programID string, ctx Context) (bool, error) {
	if programID == "" {
		return false, fmt.Errorf("%w : program vide", ErrInvalidUnlockValue)
	}
	if pp, ok := ctx.Learner.ProgramProgress[programID]; ok && pp.IsCompleted() {
		return true, nil
	}
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

func evaluateFounding(ctx Context) (bool, error) {
	if ctx.Values == nil {
		return false, nil
	}
	if v, ok := ctx.Values["founding"]; ok {
		return toBool(v), nil
	}
	return evaluateAllPrograms(ctx)
}


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