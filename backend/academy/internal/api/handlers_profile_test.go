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
   GET /me
   ═══════════════════════════════════════════════════════════════════════ */

func TestGetMe_CreatesLearnerOnFirstAccess(t *testing.T) {
	s := buildTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}

	var dto LearnerDTO
	if err := json.NewDecoder(rec.Body).Decode(&dto); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if dto.ID != "alice" {
		t.Errorf("ID : attendu alice, obtenu %q", dto.ID)
	}
	if dto.DisplayName != "Alice" {
		t.Errorf("DisplayName : attendu Alice, obtenu %q", dto.DisplayName)
	}
	if dto.Level != 1 {
		t.Errorf("Level : attendu 1, obtenu %d", dto.Level)
	}
	if dto.Hearts != domain.MaxHearts {
		t.Errorf("Hearts : attendu %d, obtenu %d", domain.MaxHearts, dto.Hearts)
	}
	if dto.MaxHearts != domain.MaxHearts {
		t.Errorf("MaxHearts : attendu %d, obtenu %d", domain.MaxHearts, dto.MaxHearts)
	}

	// Vérifier la persistance.
	stored, err := s.deps.Repository.GetLearner(context.Background(), "alice")
	if err != nil {
		t.Fatalf("GetLearner après création : %v", err)
	}
	if stored.DisplayName != "Alice" {
		t.Errorf("DisplayName persisté : attendu Alice, obtenu %q", stored.DisplayName)
	}
}

func TestGetMe_ReturnsExistingLearner(t *testing.T) {
	s := buildTestServer(t)

	// Seed un Learner avec un état non trivial.
	l := domain.NewLearner("bob", "Bob", "bob@example.com")
	l.XP = 500
	l.Level = 3
	l.StreakDays = 5
	l.UnlockAvatar("eagle")
	_ = s.deps.Repository.SaveLearner(context.Background(), l)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	req.Header.Set("X-Learner-ID", "bob")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var dto LearnerDTO
	_ = json.NewDecoder(rec.Body).Decode(&dto)
	if dto.XP != 500 {
		t.Errorf("XP : attendu 500, obtenu %d", dto.XP)
	}
	if dto.Level != 3 {
		t.Errorf("Level : attendu 3, obtenu %d", dto.Level)
	}
	if dto.StreakDays != 5 {
		t.Errorf("StreakDays : attendu 5, obtenu %d", dto.StreakDays)
	}
	if len(dto.UnlockedAvatarIDs) != 1 || dto.UnlockedAvatarIDs[0] != "eagle" {
		t.Errorf("UnlockedAvatarIDs : attendu [eagle], obtenu %v", dto.UnlockedAvatarIDs)
	}
}

func TestGetMe_SecondCallIsIdempotent(t *testing.T) {
	s := buildTestServer(t)

	// Premier appel : crée.
	req1 := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	req1.Header.Set("X-Learner-ID", "carol")
	rec1 := httptest.NewRecorder()
	s.Router().ServeHTTP(rec1, req1)

	// Modifie le Learner en base.
	l, _ := s.deps.Repository.GetLearner(context.Background(), "carol")
	l.XP = 999
	l.Level = 4
	_ = s.deps.Repository.SaveLearner(context.Background(), l)

	// Second appel : doit renvoyer le Learner modifié, PAS un nouveau.
	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	req2.Header.Set("X-Learner-ID", "carol")
	rec2 := httptest.NewRecorder()
	s.Router().ServeHTTP(rec2, req2)

	var dto LearnerDTO
	_ = json.NewDecoder(rec2.Body).Decode(&dto)
	if dto.XP != 999 {
		t.Errorf("XP : attendu 999 (pas de recréation), obtenu %d", dto.XP)
	}
}

func TestGetMe_DevFallbackUsesDefault(t *testing.T) {
	s := buildTestServer(t)

	// Pas de header X-Learner-ID, AllowDevFallback = true.
	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var dto LearnerDTO
	_ = json.NewDecoder(rec.Body).Decode(&dto)
	if dto.ID != "default" {
		t.Errorf("ID : attendu default, obtenu %q", dto.ID)
	}
}

