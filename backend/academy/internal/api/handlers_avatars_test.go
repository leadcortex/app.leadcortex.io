package api

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/leadcortex/academy/internal/avatars"
	"github.com/leadcortex/academy/internal/domain"
)

/* ═══════════════════════════════════════════════════════════════════════
   GET /avatars
   ═══════════════════════════════════════════════════════════════════════ */

func TestListAvatars_Returns12(t *testing.T) {
	s := buildTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/avatars", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var snap avatars.Snapshot
	if err := json.NewDecoder(rec.Body).Decode(&snap); err != nil {
		t.Fatalf("decode : %v", err)
	}
	if snap.Total != 12 {
		t.Errorf("Total : attendu 12, obtenu %d", snap.Total)
	}
	if len(snap.Avatars) != 12 {
		t.Errorf("Avatars : attendu 12, obtenu %d", len(snap.Avatars))
	}
	if snap.UnlockedCount != 0 {
		t.Errorf("UnlockedCount : attendu 0 (Learner neuf), obtenu %d", snap.UnlockedCount)
	}
}

func TestListAvatars_UnlocksOnDemand(t *testing.T) {
	s := buildTestServer(t)

	// Seed un Learner avec 5 leçons terminées → panda débloqué (5 leçons).
	l := domain.NewLearner("alice", "Alice", "")
	for i := 0; i < 5; i++ {
		l.LessonProgress["filler-"+string(rune('0'+i))] = domain.LessonProgress{
			LessonID: "filler-" + string(rune('0'+i)),
			Status:   domain.LessonStatusCompleted,
		}
	}
	_ = s.deps.Repository.SaveLearner(context.Background(), l)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/avatars", nil)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", rec.Code)
	}
	var snap avatars.Snapshot
	_ = json.NewDecoder(rec.Body).Decode(&snap)

	hasPanda := false
	for _, id := range snap.UnlockedIDs {
		if id == "panda" {
			hasPanda = true
		}
	}
	if !hasPanda {
		t.Errorf("panda devrait être débloqué (5 leçons), obtenu %v", snap.UnlockedIDs)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   POST /avatars/equip  (alias de PATCH /me/equip-avatar)
   ═══════════════════════════════════════════════════════════════════════ */

func TestEquipAvatarByPath_Success(t *testing.T) {
	s := buildTestServer(t)

	// Seed un Learner avec eagle débloqué.
	l := domain.NewLearner("alice", "Alice", "")
	l.UnlockAvatar("eagle")
	_ = s.deps.Repository.SaveLearner(context.Background(), l)

	body := strings.NewReader(`{"avatar_id":"eagle"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/avatars/equip", body)
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
}

func TestEquipAvatarByPath_Locked(t *testing.T) {
	s := buildTestServer(t)

	body := strings.NewReader(`{"avatar_id":"eagle"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/avatars/equip", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Errorf("attendu 403, obtenu %d", rec.Code)
	}
}

func TestEquipAvatarByPath_Unknown(t *testing.T) {
	s := buildTestServer(t)

	body := strings.NewReader(`{"avatar_id":"nope"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/avatars/equip", body)
	req.Header.Set("X-Learner-ID", "alice")
	rec := httptest.NewRecorder()
	s.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("attendu 404, obtenu %d", rec.Code)
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   Vérifier que les deux endpoints (PATCH /me/equip-avatar et
   POST /avatars/equip) produisent le même état.
   ═══════════════════════════════════════════════════════════════════════ */

func TestEquipAvatar_TwoEndpointsEquivalent(t *testing.T) {
	s := buildTestServer(t)

	l := domain.NewLearner("alice", "Alice", "")
	l.UnlockAvatar("eagle")
	_ = s.deps.Repository.SaveLearner(context.Background(), l)

	// Équipe via /me/equip-avatar.
	body1 := strings.NewReader(`{"avatar_id":"eagle"}`)
	req1 := httptest.NewRequest(http.MethodPatch, "/api/v1/me/equip-avatar", body1)
	req1.Header.Set("X-Learner-ID", "alice")
	rec1 := httptest.NewRecorder()
	s.Router().ServeHTTP(rec1, req1)
	if rec1.Code != http.StatusOK {
		t.Fatalf("PATCH /me/equip-avatar : %d", rec1.Code)
	}

	// Change le Learner : retire eagle.
	stored, _ := s.deps.Repository.GetLearner(context.Background(), "alice")
	stored.EquippedAvatarID = ""
	_ = s.deps.Repository.SaveLearner(context.Background(), stored)

	// Équipe via /avatars/equip.
	body2 := strings.NewReader(`{"avatar_id":"eagle"}`)
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/avatars/equip", body2)
	req2.Header.Set("X-Learner-ID", "alice")
	rec2 := httptest.NewRecorder()
	s.Router().ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusOK {
		t.Fatalf("POST /avatars/equip : %d", rec2.Code)
	}

	// État identique.
	final, _ := s.deps.Repository.GetLearner(context.Background(), "alice")
	if final.EquippedAvatarID != "eagle" {
		t.Errorf("EquippedAvatarID : attendu eagle, obtenu %q", final.EquippedAvatarID)
	}
}