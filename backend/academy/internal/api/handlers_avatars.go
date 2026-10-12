package api

import (
	"net/http"

	"github.com/leadcortex/academy/internal/avatars"
)

/* ═══════════════════════════════════════════════════════════════════════
   GET /api/v1/avatars
   ═══════════════════════════════════════════════════════════════════════ */

// handleListAvatars retourne la galerie complète des 12 avatars, avec :
//   - les métadonnées visuelles (nom, tier, description, gradient)
//   - l'URL de l'asset SVG pour chaque pose
//   - les flags unlocked / equipped pour ce Learner
//
// Avant l'appel, on évalue les déblocages (EvaluateAll + ApplyAndUnlock)
// pour que l'utilisateur voie immédiatement les avatars fraîchement
// débloqués. C'est idempotent.
func (s *Server) handleListAvatars(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	// Déblocage automatique avant l'affichage.
	if s.deps.Avatars != nil {
		now := s.deps.Clock.Now()
		if _, err := s.deps.Avatars.ApplyAndUnlock(learner, now); err == nil {
			// Persiste si un changement a eu lieu.
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

/* ═══════════════════════════════════════════════════════════════════════
   POST /api/v1/avatars/equip
   ═══════════════════════════════════════════════════════════════════════ */

// handleEquipAvatarByPath est un alias de POST /avatars/equip sur
// PATCH /me/equip-avatar. Les deux endpoints ont exactement la même
// sémantique et le même corps JSON.
func (s *Server) handleEquipAvatarByPath(w http.ResponseWriter, r *http.Request) {
	s.handleEquipAvatar(w, r)
}