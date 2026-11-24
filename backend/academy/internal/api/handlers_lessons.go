// backend/academy/internal/api/handlers_lessons.go

package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/leadcortex/academy/internal/domain"
	"github.com/leadcortex/academy/internal/progress"
)


func (s *Server) handleGetLesson(w http.ResponseWriter, r *http.Request) {
	lessonID := chi.URLParam(r, "lessonID")
	if lessonID == "" {
		WriteBadRequest(w, "lesson_id manquant")
		return
	}
	lesson, ok := s.deps.Registry.Lesson(lessonID)
	if !ok {
		WriteNotFound(w, "leçon introuvable")
		return
	}
	WriteJSON(w, http.StatusOK, ToLessonDetailDTO(lesson))
}


type lessonActionResponse struct {
	LessonID     string `json:"lesson_id"`
	Status       string `json:"status"`
	Transitioned bool   `json:"transitioned"`
}

func (s *Server) handleStartLesson(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	lessonID := chi.URLParam(r, "lessonID")
	if lessonID == "" {
		WriteBadRequest(w, "lesson_id manquant")
		return
	}
	lesson, ok := s.deps.Registry.Lesson(lessonID)
	if !ok {
		WriteNotFound(w, "leçon introuvable")
		return
	}

	ensureLessonAvailable(learner, lesson)

	now := s.deps.Clock.Now()
	result, err := s.deps.Engine.Apply(learner, progress.LessonStarted{
		At:        now,
		LearnerID: learnerID,
		LessonID:  lessonID,
	})
	if err != nil {
		WriteError(w, err)
		return
	}

	if err := s.deps.Repository.SaveLearner(r.Context(), learner); err != nil {
		WriteError(w, err)
		return
	}

	WriteJSON(w, http.StatusOK, lessonActionResponse{
		LessonID:     lessonID,
		Status:       string(result.NewStatus),
		Transitioned: result.Transitioned,
	})
}


func (s *Server) handleViewBlock(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	lessonID := chi.URLParam(r, "lessonID")
	if lessonID == "" {
		WriteBadRequest(w, "lesson_id manquant")
		return
	}
	lesson, ok := s.deps.Registry.Lesson(lessonID)
	if !ok {
		WriteNotFound(w, "leçon introuvable")
		return
	}

	blockIndexRaw := chi.URLParam(r, "blockIndex")
	blockIndex, err := strconv.Atoi(blockIndexRaw)
	if err != nil || blockIndex < 0 {
		WriteBadRequest(w, "block_index invalide")
		return
	}
	if blockIndex >= len(lesson.Blocks) {
		WriteBadRequest(w, "block_index hors limites")
		return
	}

	var req ViewBlockRequest
	if r.Body != nil && r.ContentLength != 0 {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			req = ViewBlockRequest{}
		}
	}
	slides := req.SlidesConsumed
	if slides <= 0 {
		slides = 1
	}

	now := s.deps.Clock.Now()
	result, err := s.deps.Engine.Apply(learner, progress.LessonBlockViewed{
		At:             now,
		LearnerID:      learnerID,
		LessonID:       lessonID,
		BlockIndex:     blockIndex,
		SlidesConsumed: slides,
	})
	if err != nil {
		WriteError(w, err)
		return
	}

	if err := s.deps.Repository.SaveLearner(r.Context(), learner); err != nil {
		WriteError(w, err)
		return
	}

	WriteJSON(w, http.StatusOK, lessonActionResponse{
		LessonID:     lessonID,
		Status:       string(result.NewStatus),
		Transitioned: result.Transitioned,
	})
}


func ensureLessonAvailable(learner *domain.Learner, lesson *domain.Lesson) {
	p, exists := learner.LessonProgress[lesson.ID]
	if !exists {
		p = domain.NewLessonProgress(lesson)
	}
	if p.Status == domain.LessonStatusLocked {
		p.Status = domain.LessonStatusAvailable
	}
	learner.LessonProgress[lesson.ID] = p
}