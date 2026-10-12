package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/leadcortex/academy/internal/adaptivity"
)

/* ═══════════════════════════════════════════════════════════════════════
   GET /me/recommendation
   ═══════════════════════════════════════════════════════════════════════ */

func TestRecommendation_FreshLearner(t *testing.T) {
	s := buildTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/me/recommendation", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var reco adaptivity.Recommendation
	if err := json.NewDecoder(rec.Body).Decode(&reco); err != nil {
		t.Fatalf("decode : %v", err)
	}
	// Un Learner vierge doit recevoir une recommandation StartLesson.
	if reco.Kind != adaptivity.RecoStartLesson {
		t.Errorf("Kind : attendu start_lesson, obtenu %q", reco.Kind)
	}
	if reco.LessonID != "l1" {
		t.Errorf("LessonID : attendu l1, obtenu %q", reco.LessonID)
	}
}

func TestRecommendation_ResumeLesson(t *testing.T) {
	s := buildTestServer(t)
	startLesson(t, s, "alice", "l1")

	req := httptest.NewRequest(http.MethodGet, "/api/v1/me/recommendation", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	var reco adaptivity.Recommendation
	_ = json.NewDecoder(rec.Body).Decode(&reco)
	if reco.Kind != adaptivity.RecoResumeLesson {
		t.Errorf("Kind : attendu resume_lesson, obtenu %q", reco.Kind)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   POST /me/plan
   ═══════════════════════════════════════════════════════════════════════ */

func TestPlan_DefaultMode(t *testing.T) {
	s := buildTestServer(t)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/me/plan", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
	var plan adaptivity.SessionPlan
	if err := json.NewDecoder(rec.Body).Decode(&plan); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if plan.Mode != adaptivity.PlanStandard {
		t.Errorf("Mode : attendu standard, obtenu %q", plan.Mode)
	}
	if len(plan.Steps) == 0 {
		t.Error("le plan devrait contenir au moins une étape")
	}
}

func TestPlan_Micro(t *testing.T) {
	s := buildTestServer(t)

	body := strings.NewReader(`{"mode":"micro"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/me/plan", body)
	req.Header.Set("X-Learner-ID", "alice")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var plan adaptivity.SessionPlan
	_ = json.NewDecoder(rec.Body).Decode(&plan)
	if plan.Mode != adaptivity.PlanMicro {
		t.Errorf("Mode : attendu micro, obtenu %q", plan.Mode)
	}
	if len(plan.Steps) != 1 {
		t.Errorf("Micro : attendu 1 étape, obtenu %d", len(plan.Steps))
	}
}

func TestPlan_ReviewOnly(t *testing.T) {
	s := buildTestServer(t)

	body := strings.NewReader(`{"mode":"review_only"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/me/plan", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var plan adaptivity.SessionPlan
	_ = json.NewDecoder(rec.Body).Decode(&plan)
	if plan.Mode != adaptivity.PlanReviewOnly {
		t.Errorf("Mode : attendu review_only, obtenu %q", plan.Mode)
	}
}

func TestPlan_InvalidMode(t *testing.T) {
	s := buildTestServer(t)

	body := strings.NewReader(`{"mode":"nope"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/me/plan", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", rec.Code)
	}
}

func TestPlan_InvalidJSON(t *testing.T) {
	s := buildTestServer(t)

	body := strings.NewReader(`not-json`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/me/plan", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", rec.Code)
	}
}

func TestPlan_DeepMode(t *testing.T) {
	s := buildTestServer(t)

	body := strings.NewReader(`{"mode":"deep"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/me/plan", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var plan adaptivity.SessionPlan
	_ = json.NewDecoder(rec.Body).Decode(&plan)
	if plan.Mode != adaptivity.PlanDeep {
		t.Errorf("Mode : attendu deep, obtenu %q", plan.Mode)
	}
	if len(plan.Steps) < 2 {
		t.Errorf("Deep : attendu >= 2 étapes, obtenu %d", len(plan.Steps))
	}
}