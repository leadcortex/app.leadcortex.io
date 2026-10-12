package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/leadcortex/academy/internal/gamification"
)

/* ═══════════════════════════════════════════════════════════════════════
   DTO LOCAL
   ═══════════════════════════════════════════════════════════════════════ */

// QuestClaimResponse — réponse de POST /quests/{id}/claim.
type QuestClaimResponse struct {
	QuestID   string                             `json:"quest_id"`
	XPAwarded int                                `json:"xp_awarded"`
	Summary   gamification.QuestStatusForLearner `json:"summary"`
}

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

// getOrCreateQuests retourne les quêtes du jour, en les générant si
// nécessaire. La génération est déterministe : deux appels le même jour
// produisent les mêmes 3 quêtes.
func (s *Server) getOrCreateQuests(
	r *http.Request,
	learnerID string,
) ([]gamification.Quest, error) {
	now := s.deps.Clock.Now()
	quests, err := s.deps.Repository.GetQuests(r.Context(), learnerID, now)
	if err != nil {
		return nil, err
	}
	if len(quests) > 0 {
		return quests, nil
	}
	quests = gamification.GenerateDailyQuests(now)
	if err := s.deps.Repository.SaveQuests(r.Context(), learnerID, now, quests); err != nil {
		return nil, err
	}
	return quests, nil
}

// progressQuests applique une série d'incréments aux quêtes du jour.
//
// Utilisé par les handlers qui génèrent de la progression :
//   - handleAnswerExercise (XP, Exercises, Lessons)
//   - handleAttemptMission (Missions, XP, Lessons)
//   - handlePublishEvent   (Missions, XP)
//
// Ne retourne jamais d'erreur bloquante pour l'appelant : en cas d'échec,
// les quêtes ne progressent pas mais le handler continue sa réponse.
func (s *Server) progressQuests(
	r *http.Request,
	learnerID string,
	updates ...gamification.QuestUpdate,
) error {
	if len(updates) == 0 {
		return nil
	}
	quests, err := s.getOrCreateQuests(r, learnerID)
	if err != nil {
		return err
	}
	for _, u := range updates {
		if u.Amount <= 0 {
			continue
		}
		quests, _ = gamification.ApplyQuestUpdate(quests, u)
	}
	return s.deps.Repository.SaveQuests(
		r.Context(), learnerID, s.deps.Clock.Now(), quests,
	)
}

/* ═══════════════════════════════════════════════════════════════════════
   GET /api/v1/quests
   ═══════════════════════════════════════════════════════════════════════ */

// handleGetQuests retourne les 3 quêtes du jour pour ce Learner.
//
// Les quêtes sont générées à la volée au premier appel d'une journée,
// puis réutilisées telles quelles jusqu'à minuit UTC.
func (s *Server) handleGetQuests(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	if _, err := s.getOrCreateLearner(r, learnerID); err != nil {
		WriteError(w, err)
		return
	}

	quests, err := s.getOrCreateQuests(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	WriteJSON(w, http.StatusOK,
		gamification.SummarizeQuests(quests, s.deps.Clock.Now()))
}

/* ═══════════════════════════════════════════════════════════════════════
   POST /api/v1/quests/{questID}/claim
   ═══════════════════════════════════════════════════════════════════════ */

// handleClaimQuest réclame la récompense d'une quête complétée.
//
// Erreurs :
//   - 404 si la quête n'existe pas dans la liste du jour.
//   - 409 si la quête est déjà réclamée.
//   - 400 si la quête n'est pas encore complétée.
//
// En cas de succès, l'XP est créditée au Learner et persistée.
func (s *Server) handleClaimQuest(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	questID := chi.URLParam(r, "questID")
	if questID == "" {
		WriteBadRequest(w, "quest_id manquant")
		return
	}

	quests, err := s.getOrCreateQuests(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	updated, reward, err := gamification.ClaimQuest(quests, questID)
	if err != nil {
		WriteError(w, err)
		return
	}

	// Crédite l'XP au Learner.
	if reward > 0 {
		learner.AddXP(reward)
		if err := s.deps.Repository.SaveLearner(r.Context(), learner); err != nil {
			WriteError(w, err)
			return
		}
	}

	// Persiste les quêtes mises à jour.
	if err := s.deps.Repository.SaveQuests(
		r.Context(), learnerID, s.deps.Clock.Now(), updated,
	); err != nil {
		WriteError(w, err)
		return
	}

	WriteJSON(w, http.StatusOK, QuestClaimResponse{
		QuestID:   questID,
		XPAwarded: reward,
		Summary:   gamification.SummarizeQuests(updated, s.deps.Clock.Now()),
	})
}