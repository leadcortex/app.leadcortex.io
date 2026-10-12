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

/* ═══════════════════════════════════════════════════════════════════════
   GET /api/v1/me
   ═══════════════════════════════════════════════════════════════════════ */

// handleGetMe retourne le Learner courant.
//
// Si le Learner n'existe pas encore dans le repository (premier appel en
// dev, mono-utilisateur), il est créé à la volée avec un profil par défaut.
// Ce comportement est volontairement permissif en V1 : il sera durci quand
// l'auth 2.0 arrivera (à ce moment, un Learner inconnu renverra 404).
func (s *Server) handleGetMe(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}
	WriteJSON(w, http.StatusOK, ToLearnerDTO(learner))
}

/* ═══════════════════════════════════════════════════════════════════════
   GET /api/v1/me/snapshot
   ═══════════════════════════════════════════════════════════════════════ */

// handleGetSnapshot retourne le progress.Snapshot complet du Learner.
//
// Le snapshot contient :
//   - l'en-tête du Learner (XP, niveau, streak, hearts)
//   - tous les programmes avec leurs modules et leçons
//   - la recommandation courante
//   - la collection (avatars, badges)
//
// C'est l'appel principal pour l'UI Academy : un seul aller-retour HTTP
// suffit pour afficher l'écran d'accueil complet.
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

/* ═══════════════════════════════════════════════════════════════════════
   PATCH /api/v1/me/equip-avatar
   ═══════════════════════════════════════════════════════════════════════ */

// handleEquipAvatar change l'avatar équipé du Learner.
//
// Contraintes :
//   - l'avatar doit exister dans le catalogue (sinon 404)
//   - l'avatar doit être débloqué par le Learner (sinon 403)
//
// Le Learner mis à jour est retourné dans la réponse pour que le client
// dispose immédiatement du nouvel état.
func (s *Server) handleEquipAvatar(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	// Décodage du corps.
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

	// L'avatar existe-t-il ?
	if _, ok := avatars.Find(req.AvatarID); !ok {
		WriteError(w, fmt.Errorf("%w : %s", avatars.ErrUnknownAvatar, req.AvatarID))
		return
	}

	// L'avatar est-il débloqué par le Learner ?
	if !containsString(learner.UnlockedAvatarIDs, req.AvatarID) {
		WriteForbidden(w, "avatar non débloqué")
		return
	}

	// Application + persistance.
	learner.EquippedAvatarID = req.AvatarID
	if err := s.deps.Repository.SaveLearner(r.Context(), learner); err != nil {
		WriteError(w, err)
		return
	}
	WriteJSON(w, http.StatusOK, ToLearnerDTO(learner))
}

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

// getOrCreateLearner retourne le Learner identifié par `learnerID`, ou le
// crée s'il n'existe pas encore dans le repository.
//
// En V1 (mono-utilisateur, pas d'auth), c'est volontairement permissif :
// la première requête HTTP d'un utilisateur crée son profil. À durcir
// quand l'auth 2.0 arrivera (retourner une 401 au lieu de créer).
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

	// Création à la volée.
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

// defaultDisplayName dérive un nom lisible depuis un identifiant brut.
//
//	"alice"           → "Alice"
//	"default"         → "Default"
//	"a@example.com"   → "A@example.com"   (cas non idéal, mais rare en V1)
//	""                → "Apprenant"
func defaultDisplayName(learnerID string) string {
	if learnerID == "" {
		return "Apprenant"
	}
	r := []rune(learnerID)
	r[0] = []rune(strings.ToUpper(string(r[0])))[0]
	return string(r)
}

// containsString — test d'appartenance à une slice de chaînes.
func containsString(xs []string, target string) bool {
	for _, x := range xs {
		if x == target {
			return true
		}
	}
	return false
}