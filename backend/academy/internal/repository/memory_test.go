package repository

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/leadcortex/academy/internal/domain"
	"github.com/leadcortex/academy/internal/gamification"
)

/* ─── Fixtures ────────────────────────────────────────────────────────── */

func newTestLearner(id string) *domain.Learner {
	l := domain.NewLearner(id, "Test "+id, id+"@example.com")
	return l
}

func fixedDate() time.Time {
	return time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
}

/* ─── Learner : CRUD ──────────────────────────────────────────────────── */

func TestMemory_SaveAndGetLearner(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	ctx := context.Background()

	l := newTestLearner("u1")
	l.XP = 250
	l.Level = 3

	if err := repo.SaveLearner(ctx, l); err != nil {
		t.Fatalf("SaveLearner : %v", err)
	}

	got, err := repo.GetLearner(ctx, "u1")
	if err != nil {
		t.Fatalf("GetLearner : %v", err)
	}
	if got.ID != "u1" {
		t.Errorf("ID : attendu u1, obtenu %s", got.ID)
	}
	if got.XP != 250 || got.Level != 3 {
		t.Errorf("XP/Level : attendu 250/3, obtenu %d/%d", got.XP, got.Level)
	}
}

func TestMemory_GetLearner_NotFound(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	_, err := repo.GetLearner(context.Background(), "unknown")
	if !errors.Is(err, ErrNotFound) {
		t.Errorf("attendu ErrNotFound, obtenu %v", err)
	}
}

func TestMemory_GetLearner_EmptyID(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	_, err := repo.GetLearner(context.Background(), "")
	if !errors.Is(err, ErrInvalidArgument) {
		t.Errorf("attendu ErrInvalidArgument, obtenu %v", err)
	}
}

func TestMemory_SaveLearner_NilLearner(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	err := repo.SaveLearner(context.Background(), nil)
	if !errors.Is(err, ErrInvalidArgument) {
		t.Errorf("attendu ErrInvalidArgument, obtenu %v", err)
	}
}

func TestMemory_SaveLearner_EmptyID(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	l := &domain.Learner{}
	err := repo.SaveLearner(context.Background(), l)
	if !errors.Is(err, ErrInvalidArgument) {
		t.Errorf("attendu ErrInvalidArgument, obtenu %v", err)
	}
}

func TestMemory_SaveLearner_Overwrite(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	ctx := context.Background()

	l := newTestLearner("u1")
	l.XP = 100
	_ = repo.SaveLearner(ctx, l)

	l.XP = 500
	l.Level = 4
	if err := repo.SaveLearner(ctx, l); err != nil {
		t.Fatalf("second save : %v", err)
	}

	got, _ := repo.GetLearner(ctx, "u1")
	if got.XP != 500 {
		t.Errorf("XP après overwrite : attendu 500, obtenu %d", got.XP)
	}
}

func TestMemory_DeleteLearner(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	ctx := context.Background()

	l := newTestLearner("u1")
	_ = repo.SaveLearner(ctx, l)

	if err := repo.DeleteLearner(ctx, "u1"); err != nil {
		t.Fatalf("DeleteLearner : %v", err)
	}
	_, err := repo.GetLearner(ctx, "u1")
	if !errors.Is(err, ErrNotFound) {
		t.Errorf("attendu ErrNotFound après delete, obtenu %v", err)
	}

	// Idempotent.
	if err := repo.DeleteLearner(ctx, "u1"); err != nil {
		t.Errorf("second delete : attendu nil, obtenu %v", err)
	}
}

func TestMemory_ListLearners(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	ctx := context.Background()

	_ = repo.SaveLearner(ctx, newTestLearner("u1"))
	_ = repo.SaveLearner(ctx, newTestLearner("u2"))

	list, err := repo.ListLearners(ctx)
	if err != nil {
		t.Fatalf("ListLearners : %v", err)
	}
	if len(list) != 2 {
		t.Errorf("attendu 2, obtenu %d", len(list))
	}
}

/* ─── Deep-copy défensif ──────────────────────────────────────────────── */

