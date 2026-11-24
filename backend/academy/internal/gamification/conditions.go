// backend/academy/internal/gamification/conditions.go

package gamification

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

type Context struct {
	Learner *domain.Learner

	Values map[string]any

	Now time.Time
}

func NewContext(learner *domain.Learner, now time.Time) Context {
	return Context{
		Learner: learner,
		Values:  map[string]any{},
		Now:     now,
	}
}

func (c Context) WithValue(path string, v any) Context {
	if c.Values == nil {
		c.Values = map[string]any{}
	}
	c.Values[path] = v
	return c
}

func Evaluate(group domain.ConditionGroup, ctx Context) (bool, error) {
	if ctx.Learner == nil {
		return false, fmt.Errorf("%w : Learner nil", ErrInvalidContext)
	}

	for i, c := range group.All {
		ok, err := evaluateOne(c, ctx)
		if err != nil {
			return false, fmt.Errorf("all[%d] : %w", i, err)
		}
		if !ok {
			return false, nil
		}
	}

	if len(group.Any) > 0 {
		anyOK := false
		for i, c := range group.Any {
			ok, err := evaluateOne(c, ctx)
			if err != nil {
				return false, fmt.Errorf("any[%d] : %w", i, err)
			}
			if ok {
				anyOK = true
				break
			}
		}
		if !anyOK {
			return false, nil
		}
	}

	for i, c := range group.Not {
		ok, err := evaluateOne(c, ctx)
		if err != nil {
			return false, fmt.Errorf("not[%d] : %w", i, err)
		}
		if ok {
			return false, nil
		}
	}

	return true, nil
}

func EvaluateOne(c domain.Condition, ctx Context) (bool, error) {
	return evaluateOne(c, ctx)
}

func evaluateOne(c domain.Condition, ctx Context) (bool, error) {
	if !c.Op.IsKnown() {
		return false, fmt.Errorf("%w : %q", ErrUnknownOperator, c.Op)
	}

	got, ok := resolvePath(c.Path, ctx)
	if !ok {
		return false, fmt.Errorf("%w : %q", ErrUnknownPath, c.Path)
	}

	return compare(c.Op, got, c.Value)
}


func resolvePath(path string, ctx Context) (any, bool) {
	if strings.HasPrefix(path, "learner.") {
		if v, ok := resolveLearnerPath(path, ctx.Learner); ok {
			return v, true
		}
	}

	if ctx.Values != nil {
		if v, ok := ctx.Values[path]; ok {
			return v, true
		}
	}

	return nil, false
}

func resolveLearnerPath(path string, l *domain.Learner) (any, bool) {
	if l == nil {
		return nil, false
	}
	switch path {
	case "learner.id":
		return l.ID, true
	case "learner.display_name":
		return l.DisplayName, true
	case "learner.xp":
		return l.XP, true
	case "learner.level":
		return l.Level, true
	case "learner.streak_days":
		return l.StreakDays, true
	case "learner.best_streak_days":
		return l.BestStreakDays, true
	case "learner.hearts":
		return l.Hearts, true
	case "learner.lessons_completed":
		return countCompletedLessons(l), true
	case "learner.programs_completed":
		return countCompletedPrograms(l), true
	case "learner.badges_count":
		return len(l.EarnedBadges), true
	case "learner.avatars_count":
		return len(l.UnlockedAvatarIDs), true
	case "learner.concepts_mastered":
		return countMasteredConcepts(l), true
	case "learner.missions_completed":
		return countCompletedMissions(l), true
	}
	return nil, false
}

func countCompletedLessons(l *domain.Learner) int {
	n := 0
	for _, lp := range l.LessonProgress {
		if lp.IsCompleted() {
			n++
		}
	}
	return n
}

func countCompletedPrograms(l *domain.Learner) int {
	n := 0
	for _, pp := range l.ProgramProgress {
		if pp.IsCompleted() {
			n++
		}
	}
	return n
}

func countMasteredConcepts(l *domain.Learner) int {
	n := 0
	for _, m := range l.ConceptMastery {
		if m.IsMastered() {
			n++
		}
	}
	return n
}

func countCompletedMissions(l *domain.Learner) int {
	n := 0
	for _, mp := range l.MissionProgress {
		if mp.Status == domain.MissionStatusCompleted {
			n++
		}
	}
	return n
}


