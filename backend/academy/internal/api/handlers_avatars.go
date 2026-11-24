// backend/academy/internal/api/handlers_avatars.go

package api

import (
	"net/http"

	"github.com/leadcortex/academy/internal/avatars"
)


func (s *Server) handleListAvatars(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	if s.deps.Avatars != nil {
		now := s.deps.Clock.Now()
		if _, err := s.deps.Avatars.ApplyAndUnlock(learner, now); err == nil {
			if err := s.deps.Repository.SaveLearner(r.Context(), learner); err != nil {
				WriteError(w, err)
				return
			}
		}
	}

	snap := avatars.Snapshot{
		Avatars:    avatars.BuildCatalog(learner),
		EquippedID: learner.EquippedAvatarID,
		Total:      avatars.Count(),
	}
	for _, id := range learner.UnlockedAvatarIDs {
		if _, ok := avatars.Find(id); ok {
			snap.UnlockedIDs = append(snap.UnlockedIDs, id)
		}
	}
	snap.UnlockedCount = len(snap.UnlockedIDs)

	WriteJSON(w, http.StatusOK, snap)
}


func (s *Server) handleEquipAvatarByPath(w http.ResponseWriter, r *http.Request) {
	s.handleEquipAvatar(w, r)
}