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
   GET /lessons/{id}
   ═══════════════════════════════════════════════════════════════════════ */

func TestGetLesson_ReturnsDetail(t *testing.T) {
	s := buildTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/lessons/l1", nil)
	req.Header.Set("X-Learner-ID", "u1")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var dto LessonDetailDTO
	if err := json.NewDecoder(rec.Body).Decode(&dto); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if dto.ID != "l1" {
		t.Errorf("ID : attendu l1, obtenu %q", dto.ID)
	}
	if len(dto.Blocks) == 0 {
		t.Fatal("attendu au moins 1 bloc")
	}
	// Le premier bloc doit être cover.
	if dto.Blocks[0].Type != "cover" {
		t.Errorf("premier bloc : attendu cover, obtenu %q", dto.Blocks[0].Type)
	}
	// On doit trouver un bloc practice.
	hasPractice := false
	for _, b := range dto.Blocks {
		if b.Type == "practice" {
			hasPractice = true
			if b.Practice == nil {
				t.Error("bloc practice : Practice est nil")
			} else if len(b.Practice.Exercises) == 0 {
				t.Error("bloc practice : aucun exercice")
			}
		}
	}
	if !hasPractice {
		t.Error("attendu au moins un bloc practice")
	}
}

func TestGetLesson_NotFound(t *testing.T) {
	s := buildTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/lessons/unknown", nil)
	req.Header.Set("X-Learner-ID", "u1")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Errorf("attendu 404, obtenu %d", rec.Code)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   POST /lessons/{id}/start
   ═══════════════════════════════════════════════════════════════════════ */

func TestStartLesson_Success(t *testing.T) {
	s := buildTestServer(t)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/lessons/l1/start", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
	var resp lessonActionResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if resp.LessonID != "l1" {
		t.Errorf("LessonID : attendu l1, obtenu %q", resp.LessonID)
	}
	if resp.Status != string(domain.LessonStatusInProgress) {
		t.Errorf("Status : attendu in_progress, obtenu %q", resp.Status)
	}
	if !resp.Transitioned {
		t.Error("Transitioned devrait être true")
	}

	// Vérifier la persistance.
	stored, _ := s.deps.Repository.GetLearner(context.Background(), "alice")
	lp, ok := stored.LessonProgress["l1"]
	if !ok {
		t.Fatal("LessonProgress non persisté")
	}
	if lp.Status != domain.LessonStatusInProgress {
		t.Errorf("Status persisté : attendu in_progress, obtenu %q", lp.Status)
	}
}

func TestStartLesson_Idempotent(t *testing.T) {
	s := buildTestServer(t)

	// Premier start.
	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/lessons/l1/start", nil)
	req1.Header.Set("X-Learner-ID", "alice")
	rec1 := httptest.NewRecorder()
	s.Router().ServeHTTP(rec1, req1)
	if rec1.Code != http.StatusOK {
		t.Fatalf("premier start : %d", rec1.Code)
	}

	// Second start : doit rester OK sans Transitioned.
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/lessons/l1/start", nil)
	req2.Header.Set("X-Learner-ID", "alice")
	rec2 := httptest.NewRecorder()
	s.Router().ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusOK {
		t.Fatalf("second start : attendu 200, obtenu %d", rec2.Code)
	}
	var resp lessonActionResponse
	_ = json.NewDecoder(rec2.Body).Decode(&resp)
	if resp.Status != string(domain.LessonStatusInProgress) {
		t.Errorf("Status : attendu in_progress, obtenu %q", resp.Status)
	}
}

func TestStartLesson_NotFound(t *testing.T) {
	s := buildTestServer(t)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/lessons/unknown/start", nil)
	req.Header.Set("X-Learner-ID", "u1")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Errorf("attendu 404, obtenu %d", rec.Code)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   POST /lessons/{id}/blocks/{i}/view
   ═══════════════════════════════════════════════════════════════════════ */

func TestViewBlock_RequiresStart(t *testing.T) {
	s := buildTestServer(t)

	// Vue sans start préalable.
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/lessons/l1/blocks/0/view", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	// Le moteur refuse (LessonNotStarted) → 400.
	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
}

func TestViewBlock_Success(t *testing.T) {
	s := buildTestServer(t)

	// Démarre d'abord la leçon.
	startReq := httptest.NewRequest(http.MethodPost, "/api/v1/lessons/l1/start", nil)
	startReq.Header.Set("X-Learner-ID", "alice")
	startRec := httptest.NewRecorder()
	s.Router().ServeHTTP(startRec, startReq)
	if startRec.Code != http.StatusOK {
		t.Fatalf("start : %d", startRec.Code)
	}

	// Marque le bloc 0 comme vu.
	body := strings.NewReader(`{"slides_consumed":1}`)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/lessons/l1/blocks/0/view", body)
	req.Header.Set("X-Learner-ID", "alice")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
	var resp lessonActionResponse
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if resp.LessonID != "l1" {
		t.Errorf("LessonID : attendu l1, obtenu %q", resp.LessonID)
	}
}

func TestViewBlock_InvalidIndex(t *testing.T) {
	s := buildTestServer(t)

	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/lessons/l1/blocks/not-a-number/view", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", rec.Code)
	}
}

func TestViewBlock_OutOfRange(t *testing.T) {
	s := buildTestServer(t)

	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/lessons/l1/blocks/999/view", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", rec.Code)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   ensureLessonAvailable (unit)
   ═══════════════════════════════════════════════════════════════════════ */

func TestEnsureLessonAvailable_PromotesLocked(t *testing.T) {
	lesson := &domain.Lesson{
		ID: "l-test", ModuleID: "m1", Order: 1, Title: "T",
		DurationMin: 5, Difficulty: 1, XPTotal: 0,
		Blocks: []domain.Block{
			domain.CoverBlock{Title: "C", Objectives: []string{"o"}},
		},
	}
	l := domain.NewLearner("u", "U", "")

	ensureLessonAvailable(l, lesson)

	lp, ok := l.LessonProgress[lesson.ID]
	if !ok {
		t.Fatal("LessonProgress non créé")
	}
	if lp.Status != domain.LessonStatusAvailable {
		t.Errorf("Status : attendu available, obtenu %q", lp.Status)
	}
}

func TestEnsureLessonAvailable_PreservesInProgress(t *testing.T) {
	lesson := &domain.Lesson{
		ID: "l-test", ModuleID: "m1", Order: 1, Title: "T",
		DurationMin: 5, Difficulty: 1, XPTotal: 0,
		Blocks: []domain.Block{
			domain.CoverBlock{Title: "C", Objectives: []string{"o"}},
		},
	}
	l := domain.NewLearner("u", "U", "")
	l.LessonProgress[lesson.ID] = domain.LessonProgress{
		LessonID: lesson.ID,
		Status:   domain.LessonStatusInProgress,
	}

	ensureLessonAvailable(l, lesson)

	lp := l.LessonProgress[lesson.ID]
	if lp.Status != domain.LessonStatusInProgress {
		t.Errorf("Status : attendu in_progress (inchangé), obtenu %q", lp.Status)
	}
}