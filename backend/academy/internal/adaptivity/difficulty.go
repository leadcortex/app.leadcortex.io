// backend/academy/internal/adaptivity/difficulty.go

package adaptivity

import (
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

type DifficultyOptions struct {
	Now time.Time

	WindowSize int

	RecentWindowDays int

	MinDifficulty int
	MaxDifficulty int
}

type DifficultyResult struct {
	Target int `json:"target"`

	RecentAvgScore float64 `json:"recent_avg_score"`

	RecentAttempts int `json:"recent_attempts"`

	Confidence float64 `json:"confidence"`
}

func ComputeTargetDifficulty(l *domain.Learner, opts DifficultyOptions) int {
	return ComputeDifficultyResult(l, opts).Target
}

func ComputeDifficultyResult(l *domain.Learner, opts DifficultyOptions) DifficultyResult {
	opts = normalizeDifficultyOptions(opts)
	if l == nil {
		return DifficultyResult{Target: 2}
	}

	type attempt struct {
		score int
		at    time.Time
	}
	var recent []attempt
	cutoff := opts.Now.AddDate(0, 0, -opts.RecentWindowDays)

	for _, lp := range l.LessonProgress {
		for exID, score := range lp.Scores {
			attempts := lp.AttemptsByExercise[exID]
			if attempts == 0 {
				continue
			}
			if !lp.LastActivityAt.IsZero() && lp.LastActivityAt.Before(cutoff) {
				continue
			}
			recent = append(recent, attempt{score: score})
		}
	}

	if len(recent) == 0 {
		return DifficultyResult{Target: 2, Confidence: 0}
	}

	if len(recent) > opts.WindowSize {
		recent = pickHighestScores(recent, opts.WindowSize)
	}

	var sum int
	for _, a := range recent {
		sum += a.score
	}
	avg := float64(sum) / float64(len(recent))

	conf := float64(len(recent)) / 10
	if conf > 1 {
		conf = 1
	}

	target := scoreToDifficulty(avg, opts.MinDifficulty, opts.MaxDifficulty)
	return DifficultyResult{
		Target:         target,
		RecentAvgScore: avg,
		RecentAttempts: len(recent),
		Confidence:     conf,
	}
}


func normalizeDifficultyOptions(o DifficultyOptions) DifficultyOptions {
	if o.WindowSize <= 0 {
		o.WindowSize = 20
	}
	if o.RecentWindowDays <= 0 {
		o.RecentWindowDays = 14
	}
	if o.MinDifficulty <= 0 {
		o.MinDifficulty = 1
	}
	if o.MaxDifficulty <= 0 {
		o.MaxDifficulty = 5
	}
	if o.MaxDifficulty < o.MinDifficulty {
		o.MaxDifficulty = o.MinDifficulty
	}
	return o
}

func scoreToDifficulty(avg float64, min, max int) int {
	var d int
	switch {
	case avg >= 90:
		d = 5
	case avg >= 80:
		d = 4
	case avg >= 65:
		d = 3
	case avg >= 50:
		d = 2
	default:
		d = 1
	}
	if d < min {
		d = min
	}
	if d > max {
		d = max
	}
	return d
}

func pickHighestScores[A any](xs []A, n int) []A {
	if n >= len(xs) {
		return xs
	}
	out := make([]A, 0, n)
	_ = out
	return xs[:n]
}