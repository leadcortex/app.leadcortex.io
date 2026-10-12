package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/leadcortex/academy/internal/domain"
	"github.com/leadcortex/academy/internal/gamification"
	"github.com/leadcortex/academy/internal/missions"
	"github.com/leadcortex/academy/internal/progress"
)

/* ═══════════════════════════════════════════════════════════════════════
   DTOs
   ═══════════════════════════════════════════════════════════════════════ */

type MissionWithStatusDTO struct {
	MissionDTO
	Status   string `json:"status"`
	Attempts int    `json:"attempts"`
}

type MissionListResponse struct {
	Missions  []MissionWithStatusDTO `json:"missions"`
	Total     int                    `json:"total"`
	Pending   int                    `json:"pending"`
	Completed int                    `json:"completed"`
}

type MissionAttemptResponse struct {
	MissionID  string `json:"mission_id"`
	Validated  bool   `json:"validated"`
	Status     string `json:"status"`
	XPAwarded  int    `json:"xp_awarded"`
	FeedbackMD string `json:"feedback_md,omitempty"`
	HintMD     string `json:"hint_md,omitempty"`
	Reason     string `json:"reason,omitempty"`
}

/* ═══════════════════════════════════════════════════════════════════════
   GET /api/v1/missions
   ═══════════════════════════════════════════════════════════════════════ */

func (s *Server) handleListMissions(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	type missionEntry struct {
		mission  domain.Mission
		lessonID string
	}
	var entries []missionEntry

	if s.deps.Orchestrator != nil {
		for _, vm := range s.deps.Orchestrator.AllMissions() {
			entries = append(entries, missionEntry{mission: vm.Mission, lessonID: vm.LessonID})
		}
	} else {
		for _, lesson := range s.deps.Registry.AllLessons() {
			for _, b := range lesson.Blocks {
				mb, ok := b.(domain.MissionBlock)
				if !ok {
					continue
				}
				entries = append(entries, missionEntry{mission: mb.Mission, lessonID: lesson.ID})
			}
		}
	}

	resp := MissionListResponse{
		Missions: make([]MissionWithStatusDTO, 0, len(entries)),
	}
	for _, e := range entries {
		dto := MissionWithStatusDTO{
			MissionDTO: ToMissionDTO(e.mission),
			Status:     string(missionStatus(learner, e.mission.ID, e.lessonID)),
		}
		if mp, ok := learner.MissionProgress[e.mission.ID]; ok {
			dto.Attempts = mp.Attempts
		}
		resp.Missions = append(resp.Missions, dto)
	}
	resp.Total = len(resp.Missions)
	for _, m := range resp.Missions {
		switch m.Status {
		case string(domain.MissionStatusCompleted):
			resp.Completed++
		case string(domain.MissionStatusLocked):
			// rien
		default:
			resp.Pending++
		}
	}

	WriteJSON(w, http.StatusOK, resp)
}

/* ═══════════════════════════════════════════════════════════════════════
   POST /api/v1/missions/{missionID}/attempt
   ═══════════════════════════════════════════════════════════════════════ */

