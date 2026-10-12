package srs

import (
	"math"
	"sort"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

// CardStats regroupe des statistiques agrégées sur un ensemble de cartes.
type CardStats struct {
	// TotalCards — nombre total de cartes.
	TotalCards int `json:"total_cards"`

	// DueCount — nombre de cartes dues maintenant.
	DueCount int `json:"due_count"`

	// MatureCount — cartes avec intervalle >= 21 jours (mature).
	MatureCount int `json:"mature_count"`

	// YoungCount — cartes avec intervalle < 21 jours.
	YoungCount int `json:"young_count"`

	// NewCount — cartes jamais révisées.
	NewCount int `json:"new_count"`

	// AvgEase — facteur de facilité moyen.
	AvgEase float64 `json:"avg_ease"`

	// AvgIntervalDays — intervalle moyen en jours.
	AvgIntervalDays float64 `json:"avg_interval_days"`

	// TotalLapses — nombre cumulé d'échecs.
	TotalLapses int `json:"total_lapses"`

	// RetentionRate — taux de rétention estimé (0-1).
	RetentionRate float64 `json:"retention_rate"`
}

// ComputeStats calcule les statistiques d'un ensemble de cartes.
//
// Le seuil "mature" est fixé à 21 jours (convention Anki).
func ComputeStats(cards []domain.SrsCard, now time.Time) CardStats {
	if now.IsZero() {
		now = time.Now().UTC()
	}
	if len(cards) == 0 {
		return CardStats{}
	}

	stats := CardStats{TotalCards: len(cards)}
	var totalEase float64
	var totalInterval int
	var totalReps int
	var totalLapses int

	for _, c := range cards {
		if IsDue(c, now) {
			stats.DueCount++
		}
		if c.IntervalDays >= 21 {
			stats.MatureCount++
		} else {
			stats.YoungCount++
		}
		if c.Repetitions == 0 && c.LastReviewedAt.IsZero() {
			stats.NewCount++
		}

		totalEase += c.EaseFactor
		totalInterval += c.IntervalDays
		totalReps += c.Repetitions
		totalLapses += c.Lapses
	}

	stats.AvgEase = round2(totalEase / float64(len(cards)))
	stats.AvgIntervalDays = round2(float64(totalInterval) / float64(len(cards)))
	stats.TotalLapses = totalLapses

	// Taux de rétention estimé :
	//   successes / total_attempts = (totalReps) / (totalReps + totalLapses)
	//
	// Un total de 0 tentatives donne un taux de 0 (pas de données).
	attempts := totalReps + totalLapses
	if attempts > 0 {
		stats.RetentionRate = round2(float64(totalReps) / float64(attempts))
	}

	return stats
}

// ForecastDay décrit la charge de révision d'un jour donné.
type ForecastDay struct {
	// Date — jour concerné (format YYYY-MM-DD).
	Date string `json:"date"`

	// DayOffset — nombre de jours depuis aujourd'hui (0 = aujourd'hui).
	DayOffset int `json:"day_offset"`

	// DueCount — nombre de cartes à réviser ce jour.
	DueCount int `json:"due_count"`
}

// Forecast produit une prévision de charge sur les N prochains jours.
//
// Les cartes dont l'intervalle est très long sont incluses dans le dernier
// jour de la fenêtre, avec un marqueur.
func Forecast(cards []domain.SrsCard, days int, now time.Time) []ForecastDay {
	if days <= 0 {
		days = 30
	}
	if now.IsZero() {
		now = time.Now().UTC()
	}

	// Alignement à minuit local.
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	out := make([]ForecastDay, days)
	for i := 0; i < days; i++ {
		d := start.AddDate(0, 0, i)
		out[i] = ForecastDay{
			Date:      d.Format("2006-01-02"),
			DayOffset: i,
		}
	}

	end := start.AddDate(0, 0, days)
	for _, c := range cards {
		if c.DueAt.Before(start) {
			// En retard : on les compte aujourd'hui.
			out[0].DueCount++
			continue
		}
		if !c.DueAt.Before(end) {
			// Au-delà de la fenêtre : on les rattache au dernier jour.
			out[days-1].DueCount++
			continue
		}
		offset := int(c.DueAt.Sub(start).Hours() / 24)
		if offset < 0 {
			offset = 0
		}
		if offset >= days {
			offset = days - 1
		}
		out[offset].DueCount++
	}

	return out
}

// DifficultCards retourne les N cartes les plus difficiles.
//
// "Difficile" = combinaison de lapses élevés + ease factor bas.
// Score = lapses*2 - ease*10 (plus le score est haut, plus la carte est
// difficile).
func DifficultCards(cards []domain.SrsCard, limit int) []domain.SrsCard {
	if limit <= 0 {
		limit = 10
	}
	type scored struct {
		card  domain.SrsCard
		score float64
	}
	tmp := make([]scored, 0, len(cards))
	for _, c := range cards {
		s := float64(c.Lapses)*2 - c.EaseFactor*10
		tmp = append(tmp, scored{c, s})
	}
	sort.SliceStable(tmp, func(i, j int) bool {
		return tmp[i].score > tmp[j].score
	})
	if len(tmp) > limit {
		tmp = tmp[:limit]
	}
	out := make([]domain.SrsCard, len(tmp))
	for i, s := range tmp {
		out[i] = s.card
	}
	return out
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}