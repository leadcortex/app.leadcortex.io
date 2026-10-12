package api

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/rs/zerolog"

	"github.com/leadcortex/academy/internal/assessment"
	"github.com/leadcortex/academy/internal/avatars"
	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
	"github.com/leadcortex/academy/internal/missions"
	"github.com/leadcortex/academy/internal/progress"
	"github.com/leadcortex/academy/internal/repository"
)

/* ─── Fixtures ────────────────────────────────────────────────────────── */

// buildTestRegistry construit un registre de test avec :
//   - 1 programme (p1)
//   - 1 module (m1)
//   - 1 leçon (l1) contenant 4 blocs (cover, practice, mission, debrief)
//   - 2 SrsTemplates (c1, c2) pour tester le SRS en Vague 7
//
// Enrichi progressivement au fil des vagues (V5 : practice + mission,
// V7 : SrsTemplates).
func buildTestRegistry(t *testing.T) *curriculum.Registry {
	t.Helper()

	lesson := domain.Lesson{
		ID: "l1", ModuleID: "m1", Order: 1, Title: "L1", Slug: "l1",
		DurationMin: 5, Difficulty: 1, XPTotal: 100,
		Concepts: []string{"c1", "c2"},
		SrsTemplates: []domain.SrsCardTemplate{
			{ConceptID: "c1", Front: "Q1 ?", Back: "A1"},
			{ConceptID: "c2", Front: "Q2 ?", Back: "A2"},
		},
		Blocks: []domain.Block{
			domain.CoverBlock{Title: "C", Objectives: []string{"o"}},

			domain.PracticeBlock{
				Exercises: []domain.Exercise{
					{
						ID: "ex1", Kind: domain.ExerciseMCQ, Prompt: "?",
						XP: 10, Difficulty: 1, Concepts: []string{"c1"},
						ExplanationMD: "Bonne réponse.",
						Payload: domain.MCqPayload{
							Options: []string{"A", "B"},
							Correct: 1,
						},
					},
					{
						ID: "ex2", Kind: domain.ExerciseFillBlank, Prompt: "?",
						XP: 15, Difficulty: 1, Concepts: []string{"c1"},
						Payload: domain.FillBlankPayload{Blanks: []domain.Blank{
							{Correct: []string{"bonjour"}},
						}},
					},
				},
			},

			domain.MissionBlock{
				Mission: domain.Mission{
					ID: "mission-1", LessonID: "l1", Title: "M", BriefMD: "b",
					Target: domain.MissionTarget{Route: "/app/x", CTA: "Go"},
					Validation: domain.MissionValidation{
						Trigger:    "test.event",
						Conditions: domain.ConditionGroup{},
					},
					OnSuccess: domain.MissionOnSuccess{XP: 50},
					OnFailure: domain.MissionOnFailure{FeedbackMD: "ko"},
				},
			},

			domain.DebriefBlock{
				Sections: []domain.DebriefSection{domain.DebriefScoreBreakdown},
			},
		},
	}

	program := &domain.Program{
		ID: "p1", Order: 1, Title: "P1", Difficulty: 1,
		Modules: []domain.Module{
			{ID: "m1", ProgramID: "p1", Order: 1, Title: "M1",
				Lessons: []domain.Lesson{lesson}},
		},
	}

	return curriculum.NewRegistry([]*domain.Program{program}, nil, nil)
}

// buildTestServer assemble un Server de test avec toutes les deps.
func buildTestServer(t *testing.T) *Server {
	t.Helper()

	registry := buildTestRegistry(t)
	resolver := curriculum.NewResolver(registry)
	repo := repository.NewMemory()

	engine := progress.NewEngine(registry, resolver, nil)
	evaluator := assessment.NewEvaluator(assessment.DefaultPassingScore)
	bus := missions.NewEventBus()

	// Avatars service : alimente GET /avatars et ApplyAndUnlock.
	avatarSvc := avatars.NewService(registry)

	cfg := DefaultServerConfig()
	cfg.Addr = ":0"
	cfg.AllowDevFallback = true

	deps := Dependencies{
		Logger:     zerolog.Nop(),
		Registry:   registry,
		Resolver:   resolver,
		Repository: repo,
		Engine:     engine,
		Evaluator:  evaluator,
		Bus:        bus,
		Avatars:    avatarSvc,
	}

	s, err := NewServer(cfg, deps)
	if err != nil {
		t.Fatalf("NewServer : %v", err)
	}
	return s
}

/* ─── NewServer ───────────────────────────────────────────────────────── */

