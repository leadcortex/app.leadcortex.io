package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

/* ═══════════════════════════════════════════════════════════════════════
   GET /programs
   ═══════════════════════════════════════════════════════════════════════ */

func TestListPrograms_ReturnsSummary(t *testing.T) {
	s := buildTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/programs", nil)
	req.Header.Set("X-Learner-ID", "u1")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var body struct {
		Programs []ProgramDTO `json:"programs"`
		Total    int          `json:"total"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if body.Total != 1 {
		t.Errorf("Total : attendu 1, obtenu %d", body.Total)
	}
	if len(body.Programs) != 1 {
		t.Fatalf("attendu 1 programme, obtenu %d", len(body.Programs))
	}
	p := body.Programs[0]
	if p.ID != "p1" {
		t.Errorf("ID : attendu p1, obtenu %q", p.ID)
	}
	if p.Title != "P1" {
		t.Errorf("Title : attendu P1, obtenu %q", p.Title)
	}
	if p.TotalLessons != 1 {
		t.Errorf("TotalLessons : attendu 1, obtenu %d", p.TotalLessons)
	}
	// Le résumé ne doit PAS contenir les modules.
	if p.Modules != nil {
		t.Errorf("Modules devrait être nil dans un résumé, obtenu %d", len(p.Modules))
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   GET /programs/{id}
   ═══════════════════════════════════════════════════════════════════════ */

func TestGetProgram_ReturnsFull(t *testing.T) {
	s := buildTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/programs/p1", nil)
	req.Header.Set("X-Learner-ID", "u1")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var dto ProgramDTO
	if err := json.NewDecoder(rec.Body).Decode(&dto); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if dto.ID != "p1" {
		t.Errorf("ID : attendu p1, obtenu %q", dto.ID)
	}
	if len(dto.Modules) != 1 {
		t.Fatalf("attendu 1 module, obtenu %d", len(dto.Modules))
	}
	if dto.Modules[0].ID != "m1" {
		t.Errorf("Module ID : attendu m1, obtenu %q", dto.Modules[0].ID)
	}
	if len(dto.Modules[0].Lessons) != 1 {
		t.Fatalf("attendu 1 leçon, obtenu %d", len(dto.Modules[0].Lessons))
	}
	if dto.Modules[0].Lessons[0].ID != "l1" {
		t.Errorf("Lesson ID : attendu l1, obtenu %q", dto.Modules[0].Lessons[0].ID)
	}
}

func TestGetProgram_NotFound(t *testing.T) {
	s := buildTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/programs/unknown", nil)
	req.Header.Set("X-Learner-ID", "u1")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("attendu 404, obtenu %d", rec.Code)
	}
}