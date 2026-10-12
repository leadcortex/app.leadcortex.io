package srs

import (
	"testing"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

func mkCardDue(id, concept string, dueAt time.Time, reps int, lapses int, ease float64) domain.SrsCard {
	return domain.SrsCard{
		ID:           id,
		ConceptID:    concept,
		Front:        "Q",
		Back:         "A",
		EaseFactor:   ease,
		IntervalDays: 0,
		Repetitions:  reps,
		Lapses:       lapses,
		DueAt:        dueAt,
	}
}

func TestBuildDueQueue_OnlyDue(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	past := now.Add(-24 * time.Hour)
	future := now.Add(24 * time.Hour)

	cards := []domain.SrsCard{
		mkCardDue("c1", "x", past, 0, 0, 2.5),
		mkCardDue("c2", "x", future, 0, 0, 2.5),
		mkCardDue("c3", "y", now, 0, 0, 2.5),
	}

	due := BuildDueQueue(cards, QueueOptions{Now: now})
	if len(due) != 2 {
		t.Fatalf("attendu 2 cartes dues, obtenu %d", len(due))
	}
}

func TestBuildDueQueue_OrderByLapses(t *testing.T) {
	now := time.Now().UTC()
	past := now.Add(-time.Hour)

	cards := []domain.SrsCard{
		mkCardDue("easy", "x", past, 0, 0, 2.5),
		mkCardDue("hard", "x", past, 0, 5, 1.5),
		mkCardDue("mid", "x", past, 0, 2, 2.0),
	}
	due := BuildDueQueue(cards, QueueOptions{Now: now, OrderBy: OrderByLapses})
	if due[0].ID != "hard" {
		t.Errorf("première carte : attendu hard, obtenu %s", due[0].ID)
	}
	if due[2].ID != "easy" {
		t.Errorf("dernière carte : attendu easy, obtenu %s", due[2].ID)
	}
}

func TestBuildDueQueue_MaxCards(t *testing.T) {
	now := time.Now().UTC()
	past := now.Add(-time.Hour)
	var cards []domain.SrsCard
	for i := 0; i < 10; i++ {
		cards = append(cards, mkCardDue("c", "x", past, 0, 0, 2.5))
	}
	due := BuildDueQueue(cards, QueueOptions{Now: now, MaxCards: 3})
	if len(due) != 3 {
		t.Errorf("attendu 3 cartes, obtenu %d", len(due))
	}
}

func TestBuildDueQueue_ConceptFilter(t *testing.T) {
	now := time.Now().UTC()
	past := now.Add(-time.Hour)

	cards := []domain.SrsCard{
		mkCardDue("c1", "x", past, 0, 0, 2.5),
		mkCardDue("c2", "y", past, 0, 0, 2.5),
		mkCardDue("c3", "x", past, 0, 0, 2.5),
	}
	due := BuildDueQueue(cards, QueueOptions{Now: now, ConceptFilter: []string{"x"}})
	if len(due) != 2 {
		t.Errorf("attendu 2 cartes, obtenu %d", len(due))
	}
	for _, c := range due {
		if c.ConceptID != "x" {
			t.Errorf("carte hors filtre : %s", c.ID)
		}
	}
}

func TestBuildQueueSnapshot(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	cards := []domain.SrsCard{
		mkCardDue("c1", "x", now.Add(-time.Hour), 0, 0, 2.5),
		mkCardDue("c2", "y", now.Add(48*time.Hour), 0, 0, 2.5),
		mkCardDue("c3", "x", now.Add(5*24*time.Hour), 0, 0, 2.5),
	}

	snap := BuildQueueSnapshot(cards, now)
	if snap.TotalCards != 3 {
		t.Errorf("TotalCards : attendu 3, obtenu %d", snap.TotalCards)
	}
	if snap.TotalDue != 1 {
		t.Errorf("TotalDue : attendu 1, obtenu %d", snap.TotalDue)
	}
	if len(snap.Concepts) != 2 {
		t.Errorf("Concepts : attendu 2, obtenu %d", len(snap.Concepts))
	}
}

func TestComputeStats(t *testing.T) {
	now := time.Now().UTC()
	cards := []domain.SrsCard{
		{ID: "c1", ConceptID: "x", EaseFactor: 2.5, IntervalDays: 30, Repetitions: 5, DueAt: now.Add(time.Hour)},
		{ID: "c2", ConceptID: "x", EaseFactor: 2.5, IntervalDays: 3, Repetitions: 2, Lapses: 1, DueAt: now.Add(-time.Hour)},
		{ID: "c3", ConceptID: "y", EaseFactor: 2.5, IntervalDays: 0, Repetitions: 0},
	}
	stats := ComputeStats(cards, now)
	if stats.TotalCards != 3 {
		t.Errorf("TotalCards : attendu 3, obtenu %d", stats.TotalCards)
	}
	if stats.MatureCount != 1 {
		t.Errorf("MatureCount : attendu 1, obtenu %d", stats.MatureCount)
	}
	if stats.DueCount != 1 {
		t.Errorf("DueCount : attendu 1, obtenu %d", stats.DueCount)
	}
	if stats.NewCount != 1 {
		t.Errorf("NewCount : attendu 1, obtenu %d", stats.NewCount)
	}
}

func TestForecast(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	cards := []domain.SrsCard{
		mkCardDue("c1", "x", now.Add(-time.Hour), 0, 0, 2.5),       // aujourd'hui
		mkCardDue("c2", "x", now.Add(24*time.Hour), 0, 0, 2.5),      // demain
		mkCardDue("c3", "x", now.Add(72*time.Hour), 0, 0, 2.5),      // J+3
	}
	fc := Forecast(cards, 7, now)
	if len(fc) != 7 {
		t.Fatalf("attendu 7 jours, obtenu %d", len(fc))
	}
	if fc[0].DueCount != 1 {
		t.Errorf("J0 : attendu 1, obtenu %d", fc[0].DueCount)
	}
	if fc[1].DueCount != 1 {
		t.Errorf("J1 : attendu 1, obtenu %d", fc[1].DueCount)
	}
	if fc[3].DueCount != 1 {
		t.Errorf("J3 : attendu 1, obtenu %d", fc[3].DueCount)
	}
}

func TestInstantiateFromLesson(t *testing.T) {
	lesson := &domain.Lesson{
		ID: "l1",
		SrsTemplates: []domain.SrsCardTemplate{
			{ConceptID: "c1", Front: "Q1", Back: "A1"},
			{ConceptID: "c2", Front: "Q2", Back: "A2"},
		},
	}
	now := time.Now().UTC()
	cards, err := InstantiateFromLesson(lesson, InstantiateOptions{
		LearnerID: "user-1",
		LessonID:  "l1",
		Now:       now,
	})
	if err != nil {
		t.Fatalf("InstantiateFromLesson : %v", err)
	}
	if len(cards) != 2 {
		t.Fatalf("attendu 2 cartes, obtenu %d", len(cards))
	}
	if cards[0].ConceptID != "c1" || cards[1].ConceptID != "c2" {
		t.Error("concepts non respectés")
	}
	// Les cartes sont dues immédiatement.
	if !IsDue(cards[0], now) {
		t.Error("carte 1 devrait être due")
	}
}

func TestInstantiateFromLesson_Empty(t *testing.T) {
	lesson := &domain.Lesson{ID: "l1"}
	_, err := InstantiateFromLesson(lesson, InstantiateOptions{
		LearnerID: "u", LessonID: "l1",
	})
	if err == nil {
		t.Fatal("attendu : erreur pour leçon sans template")
	}
}

func TestMergeCards(t *testing.T) {
	existing := []domain.SrsCard{
		{ID: "c1", ConceptID: "x"},
		{ID: "c2", ConceptID: "x"},
	}
	incoming := []domain.SrsCard{
		{ID: "c2", ConceptID: "x"}, // doublon
		{ID: "c3", ConceptID: "y"}, // nouveau
	}
	merged, added := MergeCards(existing, incoming)
	if len(merged) != 3 {
		t.Errorf("attendu 3 cartes, obtenu %d", len(merged))
	}
	if added != 1 {
		t.Errorf("attendu 1 ajout, obtenu %d", added)
	}
}