func TestNewServer_NilRegistry(t *testing.T) {
	cfg := DefaultServerConfig()
	_, err := NewServer(cfg, Dependencies{
		Logger:     zerolog.Nop(),
		Repository: repository.NewMemory(),
		Engine:     progress.NewEngine(nil, nil, nil),
	})
	if err == nil {
		t.Fatal("attendu : erreur Registry manquant")
	}
}

func TestNewServer_NilRepository(t *testing.T) {
	reg := buildTestRegistry(t)
	cfg := DefaultServerConfig()
	_, err := NewServer(cfg, Dependencies{
		Logger:   zerolog.Nop(),
		Registry: reg,
		Engine:   progress.NewEngine(reg, nil, nil),
	})
	if err == nil {
		t.Fatal("attendu : erreur Repository manquant")
	}
}

func TestNewServer_NilEngine(t *testing.T) {
	reg := buildTestRegistry(t)
	cfg := DefaultServerConfig()
	_, err := NewServer(cfg, Dependencies{
		Logger:     zerolog.Nop(),
		Registry:   reg,
		Repository: repository.NewMemory(),
	})
	if err == nil {
		t.Fatal("attendu : erreur Engine manquant")
	}
}

func TestNewServer_InvalidAddr(t *testing.T) {
	reg := buildTestRegistry(t)
	cfg := DefaultServerConfig()
	cfg.Addr = ""
	_, err := NewServer(cfg, Dependencies{
		Logger:     zerolog.Nop(),
		Registry:   reg,
		Repository: repository.NewMemory(),
		Engine:     progress.NewEngine(reg, nil, nil),
	})
	if err == nil {
		t.Fatal("attendu : erreur config")
	}
}

func TestNewServer_OK(t *testing.T) {
	s := buildTestServer(t)
	if s.Router() == nil {
		t.Error("Router ne devrait pas être nil")
	}
	if s.Hub() == nil {
		t.Error("Hub ne devrait pas être nil")
	}
}

/* ─── /healthz ────────────────────────────────────────────────────────── */

func TestHealthz(t *testing.T) {
	s := buildTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var body map[string]any
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if body["status"] != "ok" {
		t.Errorf("status : attendu ok, obtenu %v", body["status"])
	}
}

/* ─── /readyz ─────────────────────────────────────────────────────────── */

func TestReadyz_Ready(t *testing.T) {
	s := buildTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var body map[string]any
	_ = json.NewDecoder(rec.Body).Decode(&body)
	if body["status"] != "ready" {
		t.Errorf("status : attendu ready, obtenu %v", body["status"])
	}
}

func TestReadyz_RepositoryClosed(t *testing.T) {
	s := buildTestServer(t)
	_ = s.deps.Repository.Close()

	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("attendu 503, obtenu %d", rec.Code)
	}
}

/* ─── /version ────────────────────────────────────────────────────────── */

func TestVersion(t *testing.T) {
	s := buildTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/version", nil)
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var body map[string]any
	_ = json.NewDecoder(rec.Body).Decode(&body)
	if _, ok := body["go_version"]; !ok {
		t.Error("go_version devrait être présent")
	}
}

/* ─── 404 JSON ────────────────────────────────────────────────────────── */

func TestNotFoundJSON(t *testing.T) {
	s := buildTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/inconnu", nil)
	req.Header.Set("X-Learner-ID", "u1")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("attendu 404, obtenu %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); !strings.Contains(ct, "application/json") {
		t.Errorf("Content-Type : attendu JSON, obtenu %q", ct)
	}
	var body apiError
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if body.Error != CodeNotFound {
		t.Errorf("code : attendu %q, obtenu %q", CodeNotFound, body.Error)
	}
}

/* ─── Middleware learner sur /api/v1 ──────────────────────────────────── */

func TestAPIv1_RequiresLearner(t *testing.T) {
	s := buildTestServer(t)
	s.cfg.AllowDevFallback = false
	s.handler = s.buildRouter()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("attendu 401, obtenu %d", rec.Code)
	}
}

func TestAPIv1_DevFallbackWorks(t *testing.T) {
	s := buildTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("attendu 200 (fallback dev crée le learner 'default'), obtenu %d", rec.Code)
	}
}

/* ─── Run : démarrage / arrêt ─────────────────────────────────────────── */

func TestServer_RunShutdown(t *testing.T) {
	s := buildTestServer(t)
	s.cfg.Addr = "127.0.0.1:0"
	ctx, cancel := context.WithCancel(context.Background())

	done := make(chan error, 1)
	go func() {
		done <- s.Run(ctx)
	}()

	time.Sleep(50 * time.Millisecond)
	cancel()

	select {
	case err := <-done:
		if err != nil {
			t.Errorf("Run a retourné une erreur : %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("Run n'a pas terminé après cancel")
	}
}