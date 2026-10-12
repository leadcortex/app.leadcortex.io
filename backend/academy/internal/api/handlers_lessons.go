package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/leadcortex/academy/internal/domain"
	"github.com/leadcortex/academy/internal/progress"
)

/* ═══════════════════════════════════════════════════════════════════════
   GET /api/v1/lessons/{lessonID}
   ═══════════════════════════════════════════════════════════════════════ */

// handleGetLesson retourne le détail complet d'une leçon : métadonnées
// + tous ses blocs (cover, theory, practice, mission, debrief).
//
// Les payloads d'exercices exposent les options mais JAMAIS les bonnes
// réponses (voir dto.go — ToExerciseDTO).
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

/* ═══════════════════════════════════════════════════════════════════════
   POST /api/v1/lessons/{lessonID}/start
   ═══════════════════════════════════════════════════════════════════════ */

// lessonActionResponse est la réponse commune à start / view.
type lessonActionResponse struct {
	LessonID     string `json:"lesson_id"`
	Status       string `json:"status"`
	Transitioned bool   `json:"transitioned"`
}

// handleStartLesson démarre (ou reprend) une leçon.
//
// Comportement :
//  1. Charge le Learner (ou le crée).
//  2. Évalue le gate d'accès : si la leçon est verrouillée, réponse 403.
//  3. Promeut le LessonProgress de `locked` à `available` si nécessaire.
//  4. Applique LessonStarted → transition `available` → `in_progress`.
//  5. Persiste le Learner mis à jour.
//
// Idempotent : un second appel sur une leçon déjà `in_progress` ne
// réinitialise PAS la progression (le moteur le gère).
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

	// Promotion préalable (voir note en tête de fichier).
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

/* ═══════════════════════════════════════════════════════════════════════
   POST /api/v1/lessons/{lessonID}/blocks/{blockIndex}/view
   ═══════════════════════════════════════════════════════════════════════ */

// handleViewBlock marque un bloc comme vu (ou incrémente son compteur de
// slides pour un bloc theory).
//
// La leçon doit être `in_progress` : le moteur refuse sinon (400).
//
// Corps (optionnel) :
//
//	{"slides_consumed": 1}
//
// Si `slides_consumed` est omis (0), on considère qu'un slide a été vu —
// ce qui convient à un cover ou à un debrief, et à un slide theory unique.
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

	// Parsing de l'index de bloc.
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

	// Corps optionnel : on tolère un Body vide.
	var req ViewBlockRequest
	if r.Body != nil && r.ContentLength != 0 {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			// Un corps invalide n'est PAS bloquant : on prend les
			// valeurs par défaut. C'est une commande « marquer vu ».
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

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

// ensureLessonAvailable promeut le LessonProgress d'une leçon de `locked`
// à `available` si nécessaire.
//
// Justification : le moteur (progress.Engine) ne fait PAS cette promotion
// automatiquement — il attend un statut `available` ou `in_progress` pour
// accepter un LessonStarted. C'est au caller de matérialiser l'état
// « accessible » une fois le gate franchi.
//
// Le gate reste évalué par Apply (qui retournera UnlockError si les
// prérequis manquent) — cette fonction ne fait AUCUNE vérification, elle
// prépare simplement l'état.
//
// Ne persiste rien. La mutation reste en mémoire tant que l'appelant n'a
// pas appelé SaveLearner.
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