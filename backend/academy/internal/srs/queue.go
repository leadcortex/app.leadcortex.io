package srs

import (
	"sort"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

// QueueOptions contrôle la construction d'une file de révision.
type QueueOptions struct {
	// Now — l'instant de référence (injectable pour les tests).
	Now time.Time

	// MaxCards — nombre maximum de cartes à retourner (0 = pas de limite).
	MaxCards int

	// ConceptFilter — si non vide, ne retourne que les cartes de ces concepts.
	ConceptFilter []string

	// OrderBy — critère de tri ("due" par défaut).
	OrderBy QueueOrder
}

// QueueOrder énumère les critères de tri d'une file de révision.
type QueueOrder string

const (
	// OrderByDue — tri par date de révision (le plus ancien d'abord).
	OrderByDue QueueOrder = "due"

	// OrderByLapses — tri par nombre d'échecs décroissant (les plus
	// difficiles d'abord).
	OrderByLapses QueueOrder = "lapses"

	// OrderByEase — tri par ease factor croissant (les plus fragiles d'abord).
	OrderByEase QueueOrder = "ease"
)

// BuildDueQueue construit la file des cartes à réviser.
//
// Seules les cartes dont `DueAt <= now` sont incluses. Les filtres
// optionnels (concept, limite, tri) sont appliqués ensuite.
//
// La file retournée est stable : à critère égal, l'ordre d'entrée est
// conservé.
func BuildDueQueue(cards []domain.SrsCard, opts QueueOptions) []domain.SrsCard {
	now := opts.Now
	if now.IsZero() {
		now = time.Now().UTC()
	}

	// Filtrage des cartes dues.
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

	// Tri.
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
		default: // OrderByDue
			return due[i].DueAt.Before(due[j].DueAt)
		}
	})

	// Limite.
	if opts.MaxCards > 0 && len(due) > opts.MaxCards {
		due = due[:opts.MaxCards]
	}
	return due
}

// QueueSnapshot résume l'état d'une file de révision pour l'UI.
type QueueSnapshot struct {
	// TotalDue — nombre total de cartes dues.
	TotalDue int `json:"total_due"`

	// TotalCards — nombre total de cartes de l'apprenant.
	TotalCards int `json:"total_cards"`

	// DueNow — cartes à réviser dans les prochaines 24h.
	DueNow int `json:"due_now"`

	// DueToday — cartes à réviser aujourd'hui (avant minuit).
	DueToday int `json:"due_today"`

	// DueThisWeek — cartes à réviser dans les 7 prochains jours.
	DueThisWeek int `json:"due_this_week"`

	// NextDueAt — prochaine date de révision (si aucune carte due).
	NextDueAt time.Time `json:"next_due_at,omitempty"`

	// Concepts — répartition par concept.
	Concepts []ConceptQueueInfo `json:"concepts,omitempty"`
}

// ConceptQueueInfo résume la file pour un concept donné.
type ConceptQueueInfo struct {
	ConceptID   string `json:"concept_id"`
	DueCount    int    `json:"due_count"`
	TotalCards  int    `json:"total_cards"`
	AvgEase     float64 `json:"avg_ease"`
	TotalLapses int    `json:"total_lapses"`
}

// BuildQueueSnapshot construit un instantané de la file pour l'UI.
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
		// Comptage par concept.
		info, ok := conceptStats[c.ConceptID]
		if !ok {
			info = &ConceptQueueInfo{ConceptID: c.ConceptID}
			conceptStats[c.ConceptID] = info
		}
		info.TotalCards++
		info.TotalLapses += c.Lapses
		info.AvgEase += c.EaseFactor

		// Comptage global.
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

		// Prochaine date de révision.
		if nextDue.IsZero() || c.DueAt.Before(nextDue) {
			nextDue = c.DueAt
		}
	}

	if snap.TotalDue == 0 {
		snap.NextDueAt = nextDue
	}

	// Finalisation des stats par concept.
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

/* ─── Helpers ─────────────────────────────────────────────────────────── */

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