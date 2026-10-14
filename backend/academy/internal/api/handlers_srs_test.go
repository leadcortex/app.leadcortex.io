package api

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/leadcortex/academy/internal/domain"
)

/* ═══════════════════════════════════════════════════════════════════════
   Helpers : complète une leçon pour déclencher l'instanciation SRS
   ═══════════════════════════════════════════════════════════════════════ */

// completeLesson joue tous les blocs d'une leçon de test via l'API.
//
// Le registre de test contient 4 blocs (cover, practice×2 ex, mission,
// debrief). Cette fonction :
//   - démarre la leçon
//   - marque cover (index 0) vu
//   - répond correctement à ex1 et ex2
//   - réussit la mission
//   - marque debrief (index 3) vu
func completeLesson(t *testing.T, s *Server, learnerID, lessonID string) {
	t.Helper()

	do := func(method, path, body string) {
		t.Helper()
		var req *http.Request
		if body != "" {
			req = httptest.NewRequest(method, path, strings.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
		} else {
			req = httptest.NewRequest(method, path, nil)
		}
		req.Header.Set("X-Learner-ID", learnerID)
		rec := httptest.NewRecorder()
		s.Router().ServeHTTP(rec, req)
		if rec.Code >= 400 {
			t.Fatalf("%s %s : %d — %s", method, path, rec.Code, rec.Body.String())
		}
	}

	do(http.MethodPost, "/api/v1/lessons/"+lessonID+"/start", "")
	do(http.MethodPost, "/api/v1/lessons/"+lessonID+"/blocks/0/view", `{"slides_consumed":1}`)
	do(http.MethodPost, "/api/v1/lessons/"+lessonID+"/exercises/ex1/answer", `{"kind":"mcq","selected":1}`)
	do(http.MethodPost, "/api/v1/lessons/"+lessonID+"/exercises/ex2/answer", `{"kind":"fill_blank","blanks":["bonjour"]}`)
	do(http.MethodPost, "/api/v1/missions/mission-1/attempt", `{"payload":{}}`)
	do(http.MethodPost, "/api/v1/lessons/"+lessonID+"/blocks/3/view", `{"slides_consumed":1}`)
	do(http.MethodGet, "/api/v1/srs/queue", "")
}

/* ═══════════════════════════════════════════════════════════════════════
   GET /srs/queue
   ═══════════════════════════════════════════════════════════════════════ */

func TestSrsQueue_EmptyBeforeCompletion(t *testing.T) {
	s := buildTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/srs/queue", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var resp struct {
		Cards []SrsCardDTO `json:"cards"`
		Count int          `json:"count"`
	}
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if resp.Count != 0 {
		t.Errorf("Count : attendu 0, obtenu %d", resp.Count)
	}
}

