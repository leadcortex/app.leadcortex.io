// backend/academy/internal/gamification/hearts.go

package gamification

import (
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

const DefaultHeartRegenInterval = 30 * time.Minute

type HeartRegenConfig struct {
	Interval time.Duration

	MaxHearts int
}

func DefaultHeartRegenConfig() HeartRegenConfig {
	return HeartRegenConfig{
		Interval:  DefaultHeartRegenInterval,
		MaxHearts: domain.MaxHearts,
	}
}

type HeartRegenResult struct {
	Hearts int `json:"hearts"`

	Regenerated int `json:"regenerated"`

	LastRegenAt time.Time `json:"last_regen_at"`

	NextRegenAt time.Time `json:"next_regen_at,omitempty"`

	ProgressRatio float64 `json:"progress_ratio"`
}

func RegenerateHearts(
	currentHearts int,
	lastRegenAt, now time.Time,
	cfg HeartRegenConfig,
) HeartRegenResult {
	if cfg.Interval <= 0 {
		cfg.Interval = DefaultHeartRegenInterval
	}
	max := cfg.MaxHearts
	if max <= 0 {
		max = domain.MaxHearts
	}

	if currentHearts < 0 {
		currentHearts = 0
	}
	if currentHearts >= max {
		return HeartRegenResult{
			Hearts:      max,
			Regenerated: 0,
			LastRegenAt: lastRegenAt,
		}
	}

	if lastRegenAt.IsZero() {
		return HeartRegenResult{
			Hearts:        currentHearts,
			Regenerated:   0,
			LastRegenAt:   now,
			NextRegenAt:   now.Add(cfg.Interval),
			ProgressRatio: 0,
		}
	}

	elapsed := now.Sub(lastRegenAt)
	if elapsed < 0 {
		return HeartRegenResult{
			Hearts:        currentHearts,
			Regenerated:   0,
			LastRegenAt:   now,
			NextRegenAt:   now.Add(cfg.Interval),
			ProgressRatio: 0,
		}
	}

	cycles := int(elapsed / cfg.Interval)
	if cycles <= 0 {
		return HeartRegenResult{
			Hearts:        currentHearts,
			Regenerated:   0,
			LastRegenAt:   lastRegenAt,
			NextRegenAt:   lastRegenAt.Add(cfg.Interval),
			ProgressRatio: float64(elapsed) / float64(cfg.Interval),
		}
	}

	missing := max - currentHearts
	regenerated := cycles
	if regenerated > missing {
		regenerated = missing
	}
	newHearts := currentHearts + regenerated

	var newLast, next time.Time
	if newHearts >= max {
		newLast = time.Time{}
		next = time.Time{}
	} else {
		newLast = lastRegenAt.Add(time.Duration(regenerated) * cfg.Interval)
		next = newLast.Add(cfg.Interval)
	}

	if !newLast.IsZero() && now.Sub(newLast) > cfg.Interval {
		newLast = now
		next = now.Add(cfg.Interval)
	}

	return HeartRegenResult{
		Hearts:        newHearts,
		Regenerated:   regenerated,
		LastRegenAt:   newLast,
		NextRegenAt:   next,
		ProgressRatio: 0,
	}
}

func TimeUntilNextHeart(
	currentHearts int,
	lastRegenAt, now time.Time,
	cfg HeartRegenConfig,
) time.Duration {
	if cfg.Interval <= 0 {
		cfg.Interval = DefaultHeartRegenInterval
	}
	max := cfg.MaxHearts
	if max <= 0 {
		max = domain.MaxHearts
	}
	if currentHearts >= max || lastRegenAt.IsZero() {
		return 0
	}
	next := lastRegenAt.Add(cfg.Interval)
	if !next.After(now) {
		return 0
	}
	return next.Sub(now)
}

func EstimatedFullHeartsAt(
	currentHearts int,
	lastRegenAt, now time.Time,
	cfg HeartRegenConfig,
) time.Time {
	if cfg.Interval <= 0 {
		cfg.Interval = DefaultHeartRegenInterval
	}
	max := cfg.MaxHearts
	if max <= 0 {
		max = domain.MaxHearts
	}
	if currentHearts >= max {
		return time.Time{}
	}
	missing := max - currentHearts
	if lastRegenAt.IsZero() {
		return now.Add(time.Duration(missing) * cfg.Interval)
	}
	base := lastRegenAt
	if base.Before(now) && now.Sub(base) > cfg.Interval {
		base = now
	}
	return base.Add(time.Duration(missing) * cfg.Interval)
}