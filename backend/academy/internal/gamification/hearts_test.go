package gamification

import (
	"testing"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

func TestRegenerateHearts_Full(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	cfg := DefaultHeartRegenConfig()

	r := RegenerateHearts(domain.MaxHearts, now.Add(-time.Hour), now, cfg)
	if r.Hearts != domain.MaxHearts {
		t.Errorf("cœurs pleins : attendu %d, obtenu %d", domain.MaxHearts, r.Hearts)
	}
	if r.Regenerated != 0 {
		t.Errorf("Regenerated : attendu 0, obtenu %d", r.Regenerated)
	}
}

func TestRegenerateHearts_OneCycle(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	cfg := DefaultHeartRegenConfig()

	// 2 cœurs, dernier regain il y a 45 min → 1 cycle complet.
	r := RegenerateHearts(2, now.Add(-45*time.Minute), now, cfg)
	if r.Hearts != 3 {
		t.Errorf("Hearts : attendu 3, obtenu %d", r.Hearts)
	}
	if r.Regenerated != 1 {
		t.Errorf("Regenerated : attendu 1, obtenu %d", r.Regenerated)
	}
}

func TestRegenerateHearts_MultipleCycles_CappedAtMax(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	cfg := DefaultHeartRegenConfig()

	// 1 cœur, dernier regain il y a 5h → 10 cycles possibles, mais cap à 5.
	r := RegenerateHearts(1, now.Add(-5*time.Hour), now, cfg)
	if r.Hearts != domain.MaxHearts {
		t.Errorf("Hearts : attendu %d, obtenu %d", domain.MaxHearts, r.Hearts)
	}
	if r.Regenerated != domain.MaxHearts-1 {
		t.Errorf("Regenerated : attendu %d, obtenu %d", domain.MaxHearts-1, r.Regenerated)
	}
}

func TestRegenerateHearts_PartialCycle(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	cfg := DefaultHeartRegenConfig()

	// 3 cœurs, dernier regain il y a 10 min → pas de cycle.
	r := RegenerateHearts(3, now.Add(-10*time.Minute), now, cfg)
	if r.Hearts != 3 {
		t.Errorf("Hearts : attendu 3, obtenu %d", r.Hearts)
	}
	if r.Regenerated != 0 {
		t.Errorf("Regenerated : attendu 0, obtenu %d", r.Regenerated)
	}
	if r.ProgressRatio <= 0 || r.ProgressRatio >= 1 {
		t.Errorf("ProgressRatio attendu dans (0,1), obtenu %f", r.ProgressRatio)
	}
}

func TestRegenerateHearts_ZeroLastRegen(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	cfg := DefaultHeartRegenConfig()

	r := RegenerateHearts(3, time.Time{}, now, cfg)
	if r.Hearts != 3 {
		t.Errorf("premier appel : hearts inchangés, obtenu %d", r.Hearts)
	}
	if r.Regenerated != 0 {
		t.Errorf("premier appel : 0 régénérés, obtenu %d", r.Regenerated)
	}
	if r.LastRegenAt.IsZero() {
		t.Error("LastRegenAt devrait être initialisé à now")
	}
	if !r.NextRegenAt.After(now) {
		t.Error("NextRegenAt devrait être dans le futur")
	}
}

func TestRegenerateHearts_ClockBackwards(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	cfg := DefaultHeartRegenConfig()
	lastRegen := now.Add(time.Hour) // Dans le futur

	r := RegenerateHearts(3, lastRegen, now, cfg)
	if r.Regenerated != 0 {
		t.Errorf("horloge inversée : attendu 0, obtenu %d", r.Regenerated)
	}
	if r.Hearts != 3 {
		t.Errorf("Hearts : attendu 3, obtenu %d", r.Hearts)
	}
}

func TestTimeUntilNextHeart(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	cfg := DefaultHeartRegenConfig()

	// Plein → 0.
	if d := TimeUntilNextHeart(domain.MaxHearts, now.Add(-time.Hour), now, cfg); d != 0 {
		t.Errorf("plein : attendu 0, obtenu %v", d)
	}

	// 10 min écoulées → reste 20 min.
	d := TimeUntilNextHeart(2, now.Add(-10*time.Minute), now, cfg)
	if d < 19*time.Minute || d > 21*time.Minute {
		t.Errorf("attendu ~20min, obtenu %v", d)
	}

	// Au-delà d'un cycle → 0.
	if d := TimeUntilNextHeart(2, now.Add(-2*time.Hour), now, cfg); d != 0 {
		t.Errorf("dépassé : attendu 0, obtenu %v", d)
	}
}

func TestEstimatedFullHeartsAt(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	cfg := DefaultHeartRegenConfig()

	// Plein → zéro.
	if t0 := EstimatedFullHeartsAt(domain.MaxHearts, now, now, cfg); !t0.IsZero() {
		t.Errorf("plein : attendu zéro, obtenu %v", t0)
	}

	// 3 cœurs, base = now → 2 cycles → +1h.
	full := EstimatedFullHeartsAt(3, now, now, cfg)
	expected := now.Add(2 * cfg.Interval)
	if !full.Equal(expected) {
		t.Errorf("attendu %v, obtenu %v", expected, full)
	}
}