func (s *Server) handleAttemptMission(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	missionID := chi.URLParam(r, "missionID")
	if missionID == "" {
		WriteBadRequest(w, "mission_id manquant")
		return
	}

	mission, lessonID, ok := findMissionByID(s, missionID)
	if !ok {
		WriteNotFound(w, "mission introuvable")
		return
	}

	if mission.Validation.Trigger == "" {
		WriteBadRequest(w,
			"cette mission n'a pas de trigger événementiel (validation par état uniquement)")
		return
	}

	if _, exists := learner.LessonProgress[lessonID]; !exists {
		WriteBadRequest(w, "leçon non démarrée — démarrez-la avant de tenter la mission")
		return
	}

	var req MissionAttemptRequest
	if r.Body != nil && r.ContentLength != 0 {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			WriteBadRequest(w, "corps JSON invalide")
			return
		}
	}
	if req.Payload == nil {
		req.Payload = map[string]any{}
	}

	event := missions.NewEvent(
		mission.Validation.Trigger,
		s.deps.Clock.Now(),
		req.Payload,
	)

	validated, err := missions.ValidateMission(&mission, learner, event)
	if err != nil {
		WriteError(w, err)
		return
	}

	resp := MissionAttemptResponse{
		MissionID: missionID,
		Validated: validated,
	}

	if !validated {
		resp.Status = string(missionStatus(learner, missionID, lessonID))
		resp.FeedbackMD = mission.OnFailure.FeedbackMD
		resp.HintMD = mission.OnFailure.HintMD
		resp.Reason = "conditions non satisfaites"
		WriteJSON(w, http.StatusOK, resp)
		return
	}

	blockIndex, ok := findMissionBlockIndex(lessonID, missionID, s)
	if !ok {
		WriteInternal(w, "mission introuvable dans les blocs de sa leçon")
		return
	}

	now := s.deps.Clock.Now()
	result, err := s.deps.Engine.Apply(learner, progress.MissionSucceeded{
		At:         now,
		LearnerID:  learnerID,
		LessonID:   lessonID,
		BlockIndex: blockIndex,
		MissionID:  missionID,
		XPAwarded:  mission.OnSuccess.XP,
	})
	if err != nil {
		WriteError(w, err)
		return
	}

	if err := s.deps.Repository.SaveLearner(r.Context(), learner); err != nil {
		WriteError(w, err)
		return
	}

	// ─── Progression des quêtes ──────────────────────────────────────
	var questUpdates []gamification.QuestUpdate
	questUpdates = append(questUpdates, gamification.QuestUpdate{
		Kind:   gamification.QuestMissions,
		Amount: 1,
	})
	if mission.OnSuccess.XP > 0 {
		questUpdates = append(questUpdates, gamification.QuestUpdate{
			Kind:   gamification.QuestXP,
			Amount: mission.OnSuccess.XP,
		})
	}
	if result.Transitioned && result.NewStatus == domain.LessonStatusCompleted {
		questUpdates = append(questUpdates, gamification.QuestUpdate{
			Kind:   gamification.QuestLessons,
			Amount: 1,
		})
	}
	if err := s.progressQuests(r, learnerID, questUpdates...); err != nil {
		s.log.Warn().Err(err).Str("learner_id", learnerID).
			Msg("progressQuests (mission) a échoué")
	}

	if s.deps.Bus != nil {
		_ = s.deps.Bus.Publish(event)
	}

	resp.Status = string(missionStatus(learner, missionID, lessonID))
	resp.XPAwarded = mission.OnSuccess.XP
	WriteJSON(w, http.StatusOK, resp)
}

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

func findMissionByID(s *Server, missionID string) (domain.Mission, string, bool) {
	if s.deps.Orchestrator != nil {
		for _, vm := range s.deps.Orchestrator.AllMissions() {
			if vm.Mission.ID == missionID {
				return vm.Mission, vm.LessonID, true
			}
		}
		return domain.Mission{}, "", false
	}
	for _, lesson := range s.deps.Registry.AllLessons() {
		for _, b := range lesson.Blocks {
			mb, ok := b.(domain.MissionBlock)
			if !ok {
				continue
			}
			if mb.Mission.ID == missionID {
				return mb.Mission, lesson.ID, true
			}
		}
	}
	return domain.Mission{}, "", false
}

func findMissionBlockIndex(lessonID, missionID string, s *Server) (int, bool) {
	lesson, ok := s.deps.Registry.Lesson(lessonID)
	if !ok {
		return 0, false
	}
	for i, b := range lesson.Blocks {
		mb, ok := b.(domain.MissionBlock)
		if !ok {
			continue
		}
		if mb.Mission.ID == missionID {
			return i, true
		}
	}
	return 0, false
}

func missionStatus(
	learner *domain.Learner,
	missionID, lessonID string,
) domain.MissionStatus {
	if mp, ok := learner.MissionProgress[missionID]; ok && mp.Status != "" {
		return mp.Status
	}
	lp, ok := learner.LessonProgress[lessonID]
	if !ok || lp.Status == domain.LessonStatusLocked {
		return domain.MissionStatusLocked
	}
	if lp.Status == domain.LessonStatusAvailable {
		return domain.MissionStatusAvailable
	}
	return domain.MissionStatusInProgress
}