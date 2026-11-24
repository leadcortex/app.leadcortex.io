// backend/academy/internal/api/handlers_quests.go

package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/leadcortex/academy/internal/gamification"
)


type QuestClaimResponse struct {
	QuestID   string                             `json:"quest_id"`
	XPAwarded int                                `json:"xp_awarded"`
	Summary   gamification.QuestStatusForLearner `json:"summary"`
}


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

	if reward > 0 {
		learner.AddXP(reward)
		if err := s.deps.Repository.SaveLearner(r.Context(), learner); err != nil {
			WriteError(w, err)
			return
		}
	}

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