func TestMemory_DeepCopyLearner(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	ctx := context.Background()

	l := newTestLearner("u1")
	l.UnlockedAvatarIDs = []string{"eagle"}
	l.LessonProgress["l1"] = domain.LessonProgress{
		LessonID:           "l1",
		Status:             domain.LessonStatusCompleted,
		BlockStates:        []domain.BlockState{{Viewed: true}},
		Scores:             map[string]int{"ex1": 100},
		AttemptsByExercise: map[string]int{"ex1": 1},
	}

	_ = repo.SaveLearner(ctx, l)

	// Modifier l'objet d'origine ne doit pas affecter le repository.
	l.UnlockedAvatarIDs = append(l.UnlockedAvatarIDs, "fox")
	l.LessonProgress["l1"].Scores["ex1"] = 0

	got, _ := repo.GetLearner(ctx, "u1")
	if len(got.UnlockedAvatarIDs) != 1 {
		t.Errorf("UnlockedAvatarIDs devrait être [eagle], obtenu %v", got.UnlockedAvatarIDs)
	}
	if got.LessonProgress["l1"].Scores["ex1"] != 100 {
		t.Errorf("Scores[ex1] devrait être 100, obtenu %d", got.LessonProgress["l1"].Scores["ex1"])
	}

	// Modifier l'objet retourné ne doit pas affecter le repository non plus.
	got.UnlockedAvatarIDs[0] = "MODIFIED"
	got2, _ := repo.GetLearner(ctx, "u1")
	if got2.UnlockedAvatarIDs[0] != "eagle" {
		t.Errorf("le repository a été muté : %v", got2.UnlockedAvatarIDs)
	}
}

/* ─── SRS ─────────────────────────────────────────────────────────────── */

func TestMemory_SrsCards_RoundTrip(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	ctx := context.Background()

	cards := []domain.SrsCard{
		*domain.NewSrsCard("c1", "concept-1", "Q1", "A1"),
		*domain.NewSrsCard("c2", "concept-2", "Q2", "A2"),
	}
	if err := repo.SaveSrsCards(ctx, "u1", cards); err != nil {
		t.Fatalf("SaveSrsCards : %v", err)
	}

	got, err := repo.GetSrsCards(ctx, "u1")
	if err != nil {
		t.Fatalf("GetSrsCards : %v", err)
	}
	if len(got) != 2 {
		t.Errorf("attendu 2 cartes, obtenu %d", len(got))
	}
	if got[0].ConceptID != "concept-1" {
		t.Errorf("ConceptID : attendu concept-1, obtenu %s", got[0].ConceptID)
	}
}

func TestMemory_SrsCards_Empty(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	got, err := repo.GetSrsCards(context.Background(), "u1")
	if err != nil {
		t.Fatalf("GetSrsCards : %v", err)
	}
	if got == nil {
		t.Error("attendu slice non-nil (vide)")
	}
	if len(got) != 0 {
		t.Errorf("attendu 0, obtenu %d", len(got))
	}
}

func TestMemory_SrsCards_Replace(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	ctx := context.Background()

	_ = repo.SaveSrsCards(ctx, "u1", []domain.SrsCard{
		*domain.NewSrsCard("c1", "x", "Q", "A"),
		*domain.NewSrsCard("c2", "y", "Q", "A"),
	})
	_ = repo.SaveSrsCards(ctx, "u1", []domain.SrsCard{
		*domain.NewSrsCard("c3", "z", "Q", "A"),
	})

	got, _ := repo.GetSrsCards(ctx, "u1")
	if len(got) != 1 || got[0].ID != "c3" {
		t.Errorf("attendu [c3], obtenu %v", got)
	}
}

/* ─── Quests ──────────────────────────────────────────────────────────── */

func TestMemory_Quests_RoundTrip(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	ctx := context.Background()
	date := fixedDate()

	quests := []gamification.Quest{
		{ID: "q1", Kind: gamification.QuestXP, Title: "XP", Target: 50, Reward: 10},
		{ID: "q2", Kind: gamification.QuestLessons, Title: "Leçons", Target: 1, Reward: 20},
	}
	if err := repo.SaveQuests(ctx, "u1", date, quests); err != nil {
		t.Fatalf("SaveQuests : %v", err)
	}

	got, err := repo.GetQuests(ctx, "u1", date)
	if err != nil {
		t.Fatalf("GetQuests : %v", err)
	}
	if len(got) != 2 {
		t.Errorf("attendu 2, obtenu %d", len(got))
	}
}

func TestMemory_Quests_DifferentDays(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	ctx := context.Background()

	d1 := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	d2 := time.Date(2026, 1, 16, 10, 0, 0, 0, time.UTC)

	_ = repo.SaveQuests(ctx, "u1", d1, []gamification.Quest{{ID: "q-day1"}})
	_ = repo.SaveQuests(ctx, "u1", d2, []gamification.Quest{{ID: "q-day2"}})

	got1, _ := repo.GetQuests(ctx, "u1", d1)
	got2, _ := repo.GetQuests(ctx, "u1", d2)

	if len(got1) != 1 || got1[0].ID != "q-day1" {
		t.Errorf("jour 1 : attendu q-day1, obtenu %v", got1)
	}
	if len(got2) != 1 || got2[0].ID != "q-day2" {
		t.Errorf("jour 2 : attendu q-day2, obtenu %v", got2)
	}
}

