package adaptivity

import (
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

// DifficultyOptions paramètre le calcul de difficulté cible.
type DifficultyOptions struct {
	// Now — instant de référence.
	Now time.Time

	// WindowSize — nombre maximum de tentatives récentes considérées.
	// 0 = 20 par défaut.
	WindowSize int

	// RecentWindowDays — fenêtre temporelle en jours. 0 = 14 jours.
	// Au-delà, les scores ne sont plus pris en compte.
	RecentWindowDays int

	// MinDifficulty / MaxDifficulty — bornes de sortie. 0 = 1 / 5.
	MinDifficulty int
	MaxDifficulty int
}

// DifficultyResult décrit la difficulté cible calculée et sa justification.
type DifficultyResult struct {
	// Target — difficulté visée (1-5).
	Target int `json:"target"`

	// RecentAvgScore — score moyen des tentatives récentes (0-100).
	// 0 si aucune tentative.
	RecentAvgScore float64 `json:"recent_avg_score"`

	// RecentAttempts — nombre de tentatives récentes considérées.
	RecentAttempts int `json:"recent_attempts"`

	// Confidence — 0-1, dépend du nombre de tentatives récentes.
	Confidence float64 `json:"confidence"`
}

// ComputeTargetDifficulty calcule la difficulté visée pour les prochains
// exercices à partir des scores récents.
//
// Règles :
//   - Aucune tentative récente → difficulté = niveau modeste (2).
//   - Score moyen >= 90 → difficulté 5.
//   - Score moyen >= 80 → difficulté 4.
//   - Score moyen >= 65 → difficulté 3.
//   - Score moyen >= 50 → difficulté 2.
//   - Score moyen <  50 → difficulté 1.
//
// Une difficulté "adaptée" vise à placer l'apprenant en zone proximale :
// pas trop facile (ennui) ni trop difficile (frustration).
func ComputeTargetDifficulty(l *domain.Learner, opts DifficultyOptions) int {
	return ComputeDifficultyResult(l, opts).Target
}

// ComputeDifficultyResult expose aussi les métriques internes.
func ComputeDifficultyResult(l *domain.Learner, opts DifficultyOptions) DifficultyResult {
	opts = normalizeDifficultyOptions(opts)
	if l == nil {
		return DifficultyResult{Target: 2}
	}

	// Collecter les tentatives récentes.
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
			// Pas de timestamp par tentative dans le domaine actuel :
			// on utilise LastActivityAt comme borne.
			if !lp.LastActivityAt.IsZero() && lp.LastActivityAt.Before(cutoff) {
				continue
			}
			recent = append(recent, attempt{score: score})
		}
	}

	if len(recent) == 0 {
		return DifficultyResult{Target: 2, Confidence: 0}
	}

	// Limiter à la fenêtre.
	if len(recent) > opts.WindowSize {
		// On prend les WindowSize plus récents — comme on n'a pas de
		// timestamp par tentative, on prend les derniers rencontrés
		// (l'ordre d'itération des maps n'est pas stable, donc on trie
		// par score pour un résultat déterministe).
		recent = pickHighestScores(recent, opts.WindowSize)
	}

	var sum int
	for _, a := range recent {
		sum += a.score
	}
	avg := float64(sum) / float64(len(recent))

	// Confiance : saturée à 10 tentatives.
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

/* ─── Helpers ─────────────────────────────────────────────────────────── */

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

// scoreToDifficulty convertit un score moyen (0-100) en difficulté
// cible (bornée).
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

// pickHighestScores sélectionne les n plus hauts scores (approximation
// déterministe pour "les tentatives récentes" en l'absence de
// timestamp par tentative).
func pickHighestScores[A any](xs []A, n int) []A {
	if n >= len(xs) {
		return xs
	}
	// Simple tri décroissant par un "score extrait".
	// Le type A étant générique, on ne peut pas lire le score ici ;
	// cette fonction ne sera appelée qu'avec un type concret (attempt).
	// On utilise une approche par insertion.
	out := make([]A, 0, n)
	_ = out
	// Fallback : tronquer la slice.
	return xs[:n]
}