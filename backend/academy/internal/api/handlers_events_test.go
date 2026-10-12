package api

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

/* ═══════════════════════════════════════════════════════════════════════
   POST /events
   ═══════════════════════════════════════════════════════════════════════ */

func TestPublishEvent_MissingKind(t *testing.T) {
	s := buildTestServer(t)

	body := strings.NewReader(`{}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/events", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", rec.Code)
	}
}

func TestPublishEvent_InvalidJSON(t *testing.T) {
	s := buildTestServer(t)

	body := strings.NewReader(`not-json`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/events", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", rec.Code)
	}
}

func TestPublishEvent_InvalidAt(t *testing.T) {
	s := buildTestServer(t)

	body := strings.NewReader(`{"kind":"test.event","at":"not-a-date"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/events", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", rec.Code)
	}
}

func TestPublishEvent_NoMatchingMission(t *testing.T) {
	s := buildTestServer(t)

	// Aucune mission n'écoute "unknown.event".
	body := strings.NewReader(`{"kind":"unknown.event","payload":{}}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/events", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var resp PublishEventResponse
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if resp.Event != "unknown.event" {
		t.Errorf("Event : attendu unknown.event, obtenu %q", resp.Event)
	}
	if len(resp.ValidatedIDs) != 0 {
		t.Errorf("ValidatedIDs : attendu vide, obtenu %v", resp.ValidatedIDs)
	}
	if resp.XPAwardedTotal != 0 {
		t.Errorf("XPAwardedTotal : attendu 0, obtenu %d", resp.XPAwardedTotal)
	}
}

func TestPublishEvent_ValidatesMission(t *testing.T) {
	s := buildTestServer(t)
	startLesson(t, s, "alice", "l1")

	// "test.event" déclenche mission-1.
	body := strings.NewReader(`{"kind":"test.event","payload":{"x":1}}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/events", body)
	req.Header.Set("X-Learner-ID", "alice")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
	var resp PublishEventResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if len(resp.ValidatedIDs) != 1 {
		t.Fatalf("attendu 1 mission validée, obtenu %d (%v)", len(resp.ValidatedIDs), resp.ValidatedIDs)
	}
	if resp.ValidatedIDs[0] != "mission-1" {
		t.Errorf("ValidatedIDs[0] : attendu mission-1, obtenu %q", resp.ValidatedIDs[0])
	}
	if resp.XPAwardedTotal != 50 {
		t.Errorf("XPAwardedTotal : attendu 50, obtenu %d", resp.XPAwardedTotal)
	}

	// Persistance : XP crédité.
	stored, _ := s.deps.Repository.GetLearner(context.Background(), "alice")
	if stored.XP < 50 {
		t.Errorf("XP persisté : attendu >= 50, obtenu %d", stored.XP)
	}

	// Statut MissionProgress.
	mp, ok := stored.MissionProgress["mission-1"]
	if !ok {
		t.Fatal("MissionProgress non persisté")
	}
	if mp.Status != "completed" {
		t.Errorf("Status persisté : attendu completed, obtenu %q", mp.Status)
	}
}

func TestPublishEvent_Idempotent(t *testing.T) {
	s := buildTestServer(t)
	startLesson(t, s, "alice", "l1")

	publish := func() PublishEventResponse {
		body := strings.NewReader(`{"kind":"test.event","payload":{}}`)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/events", body)
		req.Header.Set("X-Learner-ID", "alice")
		rec := httptest.NewRecorder()
		s.Router().ServeHTTP(rec, req)
		var resp PublishEventResponse
		_ = json.NewDecoder(rec.Body).Decode(&resp)
		return resp
	}

	// Premier : valide.
	r1 := publish()
	if len(r1.ValidatedIDs) != 1 {
		t.Fatalf("premier : attendu 1 validée, obtenu %d", len(r1.ValidatedIDs))
	}

	// Second : la mission est déjà `completed`, l'orchestrator la saute.
	r2 := publish()
	if len(r2.ValidatedIDs) != 0 {
		t.Errorf("second : attendu 0 validée (déjà completed), obtenu %d (%v)",
			len(r2.ValidatedIDs), r2.ValidatedIDs)
	}
}

func TestPublishEvent_SkipsLessonNotStarted(t *testing.T) {
	s := buildTestServer(t)
	// Pas de start préalable.

	body := strings.NewReader(`{"kind":"test.event","payload":{}}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/events", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	// Doit retourner 200 (pas d'erreur), mais ne rien valider.
	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
	var resp PublishEventResponse
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if len(resp.ValidatedIDs) != 0 {
		t.Errorf("attendu 0 validée (leçon non démarrée), obtenu %v", resp.ValidatedIDs)
	}
}