func TestGetMe_RequiresLearnerWhenNoFallback(t *testing.T) {
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

/* ═══════════════════════════════════════════════════════════════════════
   GET /me/snapshot
   ═══════════════════════════════════════════════════════════════════════ */

func TestGetSnapshot_ReturnsValidSnapshot(t *testing.T) {
	s := buildTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/me/snapshot", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}

	var snap map[string]any
	if err := json.NewDecoder(rec.Body).Decode(&snap); err != nil {
		t.Fatalf("decode : %v", err)
	}

	if snap["learner_id"] != "alice" {
		t.Errorf("learner_id : attendu alice, obtenu %v", snap["learner_id"])
	}
	if _, ok := snap["programs"]; !ok {
		t.Error("champ 'programs' attendu")
	}
	if _, ok := snap["recommendation"]; !ok {
		t.Error("champ 'recommendation' attendu")
	}
	if _, ok := snap["xp"]; !ok {
		t.Error("champ 'xp' attendu")
	}
	if _, ok := snap["hearts"]; !ok {
		t.Error("champ 'hearts' attendu")
	}
}

func TestGetSnapshot_IncludesPrograms(t *testing.T) {
	s := buildTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/me/snapshot", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	var snap struct {
		Programs []struct {
			ProgramID    string `json:"program_id"`
			Title        string `json:"title"`
			TotalLessons int    `json:"total_lessons"`
		} `json:"programs"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&snap); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if len(snap.Programs) == 0 {
		t.Fatal("attendu au moins 1 programme dans le snapshot")
	}
	if snap.Programs[0].ProgramID != "p1" {
		t.Errorf("ProgramID : attendu p1, obtenu %q", snap.Programs[0].ProgramID)
	}
	if snap.Programs[0].TotalLessons != 1 {
		t.Errorf("TotalLessons : attendu 1, obtenu %d", snap.Programs[0].TotalLessons)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   PATCH /me/equip-avatar
   ═══════════════════════════════════════════════════════════════════════ */

func TestEquipAvatar_Success(t *testing.T) {
	s := buildTestServer(t)

	// Seed un Learner avec eagle débloqué.
	l := domain.NewLearner("alice", "Alice", "")
	l.UnlockAvatar("eagle")
	_ = s.deps.Repository.SaveLearner(context.Background(), l)

	body := strings.NewReader(`{"avatar_id":"eagle"}`)
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/me/equip-avatar", body)
	req.Header.Set("X-Learner-ID", "alice")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}

	var dto LearnerDTO
	_ = json.NewDecoder(rec.Body).Decode(&dto)
	if dto.EquippedAvatarID != "eagle" {
		t.Errorf("EquippedAvatarID : attendu eagle, obtenu %q", dto.EquippedAvatarID)
	}

	// Vérifier la persistance.
	stored, _ := s.deps.Repository.GetLearner(context.Background(), "alice")
	if stored.EquippedAvatarID != "eagle" {
		t.Errorf("EquippedAvatarID persisté : attendu eagle, obtenu %q", stored.EquippedAvatarID)
	}
}

func TestEquipAvatar_LockedAvatar(t *testing.T) {
	s := buildTestServer(t)

	// Learner fraîchement créé → eagle NON débloqué.
	body := strings.NewReader(`{"avatar_id":"eagle"}`)
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/me/equip-avatar", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Errorf("attendu 403, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
}

func TestEquipAvatar_UnknownAvatar(t *testing.T) {
	s := buildTestServer(t)

	body := strings.NewReader(`{"avatar_id":"does-not-exist"}`)
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/me/equip-avatar", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("attendu 404, obtenu %d (body=%s)", rec.Code, rec.Body.String())
	}
}

func TestEquipAvatar_EmptyAvatarID(t *testing.T) {
	s := buildTestServer(t)

	body := strings.NewReader(`{"avatar_id":""}`)
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/me/equip-avatar", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", rec.Code)
	}
}

func TestEquipAvatar_MissingAvatarID(t *testing.T) {
	s := buildTestServer(t)

	body := strings.NewReader(`{}`)
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/me/equip-avatar", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", rec.Code)
	}
}

func TestEquipAvatar_InvalidJSON(t *testing.T) {
	s := buildTestServer(t)

	body := strings.NewReader(`not-json`)
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/me/equip-avatar", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", rec.Code)
	}
}

func TestEquipAvatar_MethodNotAllowed(t *testing.T) {
	s := buildTestServer(t)

	// GET au lieu de PATCH → 400 (méthode non autorisée, géré par le router).
	req := httptest.NewRequest(http.MethodGet, "/api/v1/me/equip-avatar", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("attendu 400 (méthode non autorisée), obtenu %d", rec.Code)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   Helpers internes (unit tests)
   ═══════════════════════════════════════════════════════════════════════ */

func TestDefaultDisplayName(t *testing.T) {
	cases := []struct {
		in   string
		want string
	}{
		{"alice", "Alice"},
		{"default", "Default"},
		{"Bob", "Bob"},
		{"", "Apprenant"},
	}
	for _, c := range cases {
		t.Run(c.in, func(t *testing.T) {
			if got := defaultDisplayName(c.in); got != c.want {
				t.Errorf("defaultDisplayName(%q) = %q, attendu %q", c.in, got, c.want)
			}
		})
	}
}

func TestContainsString(t *testing.T) {
	xs := []string{"a", "b", "c"}
	if !containsString(xs, "b") {
		t.Error("containsString devrait trouver 'b'")
	}
	if containsString(xs, "z") {
		t.Error("containsString ne devrait pas trouver 'z'")
	}
	if containsString(nil, "a") {
		t.Error("containsString(nil) devrait renvoyer false")
	}
}