func compare(op domain.Operator, got, want any) (bool, error) {
	switch op {
	case domain.OpIsEmpty:
		return isEmpty(got), nil
	case domain.OpIsNotEmpty:
		return !isEmpty(got), nil
	}

	if op == domain.OpLengthGTE || op == domain.OpLengthLTE {
		w, err := toInt(want)
		if err != nil {
			return false, fmt.Errorf("%w : %v", ErrTypeMismatch, err)
		}
		length := lengthOf(got)
		if op == domain.OpLengthGTE {
			return length >= w, nil
		}
		return length <= w, nil
	}

	if s, isStr := got.(string); isStr {
		switch op {
		case domain.OpContains, domain.OpNotContains:
			w, err := toString(want)
			if err != nil {
				return false, fmt.Errorf("%w : %v", ErrTypeMismatch, err)
			}
			contains := strings.Contains(s, w)
			if op == domain.OpContains {
				return contains, nil
			}
			return !contains, nil
		case domain.OpStartsWith:
			w, err := toString(want)
			if err != nil {
				return false, fmt.Errorf("%w : %v", ErrTypeMismatch, err)
			}
			return strings.HasPrefix(s, w), nil
		case domain.OpEndsWith:
			w, err := toString(want)
			if err != nil {
				return false, fmt.Errorf("%w : %v", ErrTypeMismatch, err)
			}
			return strings.HasSuffix(s, w), nil
		case domain.OpMatches:
			w, err := toString(want)
			if err != nil {
				return false, fmt.Errorf("%w : %v", ErrTypeMismatch, err)
			}
			if len(w) > 512 {
				return false, fmt.Errorf("%w : regex trop longue", ErrTypeMismatch)
			}
			re, err := regexp.Compile(w)
			if err != nil {
				return false, fmt.Errorf("%w : %v", ErrTypeMismatch, err)
			}
			return re.MatchString(s), nil
		}
	}

	gotF, gotIsNum := toFloat(got)
	wantF, wantIsNum := toFloat(want)
	if gotIsNum && wantIsNum {
		switch op {
		case domain.OpEqual:
			return gotF == wantF, nil
		case domain.OpNotEqual:
			return gotF != wantF, nil
		case domain.OpGreaterThan:
			return gotF > wantF, nil
		case domain.OpGreaterThanEqual:
			return gotF >= wantF, nil
		case domain.OpLessThan:
			return gotF < wantF, nil
		case domain.OpLessThanEqual:
			return gotF <= wantF, nil
		}
	}

	if gb, ok := got.(bool); ok {
		if wb, ok := want.(bool); ok {
			switch op {
			case domain.OpEqual:
				return gb == wb, nil
			case domain.OpNotEqual:
				return gb != wb, nil
			}
		}
	}

	if gs, ok := got.(string); ok {
		if ws, err := toString(want); err == nil {
			switch op {
			case domain.OpEqual:
				return gs == ws, nil
			case domain.OpNotEqual:
				return gs != ws, nil
			}
		}
	}

	return false, fmt.Errorf("%w : op=%q got=%T want=%T",
		ErrTypeMismatch, op, got, want)
}


func toFloat(v any) (float64, bool) {
	switch x := v.(type) {
	case int:
		return float64(x), true
	case int8:
		return float64(x), true
	case int16:
		return float64(x), true
	case int32:
		return float64(x), true
	case int64:
		return float64(x), true
	case uint:
		return float64(x), true
	case uint8:
		return float64(x), true
	case uint16:
		return float64(x), true
	case uint32:
		return float64(x), true
	case uint64:
		return float64(x), true
	case float32:
		return float64(x), true
	case float64:
		return x, true
	}
	return 0, false
}

func toInt(v any) (int, error) {
	f, ok := toFloat(v)
	if !ok {
		return 0, fmt.Errorf("valeur non numérique : %T", v)
	}
	return int(f), nil
}

func toString(v any) (string, error) {
	if s, ok := v.(string); ok {
		return s, nil
	}
	return "", fmt.Errorf("valeur non textuelle : %T", v)
}

func isEmpty(v any) bool {
	if v == nil {
		return true
	}
	switch x := v.(type) {
	case string:
		return x == ""
	case bool:
		return !x
	case int:
		return x == 0
	case int64:
		return x == 0
	case float64:
		return x == 0
	case []any:
		return len(x) == 0
	case []string:
		return len(x) == 0
	case map[string]any:
		return len(x) == 0
	}
	return false
}

func lengthOf(v any) int {
	switch x := v.(type) {
	case string:
		return len([]rune(x))
	case []any:
		return len(x)
	case []string:
		return len(x)
	case map[string]any:
		return len(x)
	}
	return 0
}