func TestMemory_Quests_Empty(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	got, err := repo.GetQuests(context.Background(), "u1", fixedDate())
	if err != nil {
		t.Fatalf("GetQuests : %v", err)
	}
	if got == nil || len(got) != 0 {
		t.Errorf("attendu slice vide non-nil, obtenu %v", got)
	}
}

func TestMemory_Quests_ZeroDate(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	_, err := repo.GetQuests(context.Background(), "u1", time.Time{})
	if !errors.Is(err, ErrInvalidArgument) {
		t.Errorf("attendu ErrInvalidArgument, obtenu %v", err)
	}
}

/* ─── Event log ───────────────────────────────────────────────────────── */

func TestMemory_AppendAndListEvents(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	ctx := context.Background()

	for i := 0; i < 3; i++ {
		ev := StoredEvent{
			ID:      "ev" + string(rune('0'+i)),
			Kind:    "lead.created",
			At:      fixedDate().Add(time.Duration(i) * time.Minute),
			Payload: map[string]any{"score": i},
		}
		if err := repo.AppendEvent(ctx, "u1", ev); err != nil {
			t.Fatalf("AppendEvent : %v", err)
		}
	}

	got, err := repo.ListRecentEvents(ctx, "u1", 0)
	if err != nil {
		t.Fatalf("ListRecentEvents : %v", err)
	}
	if len(got) != 3 {
		t.Fatalf("attendu 3, obtenu %d", len(got))
	}
	// Le plus récent en premier.
	if got[0].ID != "ev2" {
		t.Errorf("premier : attendu ev2, obtenu %s", got[0].ID)
	}
}

func TestMemory_ListRecentEvents_Limit(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	ctx := context.Background()

	for i := 0; i < 5; i++ {
		_ = repo.AppendEvent(ctx, "u1", StoredEvent{
			ID:   "ev" + string(rune('0'+i)),
			Kind: "test",
			At:   fixedDate(),
		})
	}

	got, _ := repo.ListRecentEvents(ctx, "u1", 2)
	if len(got) != 2 {
		t.Errorf("attendu 2, obtenu %d", len(got))
	}
}

func TestMemory_AppendEvent_EmptyKind(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	err := repo.AppendEvent(context.Background(), "u1", StoredEvent{ID: "ev"})
	if !errors.Is(err, ErrInvalidArgument) {
		t.Errorf("attendu ErrInvalidArgument, obtenu %v", err)
	}
}

func TestMemory_EventLog_BoundedCapacity(t *testing.T) {
	repo := NewMemoryWithEvents(3)
	defer repo.Close()
	ctx := context.Background()

	for i := 0; i < 10; i++ {
		_ = repo.AppendEvent(ctx, "u1", StoredEvent{
			ID:   "ev" + string(rune('0'+i)),
			Kind: "test",
			At:   fixedDate(),
		})
	}

	got, _ := repo.ListRecentEvents(ctx, "u1", 0)
	if len(got) != 3 {
		t.Errorf("capacité 3 : attendu 3, obtenu %d", len(got))
	}
	// Les 3 derniers (ev7, ev8, ev9) doivent rester.
	if got[0].ID != "ev9" {
		t.Errorf("le plus récent : attendu ev9, obtenu %s", got[0].ID)
	}
}

/* ─── Concurrence ─────────────────────────────────────────────────────── */

func TestMemory_ConcurrentAccess(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	ctx := context.Background()

	var wg sync.WaitGroup
	const n = 20

	for i := 0; i < n; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			l := newTestLearner("u1")
			l.XP = i
			_ = repo.SaveLearner(ctx, l)
			_, _ = repo.GetLearner(ctx, "u1")
		}(i)
	}
	wg.Wait()

	got, err := repo.GetLearner(ctx, "u1")
	if err != nil {
		t.Fatalf("GetLearner après concurrence : %v", err)
	}
	if got.ID != "u1" {
		t.Errorf("ID : attendu u1, obtenu %s", got.ID)
	}
}

/* ─── Close / Ping ────────────────────────────────────────────────────── */

func TestMemory_Ping(t *testing.T) {
	repo := NewMemory()
	defer repo.Close()
	if err := repo.Ping(context.Background()); err != nil {
		t.Errorf("Ping : %v", err)
	}
}

func TestMemory_Close(t *testing.T) {
	repo := NewMemory()
	if err := repo.Close(); err != nil {
		t.Fatalf("Close : %v", err)
	}
	// Idempotent.
	if err := repo.Close(); err != nil {
		t.Errorf("second Close : %v", err)
	}
	// Opérations après close → ErrClosed.
	_, err := repo.GetLearner(context.Background(), "u1")
	if !errors.Is(err, ErrClosed) {
		t.Errorf("attendu ErrClosed, obtenu %v", err)
	}
}