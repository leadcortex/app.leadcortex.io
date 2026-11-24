// backend/academy/internal/api/router.go

package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (s *Server) buildRouter() http.Handler {
	r := chi.NewRouter()

	r.Use(WithRecoveryMiddleware(s.log))
	r.Use(WithRequestIDMiddleware)
	r.Use(WithLoggingMiddleware(s.log))
	r.Use(WithCORSMiddleware(s.cfg.CORSOrigins))

	r.Get("/healthz", s.handleHealthz)
	r.Get("/readyz", s.handleReadyz)
	r.Get("/version", s.handleVersion)

	r.Route("/api/v1", func(r chi.Router) {
		r.Use(WithLearnerMiddleware(MiddlewareConfig{
			Logger:           s.log,
			CORSOrigins:      s.cfg.CORSOrigins,
			AllowDevFallback: s.cfg.AllowDevFallback,
			DefaultLearnerID: s.cfg.DefaultLearnerID,
		}))

		r.Get("/curriculum", s.handleGetCurriculum)

		r.Get("/me", s.handleGetMe)
		r.Get("/me/snapshot", s.handleGetSnapshot)
		r.Patch("/me/equip-avatar", s.handleEquipAvatar)
		r.Get("/me/recommendation", s.handleRecommendation)
		r.Post("/me/plan", s.handlePlanSession)

		r.Get("/programs", s.handleListPrograms)
		r.Get("/programs/{programID}", s.handleGetProgram)
		r.Get("/lessons/{lessonID}", s.handleGetLesson)
		r.Post("/lessons/{lessonID}/start", s.handleStartLesson)
		r.Post("/lessons/{lessonID}/blocks/{blockIndex}/view", s.handleViewBlock)
		r.Post("/lessons/{lessonID}/exercises/{exerciseID}/answer",
			s.handleAnswerExercise)

		r.Get("/missions", s.handleListMissions)
		r.Post("/missions/{missionID}/attempt", s.handleAttemptMission)

		r.Post("/events", s.handlePublishEvent)
		r.Get("/events/stream", s.handleSSE)

		r.Get("/srs/queue", s.handleSrsQueue)
		r.Post("/srs/cards/{cardID}/review", s.handleSrsReview)
		r.Get("/srs/stats", s.handleSrsStats)
		r.Get("/srs/forecast", s.handleSrsForecast)

		r.Get("/avatars", s.handleListAvatars)
		r.Post("/avatars/equip", s.handleEquipAvatarByPath)

		r.Get("/quests", s.handleGetQuests)
		r.Post("/quests/{questID}/claim", s.handleClaimQuest)
	})

	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		WriteNotFound(w, "route introuvable")
	})
	r.MethodNotAllowed(func(w http.ResponseWriter, r *http.Request) {
		WriteBadRequest(w, "méthode non autorisée")
	})

	return r
}