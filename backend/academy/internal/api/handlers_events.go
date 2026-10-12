package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/leadcortex/academy/internal/gamification"
	"github.com/leadcortex/academy/internal/missions"
	"github.com/leadcortex/academy/internal/progress"
)

/* ═══════════════════════════════════════════════════════════════════════
   DTO
   ═══════════════════════════════════════════════════════════════════════ */

type PublishEventResponse struct {
	Event          string   `json:"event"`
	At             string   `json:"at"`
	ValidatedIDs   []string `json:"validated_missions"`
	XPAwardedTotal int      `json:"xp_awarded_total"`
}

/* ═══════════════════════════════════════════════════════════════════════
   POST /api/v1/events
   ═══════════════════════════════════════════════════════════════════════ */

func (s *Server) handlePublishEvent(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	var req PublishEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteBadRequest(w, "corps JSON invalide")
		return
	}
	if req.Kind == "" {
		WriteBadRequest(w, "kind obligatoire")
		return
	}

	at := s.deps.Clock.Now()
	if req.At != "" {
		parsed, err := time.Parse(time.RFC3339, req.At)
		if err != nil {
			WriteBadRequest(w, "at invalide (RFC3339 attendu)")
			return
		}
		at = parsed
	}
	payload := req.Payload
	if payload == nil {
		payload = map[string]any{}
	}

	event := missions.NewEvent(req.Kind, at, payload)

	if s.deps.Orchestrator == nil {
		WriteUnavailable(w, "orchestrator non configuré")
		return
	}

	validated, err := s.deps.Orchestrator.Process(learner, event)
	if err != nil {
		WriteError(w, err)
		return
	}

	resp := PublishEventResponse{
		Event: req.Kind,
		At:    at.UTC().Format(time.RFC3339),
	}

	for _, vm := range validated {
		blockIndex, ok := findMissionBlockIndex(vm.LessonID, vm.Mission.ID, s)
		if !ok {
			continue
		}
		if _, exists := learner.LessonProgress[vm.LessonID]; !exists {
			continue
		}

		_, err := s.deps.Engine.Apply(learner, progress.MissionSucceeded{
			At:         at,
			LearnerID:  learnerID,
			LessonID:   vm.LessonID,
			BlockIndex: blockIndex,
			MissionID:  vm.Mission.ID,
			XPAwarded:  vm.Mission.OnSuccess.XP,
		})
		if err != nil {
			continue
		}
		resp.ValidatedIDs = append(resp.ValidatedIDs, vm.Mission.ID)
		resp.XPAwardedTotal += vm.Mission.OnSuccess.XP
	}

	if err := s.deps.Repository.SaveLearner(r.Context(), learner); err != nil {
		WriteError(w, err)
		return
	}

	// ─── Progression des quêtes ──────────────────────────────────────
	if len(resp.ValidatedIDs) > 0 {
		var updates []gamification.QuestUpdate
		updates = append(updates, gamification.QuestUpdate{
			Kind:   gamification.QuestMissions,
			Amount: len(resp.ValidatedIDs),
		})
		if resp.XPAwardedTotal > 0 {
			updates = append(updates, gamification.QuestUpdate{
				Kind:   gamification.QuestXP,
				Amount: resp.XPAwardedTotal,
			})
		}
		if err := s.progressQuests(r, learnerID, updates...); err != nil {
			s.log.Warn().Err(err).Str("learner_id", learnerID).
				Msg("progressQuests (events) a échoué")
		}
	}

	if s.deps.Bus != nil {
		_ = s.deps.Bus.Publish(event)
	}

	if resp.ValidatedIDs == nil {
		resp.ValidatedIDs = []string{}
	}
	WriteJSON(w, http.StatusOK, resp)
}