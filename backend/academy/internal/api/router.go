package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

// buildRouter construit le routeur HTTP complet.
//
// Toutes les routes sont branchées (plus aucun stub 501).
//
//	/healthz   /readyz   /version   (publiques)
//
//	/api/v1
//	├── /curriculum                snapshot complet (nouveau)
//	├── /me                        profil
//	├── /me/snapshot               vue agrégée
//	├── /me/equip-avatar           PATCH
//	├── /me/recommendation         adaptatif
//	├── /me/plan                   POST
//	├── /programs                  liste
//	├── /programs/{id}             détail
//	├── /lessons/{id}              détail + blocs
//	├── /lessons/{id}/start        POST
//	├── /lessons/{id}/blocks/{i}/view   POST
//	├── /lessons/{id}/exercises/{eid}/answer  POST
//	├── /missions                  liste
//	├── /missions/{id}/attempt     POST
//	├── /events                    POST (ingère un business event)
//	├── /events/stream             GET  (SSE)
//	├── /srs/queue                 file de révision
//	├── /srs/cards/{id}/review     POST
//	├── /srs/stats                 stats agrégées
//	├── /srs/forecast              prévision de charge
//	├── /avatars                   galerie
//	├── /avatars/equip             POST (alias de PATCH /me/equip-avatar)
//	├── /quests                    quêtes du jour
//	└── /quests/{id}/claim         POST
func (s *Server) buildRouter() http.Handler {
	r := chi.NewRouter()

	// ─── Middlewares globaux ─────────────────────────────────────────
	r.Use(WithRecoveryMiddleware(s.log))
	r.Use(WithRequestIDMiddleware)
	r.Use(WithLoggingMiddleware(s.log))
	r.Use(WithCORSMiddleware(s.cfg.CORSOrigins))

	// ─── Routes de santé ─────────────────────────────────────────────
	r.Get("/healthz", s.handleHealthz)
	r.Get("/readyz", s.handleReadyz)
	r.Get("/version", s.handleVersion)

	// ─── Routes métier ──────────────────────────────────────────────
	r.Route("/api/v1", func(r chi.Router) {
		r.Use(WithLearnerMiddleware(MiddlewareConfig{
			Logger:           s.log,
			CORSOrigins:      s.cfg.CORSOrigins,
			AllowDevFallback: s.cfg.AllowDevFallback,
			DefaultLearnerID: s.cfg.DefaultLearnerID,
		}))

		// ── Curriculum (snapshot complet) ────────────────────────────
		r.Get("/curriculum", s.handleGetCurriculum)

		// ── Profil ───────────────────────────────────────────────────
		r.Get("/me", s.handleGetMe)
		r.Get("/me/snapshot", s.handleGetSnapshot)
		r.Patch("/me/equip-avatar", s.handleEquipAvatar)
		r.Get("/me/recommendation", s.handleRecommendation)
		r.Post("/me/plan", s.handlePlanSession)

		// ── Curriculum (unités) ──────────────────────────────────────
		r.Get("/programs", s.handleListPrograms)
		r.Get("/programs/{programID}", s.handleGetProgram)
		r.Get("/lessons/{lessonID}", s.handleGetLesson)
		r.Post("/lessons/{lessonID}/start", s.handleStartLesson)
		r.Post("/lessons/{lessonID}/blocks/{blockIndex}/view", s.handleViewBlock)
		r.Post("/lessons/{lessonID}/exercises/{exerciseID}/answer",
			s.handleAnswerExercise)

		// ── Missions ─────────────────────────────────────────────────
		r.Get("/missions", s.handleListMissions)
		r.Post("/missions/{missionID}/attempt", s.handleAttemptMission)

		// ── Événements ───────────────────────────────────────────────
		r.Post("/events", s.handlePublishEvent)
		r.Get("/events/stream", s.handleSSE)

		// ── SRS ──────────────────────────────────────────────────────
		r.Get("/srs/queue", s.handleSrsQueue)
		r.Post("/srs/cards/{cardID}/review", s.handleSrsReview)
		r.Get("/srs/stats", s.handleSrsStats)
		r.Get("/srs/forecast", s.handleSrsForecast)

		// ── Avatars ──────────────────────────────────────────────────
		r.Get("/avatars", s.handleListAvatars)
		r.Post("/avatars/equip", s.handleEquipAvatarByPath)

		// ── Quêtes ───────────────────────────────────────────────────
		r.Get("/quests", s.handleGetQuests)
		r.Post("/quests/{questID}/claim", s.handleClaimQuest)
	})

	// ─── 404 / 405 JSON ──────────────────────────────────────────────
	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		WriteNotFound(w, "route introuvable")
	})
	r.MethodNotAllowed(func(w http.ResponseWriter, r *http.Request) {
		WriteBadRequest(w, "méthode non autorisée")
	})

	return r
}