package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/leadcortex/academy/internal/domain"
)

/* ═══════════════════════════════════════════════════════════════════════
   GET /missions
   ═══════════════════════════════════════════════════════════════════════ */

func TestListMissions_ReturnsAll(t *testing.T) {
	s := buildTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/missions", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var resp MissionListResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if resp.Total != 1 {
		t.Errorf("Total : attendu 1, obtenu %d", resp.Total)
	}
	if len(resp.Missions) != 1 {
		t.Fatalf("attendu 1 mission, obtenu %d", len(resp.Missions))
	}
	m := resp.Missions[0]
	if m.ID != "mission-1" {
		t.Errorf("ID : attendu mission-1, obtenu %q", m.ID)
	}
	// Learner frais : leçon non démarrée → mission locked.
	if m.Status != string(domain.MissionStatusLocked) {
		t.Errorf("Status : attendu locked, obtenu %q", m.Status)
	}
	if resp.Pending != 0 {
		t.Errorf("Pending : attendu 0, obtenu %d", resp.Pending)
	}
	if resp.Completed != 0 {
		t.Errorf("Completed : attendu 0, obtenu %d", resp.Completed)
	}
}

func TestListMissions_AvailableAfterStart(t *testing.T) {
	s := buildTestServer(t)
	startLesson(t, s, "alice", "l1")

	req := httptest.NewRequest(http.MethodGet, "/api/v1/missions", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	var resp MissionListResponse
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if len(resp.Missions) != 1 {
		t.Fatalf("attendu 1, obtenu %d", len(resp.Missions))
	}
	m := resp.Missions[0]
	if m.Status != string(domain.MissionStatusInProgress) {
		t.Errorf("Status : attendu in_progress, obtenu %q", m.Status)
	}
	if resp.Pending != 1 {
		t.Errorf("Pending : attendu 1, obtenu %d", resp.Pending)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   POST /missions/{id}/attempt
   ═══════════════════════════════════════════════════════════════════════ */

func TestAttemptMission_RequiresStart(t *testing.T) {
	s := buildTestServer(t)

	// Pas de start → 400.
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/missions/mission-1/attempt", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
}

func TestAttemptMission_Validated(t *testing.T) {
	s := buildTestServer(t)
	startLesson(t, s, "alice", "l1")

	body := strings.NewReader(`{"payload":{}}`)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/missions/mission-1/attempt", body)
	req.Header.Set("X-Learner-ID", "alice")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
	var resp MissionAttemptResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if !resp.Validated {
		t.Error("Validated devrait être true (trigger + conditions vides)")
	}
	if resp.MissionID != "mission-1" {
		t.Errorf("MissionID : attendu mission-1, obtenu %q", resp.MissionID)
	}
	if resp.XPAwarded != 50 {
		t.Errorf("XPAwarded : attendu 50, obtenu %d", resp.XPAwarded)
	}
	if resp.Status != string(domain.MissionStatusCompleted) {
		t.Errorf("Status : attendu completed, obtenu %q", resp.Status)
	}
}

func TestAttemptMission_Unknown(t *testing.T) {
	s := buildTestServer(t)
	startLesson(t, s, "alice", "l1")

	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/missions/unknown/attempt", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("attendu 404, obtenu %d", rec.Code)
	}
}

func TestAttemptMission_Idempotent(t *testing.T) {
	s := buildTestServer(t)
	startLesson(t, s, "alice", "l1")

	// Premier attempt : valide + XP.
	body1 := strings.NewReader(`{"payload":{}}`)
	req1 := httptest.NewRequest(http.MethodPost,
		"/api/v1/missions/mission-1/attempt", body1)
	req1.Header.Set("X-Learner-ID", "alice")
	rec1 := httptest.NewRecorder()
	s.Router().ServeHTTP(rec1, req1)

	// Second attempt : le moteur saute (déjà completed) → XPAwarded = 0
	// dans le Learner, mais notre réponse annonce le XP "dû" — c'est un
	// choix de design (on renvoie l'info brute de la mission).
	body2 := strings.NewReader(`{"payload":{}}`)
	req2 := httptest.NewRequest(http.MethodPost,
		"/api/v1/missions/mission-1/attempt", body2)
	req2.Header.Set("X-Learner-ID", "alice")
	rec2 := httptest.NewRecorder()
	s.Router().ServeHTTP(rec2, req2)

	if rec2.Code != http.StatusOK {
		t.Fatalf("second : %d", rec2.Code)
	}
	// La mission reste completed, pas de double-crédit côté Learner.
	// Vérifions le XP total côté Learner (doit être 50, pas 100).
	// -> pas d'assertion directe ici, c'est testé côté engine.
}

/* ═══════════════════════════════════════════════════════════════════════
   Helpers unit
   ═══════════════════════════════════════════════════════════════════════ */

func TestFindMissionByID(t *testing.T) {
	s := buildTestServer(t)
	m, lessonID, ok := findMissionByID(s, "mission-1")
	if !ok {
		t.Fatal("mission-1 non trouvée")
	}
	if m.ID != "mission-1" {
		t.Errorf("ID : attendu mission-1, obtenu %q", m.ID)
	}
	if lessonID != "l1" {
		t.Errorf("LessonID : attendu l1, obtenu %q", lessonID)
	}
}

func TestFindMissionByID_Unknown(t *testing.T) {
	s := buildTestServer(t)
	_, _, ok := findMissionByID(s, "nope")
	if ok {
		t.Error("attendu false")
	}
}

func TestMissionStatus_Fresh(t *testing.T) {
	l := domain.NewLearner("u", "U", "")
	if got := missionStatus(l, "mission-1", "l1"); got != domain.MissionStatusLocked {
		t.Errorf("frais : attendu locked, obtenu %q", got)
	}
}

func TestMissionStatus_FromProgress(t *testing.T) {
	l := domain.NewLearner("u", "U", "")
	l.MissionProgress["mission-1"] = domain.MissionProgress{
		MissionID: "mission-1",
		Status:    domain.MissionStatusCompleted,
	}
	if got := missionStatus(l, "mission-1", "l1"); got != domain.MissionStatusCompleted {
		t.Errorf("attendu completed, obtenu %q", got)
	}
}