func TestSrsQueue_PopulatedAfterCompletion(t *testing.T) {
	s := buildTestServer(t)
	completeLesson(t, s, "alice", "l1")

	req := httptest.NewRequest(http.MethodGet, "/api/v1/srs/queue", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
	var resp struct {
		Cards []SrsCardDTO `json:"cards"`
		Count int          `json:"count"`
	}
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if resp.Count != 2 {
		t.Errorf("Count : attendu 2 cartes (2 SrsTemplates dans l1), obtenu %d", resp.Count)
	}
	if len(resp.Cards) != 2 {
		t.Fatalf("attendu 2 cartes, obtenu %d", len(resp.Cards))
	}
	for _, c := range resp.Cards {
		if c.ConceptID == "" {
			t.Error("ConceptID ne devrait pas être vide")
		}
		if !c.IsDue {
			t.Error("les cartes neuves devraient être dues immédiatement")
		}
	}
}

func TestSrsQueue_MaxParam(t *testing.T) {
	s := buildTestServer(t)
	completeLesson(t, s, "alice", "l1")

	req := httptest.NewRequest(http.MethodGet, "/api/v1/srs/queue?max=1", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	var resp struct {
		Count int `json:"count"`
	}
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if resp.Count != 1 {
		t.Errorf("Count : attendu 1, obtenu %d", resp.Count)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   POST /srs/cards/{id}/review
   ═══════════════════════════════════════════════════════════════════════ */

func TestSrsReview_Success(t *testing.T) {
	s := buildTestServer(t)
	completeLesson(t, s, "alice", "l1")

	// Récupère l'ID de la première carte.
	cards, _ := s.deps.Repository.GetSrsCards(context.Background(), "alice")
	if len(cards) == 0 {
		t.Fatal("aucune carte persistée après complétion")
	}
	cardID := cards[0].ID

	body := strings.NewReader(`{"button":"good"}`)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/srs/cards/"+cardID+"/review", body)
	req.Header.Set("X-Learner-ID", "alice")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
	var resp struct {
		Card SrsCardDTO `json:"card"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if resp.Card.ID != cardID {
		t.Errorf("ID : attendu %s, obtenu %s", cardID, resp.Card.ID)
	}
	if resp.Card.Repetitions != 1 {
		t.Errorf("Repetitions : attendu 1, obtenu %d", resp.Card.Repetitions)
	}
	if resp.Card.IntervalDays != 1 {
		t.Errorf("IntervalDays : attendu 1, obtenu %d", resp.Card.IntervalDays)
	}
	if resp.Card.IsDue {
		t.Error("après une review grade=good, la carte ne devrait plus être due")
	}
}

func TestSrsReview_InvalidButton(t *testing.T) {
	s := buildTestServer(t)
	completeLesson(t, s, "alice", "l1")

	cards, _ := s.deps.Repository.GetSrsCards(context.Background(), "alice")
	cardID := cards[0].ID

	body := strings.NewReader(`{"button":"nope"}`)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/srs/cards/"+cardID+"/review", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", rec.Code)
	}
}

func TestSrsReview_UnknownCard(t *testing.T) {
	s := buildTestServer(t)
	completeLesson(t, s, "alice", "l1")

	body := strings.NewReader(`{"button":"good"}`)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/srs/cards/does-not-exist/review", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("attendu 404, obtenu %d", rec.Code)
	}
}

func TestSrsReview_InvalidJSON(t *testing.T) {
	s := buildTestServer(t)
	completeLesson(t, s, "alice", "l1")

	body := strings.NewReader(`not-json`)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/srs/cards/x/review", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", rec.Code)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   GET /srs/stats
   ═══════════════════════════════════════════════════════════════════════ */

func TestSrsStats(t *testing.T) {
	s := buildTestServer(t)
	completeLesson(t, s, "alice", "l1")

	req := httptest.NewRequest(http.MethodGet, "/api/v1/srs/stats", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var resp struct {
		Stats struct {
			TotalCards int `json:"total_cards"`
			DueCount   int `json:"due_count"`
			NewCount   int `json:"new_count"`
		} `json:"stats"`
		Queue struct {
			TotalCards int `json:"total_cards"`
			TotalDue   int `json:"total_due"`
		} `json:"queue"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if resp.Stats.TotalCards != 2 {
		t.Errorf("Stats.TotalCards : attendu 2, obtenu %d", resp.Stats.TotalCards)
	}
	if resp.Stats.NewCount != 2 {
		t.Errorf("Stats.NewCount : attendu 2, obtenu %d", resp.Stats.NewCount)
	}
	if resp.Queue.TotalCards != 2 {
		t.Errorf("Queue.TotalCards : attendu 2, obtenu %d", resp.Queue.TotalCards)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   GET /srs/forecast
   ═══════════════════════════════════════════════════════════════════════ */

func TestSrsForecast(t *testing.T) {
	s := buildTestServer(t)
	completeLesson(t, s, "alice", "l1")

	req := httptest.NewRequest(http.MethodGet, "/api/v1/srs/forecast?days=7", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var resp struct {
		Days     int `json:"days"`
		Forecast []struct {
			Date      string `json:"date"`
			DayOffset int    `json:"day_offset"`
			DueCount  int    `json:"due_count"`
		} `json:"forecast"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if resp.Days != 7 {
		t.Errorf("Days : attendu 7, obtenu %d", resp.Days)
	}
	if len(resp.Forecast) != 7 {
		t.Errorf("Forecast : attendu 7 entrées, obtenu %d", len(resp.Forecast))
	}
	// Aujourd'hui (offset 0) doit contenir les 2 cartes neuves.
	if resp.Forecast[0].DueCount != 2 {
		t.Errorf("J0 DueCount : attendu 2, obtenu %d", resp.Forecast[0].DueCount)
	}
}

func TestSrsForecast_DefaultDays(t *testing.T) {
	s := buildTestServer(t)
	completeLesson(t, s, "alice", "l1")

	req := httptest.NewRequest(http.MethodGet, "/api/v1/srs/forecast", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	var resp struct {
		Days int `json:"days"`
	}
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if resp.Days != 30 {
		t.Errorf("Days par défaut : attendu 30, obtenu %d", resp.Days)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   syncSrsCards : idempotence
   ═══════════════════════════════════════════════════════════════════════ */

func TestSyncSrsCards_Idempotent(t *testing.T) {
	s := buildTestServer(t)
	completeLesson(t, s, "alice", "l1")

	// Appel 1.
	req1 := httptest.NewRequest(http.MethodGet, "/api/v1/srs/queue", nil)
	req1.Header.Set("X-Learner-ID", "alice")
	rec1 := httptest.NewRecorder()
	s.Router().ServeHTTP(rec1, req1)

	// Appel 2 : ne doit pas dupliquer.
	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/srs/queue", nil)
	req2.Header.Set("X-Learner-ID", "alice")
	rec2 := httptest.NewRecorder()
	s.Router().ServeHTTP(rec2, req2)

	cards, _ := s.deps.Repository.GetSrsCards(context.Background(), "alice")
	if len(cards) != 2 {
		t.Errorf("attendu 2 cartes (pas de doublons), obtenu %d", len(cards))
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   Vérification du registre test : l1 a bien 2 SrsTemplates
   ═══════════════════════════════════════════════════════════════════════ */

func TestTestRegistry_HasSrsTemplates(t *testing.T) {
	s := buildTestServer(t)
	lesson, ok := s.deps.Registry.Lesson("l1")
	if !ok {
		t.Fatal("l1 introuvable")
	}
	if len(lesson.SrsTemplates) != 2 {
		t.Errorf("l1 devrait avoir 2 SrsTemplates, obtenu %d", len(lesson.SrsTemplates))
	}
}

// sanity check pour éviter unused (domain)
var _ = domain.SrsCardTemplate{}
