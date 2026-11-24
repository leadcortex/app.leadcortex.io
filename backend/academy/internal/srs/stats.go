// backend/academy/internal/srs/stats.go

package srs

import (
	"math"
	"sort"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

type CardStats struct {
	TotalCards int `json:"total_cards"`

	DueCount int `json:"due_count"`

	MatureCount int `json:"mature_count"`

	YoungCount int `json:"young_count"`

	NewCount int `json:"new_count"`

	AvgEase float64 `json:"avg_ease"`

	AvgIntervalDays float64 `json:"avg_interval_days"`

	TotalLapses int `json:"total_lapses"`

	RetentionRate float64 `json:"retention_rate"`
}

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

	attempts := totalReps + totalLapses
	if attempts > 0 {
		stats.RetentionRate = round2(float64(totalReps) / float64(attempts))
	}

	return stats
}

type ForecastDay struct {
	Date string `json:"date"`

	DayOffset int `json:"day_offset"`

	DueCount int `json:"due_count"`
}

func Forecast(cards []domain.SrsCard, days int, now time.Time) []ForecastDay {
	if days <= 0 {
		days = 30
	}
	if now.IsZero() {
		now = time.Now().UTC()
	}

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
			out[0].DueCount++
			continue
		}
		if !c.DueAt.Before(end) {
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


func round2(v float64) float64 {
	return math.Round(v*100) / 100
}