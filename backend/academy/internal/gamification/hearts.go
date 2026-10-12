package gamification

import (
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

// DefaultHeartRegenInterval — durée par défaut entre deux régénérations
// de cœur (1 cœur toutes les 30 minutes).
const DefaultHeartRegenInterval = 30 * time.Minute

// HeartRegenConfig paramètre la régénération des cœurs.
type HeartRegenConfig struct {
	// Interval — durée nécessaire pour regagner 1 cœur.
	Interval time.Duration

	// MaxHearts — plafond (par défaut domain.MaxHearts).
	MaxHearts int
}

// DefaultHeartRegenConfig — configuration standard.
func DefaultHeartRegenConfig() HeartRegenConfig {
	return HeartRegenConfig{
		Interval:  DefaultHeartRegenInterval,
		MaxHearts: domain.MaxHearts,
	}
}

// HeartRegenResult décrit le résultat d'une tentative de régénération.
type HeartRegenResult struct {
	// Hearts — nombre de cœurs après régénération.
	Hearts int `json:"hearts"`

	// Regenerated — nombre de cœurs effectivement regagnés.
	Regenerated int `json:"regenerated"`

	// LastRegenAt — nouvel horodatage de référence. À stocker côté
	// appelant (le Learner du domaine ne porte pas ce champ).
	LastRegenAt time.Time `json:"last_regen_at"`

	// NextRegenAt — instant du prochain regain (zéro si plein).
	NextRegenAt time.Time `json:"next_regen_at,omitempty"`

	// ProgressRatio — progression vers le prochain cœur (0-1).
	ProgressRatio float64 `json:"progress_ratio"`
}

// RegenerateHearts calcule les cœurs regagnés depuis `lastRegenAt`.
//
// Cas particuliers :
//   - Cœurs déjà pleins : renvoie 0 regagné, pas de next.
//   - `lastRegenAt` zéro : considère la regen comme démarrant maintenant.
//   - Intervalle <= 0 : utilise la valeur par défaut.
//
// Cette fonction est PURE : elle ne mute aucun état. L'appelant doit
// mettre à jour le Learner (Hearts) et persister `LastRegenAt`.
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

	// Plafond.
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

	// Premier appel : on démarre le timer.
	if lastRegenAt.IsZero() {
		return HeartRegenResult{
			Hearts:        currentHearts,
			Regenerated:   0,
			LastRegenAt:   now,
			NextRegenAt:   now.Add(cfg.Interval),
			ProgressRatio: 0,
		}
	}

	// Combien de cycles complets depuis lastRegenAt ?
	elapsed := now.Sub(lastRegenAt)
	if elapsed < 0 {
		// Horloge inversée : on ne donne rien.
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
		// Pas encore un cycle complet : on expose la progression.
		return HeartRegenResult{
			Hearts:        currentHearts,
			Regenerated:   0,
			LastRegenAt:   lastRegenAt,
			NextRegenAt:   lastRegenAt.Add(cfg.Interval),
			ProgressRatio: float64(elapsed) / float64(cfg.Interval),
		}
	}

	// Appliquer les cycles, plafonner aux max.
	missing := max - currentHearts
	regenerated := cycles
	if regenerated > missing {
		regenerated = missing
	}
	newHearts := currentHearts + regenerated

	// Nouvel horodatage de référence :
	//  - si plein : on remet lastRegen à zéro pour repartir proprement
	//    au prochain regain.
	//  - sinon : on avance du nombre de cycles consommés.
	var newLast, next time.Time
	if newHearts >= max {
		newLast = time.Time{}
		next = time.Time{}
	} else {
		newLast = lastRegenAt.Add(time.Duration(regenerated) * cfg.Interval)
		next = newLast.Add(cfg.Interval)
	}

	// Si les cycles dépassent largement, on peut réinitialiser à now
	// pour éviter d'accumuler une dette artificielle.
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

// TimeUntilNextHeart renvoie le temps restant avant le prochain cœur.
// Retourne 0 si les cœurs sont pleins ou si la config est invalide.
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

// EstimatedFullHeartsAt — instant estimé où les cœurs seront pleins.
// Retourne zéro si déjà plein.
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
		// Repartir de maintenant si le timer est dépassé depuis longtemps.
		base = now
	}
	return base.Add(time.Duration(missing) * cfg.Interval)
}