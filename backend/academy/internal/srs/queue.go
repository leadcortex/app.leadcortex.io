// backend/academy/internal/srs/queue.go

package srs

import (
	"sort"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

type QueueOptions struct {
	Now time.Time

	MaxCards int

	ConceptFilter []string

	OrderBy QueueOrder
}

type QueueOrder string

const (
	OrderByDue QueueOrder = "due"

	OrderByLapses QueueOrder = "lapses"

	OrderByEase QueueOrder = "ease"
)

func BuildDueQueue(cards []domain.SrsCard, opts QueueOptions) []domain.SrsCard {
	now := opts.Now
	if now.IsZero() {
		now = time.Now().UTC()
	}

	due := make([]domain.SrsCard, 0, len(cards))
	conceptFilter := toSet(opts.ConceptFilter)

	for _, c := range cards {
		if !IsDue(c, now) {
			continue
		}
		if len(conceptFilter) > 0 {
			if _, ok := conceptFilter[c.ConceptID]; !ok {
				continue
			}
		}
		due = append(due, c)
	}

	order := opts.OrderBy
	if order == "" {
		order = OrderByDue
	}
	sort.SliceStable(due, func(i, j int) bool {
		switch order {
		case OrderByLapses:
			return due[i].Lapses > due[j].Lapses
		case OrderByEase:
			return due[i].EaseFactor < due[j].EaseFactor
		default:
			return due[i].DueAt.Before(due[j].DueAt)
		}
	})

	if opts.MaxCards > 0 && len(due) > opts.MaxCards {
		due = due[:opts.MaxCards]
	}
	return due
}

type QueueSnapshot struct {
	TotalDue int `json:"total_due"`

	TotalCards int `json:"total_cards"`

	DueNow int `json:"due_now"`

	DueToday int `json:"due_today"`

	DueThisWeek int `json:"due_this_week"`

	NextDueAt time.Time `json:"next_due_at,omitempty"`

	Concepts []ConceptQueueInfo `json:"concepts,omitempty"`
}

type ConceptQueueInfo struct {
	ConceptID   string `json:"concept_id"`
	DueCount    int    `json:"due_count"`
	TotalCards  int    `json:"total_cards"`
	AvgEase     float64 `json:"avg_ease"`
	TotalLapses int    `json:"total_lapses"`
}

func BuildQueueSnapshot(cards []domain.SrsCard, now time.Time) QueueSnapshot {
	if now.IsZero() {
		now = time.Now().UTC()
	}

	snap := QueueSnapshot{
		TotalCards: len(cards),
	}

	if len(cards) == 0 {
		return snap
	}

	endOfDay := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 0, now.Location())
	next24h := now.Add(24 * time.Hour)
	endOfWeek := now.AddDate(0, 0, 7)

	conceptStats := map[string]*ConceptQueueInfo{}
	nextDue := time.Time{}

	for _, c := range cards {
		info, ok := conceptStats[c.ConceptID]
		if !ok {
			info = &ConceptQueueInfo{ConceptID: c.ConceptID}
			conceptStats[c.ConceptID] = info
		}
		info.TotalCards++
		info.TotalLapses += c.Lapses
		info.AvgEase += c.EaseFactor

		if IsDue(c, now) {
			snap.TotalDue++
			info.DueCount++
		}
		if !c.DueAt.After(endOfDay) {
			snap.DueToday++
		}
		if !c.DueAt.After(next24h) {
			snap.DueNow++
		}
		if !c.DueAt.After(endOfWeek) {
			snap.DueThisWeek++
		}

		if nextDue.IsZero() || c.DueAt.Before(nextDue) {
			nextDue = c.DueAt
		}
	}

	if snap.TotalDue == 0 {
		snap.NextDueAt = nextDue
	}

	for _, info := range conceptStats {
		if info.TotalCards > 0 {
			info.AvgEase = info.AvgEase / float64(info.TotalCards)
		}
		snap.Concepts = append(snap.Concepts, *info)
	}
	sort.Slice(snap.Concepts, func(i, j int) bool {
		return snap.Concepts[i].ConceptID < snap.Concepts[j].ConceptID
	})

	return snap
}


func toSet(xs []string) map[string]struct{} {
	if len(xs) == 0 {
		return nil
	}
	out := make(map[string]struct{}, len(xs))
	for _, x := range xs {
		out[x] = struct{}{}
	}
	return out
}