package api

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/leadcortex/academy/internal/gamification"
)

/* ═══════════════════════════════════════════════════════════════════════
   GET /quests
   ═══════════════════════════════════════════════════════════════════════ */

func TestGetQuests_GeneratesOnFirstCall(t *testing.T) {
	s := buildTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/quests", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var summary gamification.QuestStatusForLearner
	if err := json.NewDecoder(rec.Body).Decode(&summary); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if summary.Total != gamification.DailyQuestCount {
		t.Errorf("Total : attendu %d, obtenu %d",
			gamification.DailyQuestCount, summary.Total)
	}
	if len(summary.Quests) != gamification.DailyQuestCount {
		t.Fatalf("Quests : attendu %d, obtenu %d",
			gamification.DailyQuestCount, len(summary.Quests))
	}
	for _, q := range summary.Quests {
		if q.Status != gamification.QuestStatusActive {
			t.Errorf("quête fraîche devrait être active : %s = %s", q.ID, q.Status)
		}
	}
}

func TestGetQuests_Deterministic(t *testing.T) {
	s := buildTestServer(t)

	fetch := func() gamification.QuestStatusForLearner {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/quests", nil)
		req.Header.Set("X-Learner-ID", "alice")
		rec := httptest.NewRecorder()
		s.Router().ServeHTTP(rec, req)
		var summary gamification.QuestStatusForLearner
		_ = json.NewDecoder(rec.Body).Decode(&summary)
		return summary
	}

	s1 := fetch()
	s2 := fetch()

	if len(s1.Quests) != len(s2.Quests) {
		t.Fatalf("nombre de quêtes divergent : %d vs %d", len(s1.Quests), len(s2.Quests))
	}
	for i := range s1.Quests {
		if s1.Quests[i].ID != s2.Quests[i].ID {
			t.Errorf("ID divergent à l'index %d : %s vs %s",
				i, s1.Quests[i].ID, s2.Quests[i].ID)
		}
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   POST /quests/{id}/claim
   ═══════════════════════════════════════════════════════════════════════ */

// seedCompletedQuest fabrique une quête "complete" dans le repository.
func seedCompletedQuest(
	t *testing.T,
	s *Server,
	learnerID string,
	questID string,
	reward int,
) {
	t.Helper()
	now := s.deps.Clock.Now()
	quests := []gamification.Quest{
		{
			ID:       questID,
			Date:     now.UTC().Format("2006-01-02"),
			Kind:     gamification.QuestXP,
			Title:    "Test",
			Target:   10,
			Progress: 10,
			Reward:   reward,
			Status:   gamification.QuestStatusComplete,
		},
	}
	if err := s.deps.Repository.SaveQuests(
		context.Background(), learnerID, now, quests,
	); err != nil {
		t.Fatalf("seed quest : %v", err)
	}
}

func TestClaimQuest_Success(t *testing.T) {
	s := buildTestServer(t)
	seedCompletedQuest(t, s, "alice", "q-manual", 25)

	body := strings.NewReader(`{}`)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/quests/q-manual/claim", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
	var resp QuestClaimResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if resp.QuestID != "q-manual" {
		t.Errorf("QuestID : attendu q-manual, obtenu %q", resp.QuestID)
	}
	if resp.XPAwarded != 25 {
		t.Errorf("XPAwarded : attendu 25, obtenu %d", resp.XPAwarded)
	}

	// XP crédité au Learner.
	stored, _ := s.deps.Repository.GetLearner(context.Background(), "alice")
	if stored.XP != 25 {
		t.Errorf("XP Learner : attendu 25, obtenu %d", stored.XP)
	}
}

func TestClaimQuest_NotFound(t *testing.T) {
	s := buildTestServer(t)

	body := strings.NewReader(`{}`)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/quests/unknown/claim", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("attendu 404, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
}

func TestClaimQuest_NotComplete(t *testing.T) {
	s := buildTestServer(t)

	// Génère une quête active (via GET).
	req1 := httptest.NewRequest(http.MethodGet, "/api/v1/quests", nil)
	req1.Header.Set("X-Learner-ID", "alice")
	rec1 := httptest.NewRecorder()
	s.Router().ServeHTTP(rec1, req1)

	var summary gamification.QuestStatusForLearner
	_ = json.NewDecoder(rec1.Body).Decode(&summary)
	if len(summary.Quests) == 0 {
		t.Fatal("pas de quêtes générées")
	}
	qid := summary.Quests[0].ID

	body := strings.NewReader(`{}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/quests/"+qid+"/claim", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	// La quête est encore active → ErrQuestNotComplete → 400.
	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   Progression automatique après actions
   ═══════════════════════════════════════════════════════════════════════ */

func TestQuests_ProgressAfterExercise(t *testing.T) {
	s := buildTestServer(t)
	startLesson(t, s, "alice", "l1")

	// Répond correctement à ex1 (MCQ → 10 XP).
	body := strings.NewReader(`{"kind":"mcq","selected":1}`)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/lessons/l1/exercises/ex1/answer", body)
	req.Header.Set("X-Learner-ID", "alice")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("answer : %d", rec.Code)
	}

	// Récupère les quêtes.
	reqQ := httptest.NewRequest(http.MethodGet, "/api/v1/quests", nil)
	reqQ.Header.Set("X-Learner-ID", "alice")
	recQ := httptest.NewRecorder()
	s.Router().ServeHTTP(recQ, reqQ)

	var summary gamification.QuestStatusForLearner
	_ = json.NewDecoder(recQ.Body).Decode(&summary)

	// Au moins une quête doit avoir progressé.
	hasProgress := false
	for _, q := range summary.Quests {
		if q.Progress > 0 {
			hasProgress = true
		}
	}
	if !hasProgress {
		t.Errorf("au moins une quête devrait avoir progressé : %+v", summary.Quests)
	}
}