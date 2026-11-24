// backend/academy/internal/api/handlers_profile.go

package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/leadcortex/academy/internal/avatars"
	"github.com/leadcortex/academy/internal/domain"
	"github.com/leadcortex/academy/internal/progress"
	"github.com/leadcortex/academy/internal/repository"
)


func (s *Server) handleGetMe(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}
	WriteJSON(w, http.StatusOK, ToLearnerDTO(learner))
}


func (s *Server) handleGetSnapshot(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}
	snap := progress.BuildSnapshot(s.deps.Registry, s.deps.Engine, learner)
	WriteJSON(w, http.StatusOK, snap)
}


func (s *Server) handleEquipAvatar(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	var req EquipAvatarRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteBadRequest(w, "corps JSON invalide")
		return
	}
	req.AvatarID = strings.TrimSpace(req.AvatarID)
	if req.AvatarID == "" {
		WriteBadRequest(w, "avatar_id obligatoire")
		return
	}

	if _, ok := avatars.Find(req.AvatarID); !ok {
		WriteError(w, fmt.Errorf("%w : %s", avatars.ErrUnknownAvatar, req.AvatarID))
		return
	}

	if !containsString(learner.UnlockedAvatarIDs, req.AvatarID) {
		WriteForbidden(w, "avatar non débloqué")
		return
	}

	learner.EquippedAvatarID = req.AvatarID
	if err := s.deps.Repository.SaveLearner(r.Context(), learner); err != nil {
		WriteError(w, err)
		return
	}
	WriteJSON(w, http.StatusOK, ToLearnerDTO(learner))
}


func (s *Server) getOrCreateLearner(
	r *http.Request,
	learnerID string,
) (*domain.Learner, error) {
	learner, err := s.deps.Repository.GetLearner(r.Context(), learnerID)
	if err == nil {
		return learner, nil
	}
	if !errors.Is(err, repository.ErrNotFound) {
		return nil, err
	}

	newLearner := domain.NewLearner(
		learnerID,
		defaultDisplayName(learnerID),
		"",
	)
	if err := s.deps.Repository.SaveLearner(r.Context(), newLearner); err != nil {
		return nil, err
	}
	return newLearner, nil
}

func defaultDisplayName(learnerID string) string {
	if learnerID == "" {
		return "Apprenant"
	}
	r := []rune(learnerID)
	r[0] = []rune(strings.ToUpper(string(r[0])))[0]
	return string(r)
}

func containsString(xs []string, target string) bool {
	for _, x := range xs {
		if x == target {
			return true
		}
	}
	return false
}