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
   Helpers
   ═══════════════════════════════════════════════════════════════════════ */

// startLesson aide les tests à démarrer une leçon pour pouvoir ensuite
// répondre à ses exercices.
func startLesson(t *testing.T, s *Server, learnerID, lessonID string) {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/lessons/"+lessonID+"/start", nil)
	req.Header.Set("X-Learner-ID", learnerID)
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("pré-requis : start lesson a échoué (%d) : %s", rec.Code, rec.Body.String())
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   MCQ correct
   ═══════════════════════════════════════════════════════════════════════ */

func TestAnswerExercise_MCQ_Correct(t *testing.T) {
	s := buildTestServer(t)
	startLesson(t, s, "alice", "l1")

	// ex1 : MCQ avec correct = 1.
	body := strings.NewReader(`{"kind":"mcq","selected":1}`)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/lessons/l1/exercises/ex1/answer", body)
	req.Header.Set("X-Learner-ID", "alice")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
	var resp EvaluationResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if resp.Score != 100 {
		t.Errorf("Score : attendu 100, obtenu %d", resp.Score)
	}
	if !resp.Correct {
		t.Error("Correct devrait être true")
	}
	if resp.XPAwarded != 10 {
		t.Errorf("XPAwarded : attendu 10, obtenu %d", resp.XPAwarded)
	}
	if resp.FeedbackMD == "" {
		t.Error("FeedbackMD ne devrait pas être vide")
	}

	// Persistance : XP a été crédité.
	stored, _ := s.deps.Repository.GetLearner(context.Background(), "alice")
	if stored.XP < 10 {
		t.Errorf("XP persisté : attendu >= 10, obtenu %d", stored.XP)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   MCQ incorrect
   ═══════════════════════════════════════════════════════════════════════ */

func TestAnswerExercise_MCQ_Incorrect(t *testing.T) {
	s := buildTestServer(t)
	startLesson(t, s, "alice", "l1")

	body := strings.NewReader(`{"kind":"mcq","selected":0}`) // correct = 1
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/lessons/l1/exercises/ex1/answer", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var resp EvaluationResponse
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if resp.Score != 0 {
		t.Errorf("Score : attendu 0, obtenu %d", resp.Score)
	}
	if resp.Correct {
		t.Error("Correct devrait être false")
	}
	if resp.XPAwarded != 0 {
		t.Errorf("XPAwarded : attendu 0 (échec), obtenu %d", resp.XPAwarded)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   FillBlank
   ═══════════════════════════════════════════════════════════════════════ */

func TestAnswerExercise_FillBlank_Correct(t *testing.T) {
	s := buildTestServer(t)
	startLesson(t, s, "alice", "l1")

	body := strings.NewReader(`{"kind":"fill_blank","blanks":["Bonjour"]}`)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/lessons/l1/exercises/ex2/answer", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
	var resp EvaluationResponse
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if resp.Score != 100 {
		t.Errorf("Score : attendu 100 (accent/casse ignorés), obtenu %d", resp.Score)
	}
	if resp.XPAwarded != 15 {
		t.Errorf("XPAwarded : attendu 15, obtenu %d", resp.XPAwarded)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   Rejouer un exercice déjà réussi ne re-crédite PAS l'XP
   ═══════════════════════════════════════════════════════════════════════ */

func TestAnswerExercise_NoDoubleXP(t *testing.T) {
	s := buildTestServer(t)
	startLesson(t, s, "alice", "l1")

	// Premier appel : réussit → 10 XP.
	body1 := strings.NewReader(`{"kind":"mcq","selected":1}`)
	req1 := httptest.NewRequest(http.MethodPost,
		"/api/v1/lessons/l1/exercises/ex1/answer", body1)
	req1.Header.Set("X-Learner-ID", "alice")
	rec1 := httptest.NewRecorder()
	s.Router().ServeHTTP(rec1, req1)

	// Second appel identique : réussit encore mais sans XP.
	body2 := strings.NewReader(`{"kind":"mcq","selected":1}`)
	req2 := httptest.NewRequest(http.MethodPost,
		"/api/v1/lessons/l1/exercises/ex1/answer", body2)
	req2.Header.Set("X-Learner-ID", "alice")
	rec2 := httptest.NewRecorder()
	s.Router().ServeHTTP(rec2, req2)

	if rec2.Code != http.StatusOK {
		t.Fatalf("second : %d", rec2.Code)
	}
	var resp2 EvaluationResponse
	_ = json.NewDecoder(rec2.Body).Decode(&resp2)
	if resp2.XPAwarded != 0 {
		t.Errorf("second appel : XPAwarded attendu 0, obtenu %d", resp2.XPAwarded)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   Erreurs
   ═══════════════════════════════════════════════════════════════════════ */

func TestAnswerExercise_UnknownExercise(t *testing.T) {
	s := buildTestServer(t)
	startLesson(t, s, "alice", "l1")

	body := strings.NewReader(`{"kind":"mcq","selected":0}`)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/lessons/l1/exercises/unknown/answer", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("attendu 404, obtenu %d", rec.Code)
	}
}

func TestAnswerExercise_UnknownLesson(t *testing.T) {
	s := buildTestServer(t)

	body := strings.NewReader(`{"kind":"mcq","selected":0}`)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/lessons/unknown/exercises/ex1/answer", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("attendu 404, obtenu %d", rec.Code)
	}
}

func TestAnswerExercise_InvalidJSON(t *testing.T) {
	s := buildTestServer(t)
	startLesson(t, s, "alice", "l1")

	body := strings.NewReader(`not-json`)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/lessons/l1/exercises/ex1/answer", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", rec.Code)
	}
}

func TestAnswerExercise_KindMismatch(t *testing.T) {
	s := buildTestServer(t)
	startLesson(t, s, "alice", "l1")

	// ex1 est un MCQ. On envoie kind=fill_blank.
	body := strings.NewReader(`{"kind":"fill_blank","blanks":["a"]}`)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/lessons/l1/exercises/ex1/answer", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", rec.Code)
	}
}

func TestAnswerExercise_RequiresStart(t *testing.T) {
	s := buildTestServer(t)

	// Pas de start → LessonNotStarted → 400.
	body := strings.NewReader(`{"kind":"mcq","selected":1}`)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/lessons/l1/exercises/ex1/answer", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   findExerciseBlock (unit)
   ═══════════════════════════════════════════════════════════════════════ */

func TestFindExerciseBlock(t *testing.T) {
	lesson := &domain.Lesson{
		ID: "l1",
		Blocks: []domain.Block{
			domain.CoverBlock{Title: "C", Objectives: []string{"o"}},
			domain.PracticeBlock{Exercises: []domain.Exercise{
				{ID: "ex-a"},
				{ID: "ex-b"},
			}},
			domain.DebriefBlock{Sections: []domain.DebriefSection{domain.DebriefScoreBreakdown}},
		},
	}
	idx, ex, ok := findExerciseBlock(lesson, "ex-b")
	if !ok {
		t.Fatal("exercice non trouvé")
	}
	if idx != 1 {
		t.Errorf("index : attendu 1, obtenu %d", idx)
	}
	if ex == nil || ex.ID != "ex-b" {
		t.Errorf("exercice : attendu ex-b, obtenu %v", ex)
	}
}

func TestFindExerciseBlock_NotFound(t *testing.T) {
	lesson := &domain.Lesson{
		ID: "l1",
		Blocks: []domain.Block{
			domain.CoverBlock{Title: "C", Objectives: []string{"o"}},
		},
	}
	_, _, ok := findExerciseBlock(lesson, "ex-x")
	if ok {
		t.Error("attendu false pour exercice inconnu")
	}
}