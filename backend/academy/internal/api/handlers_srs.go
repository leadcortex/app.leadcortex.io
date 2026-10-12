package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/leadcortex/academy/internal/domain"
	"github.com/leadcortex/academy/internal/srs"
)

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS : synchronisation des cartes SRS
   ═══════════════════════════════════════════════════════════════════════ */

// syncSrsCards parcourt les leçons complétées du Learner, instancie les
// cartes manquantes depuis leurs SrsTemplates, et persiste le résultat.
//
// Idempotent : un second appel ne crée pas de doublons (dédup par ID).
func (s *Server) syncSrsCards(r *http.Request, learner *domain.Learner) error {
	existing, err := s.deps.Repository.GetSrsCards(r.Context(), learner.ID)
	if err != nil {
		return err
	}

	now := s.deps.Clock.Now()
	var incoming []domain.SrsCard

	for _, lesson := range s.deps.Registry.AllLessons() {
		lp, ok := learner.LessonProgress[lesson.ID]
		if !ok || !lp.IsCompleted() {
			continue
		}
		if len(lesson.SrsTemplates) == 0 {
			continue
		}
		cards, err := srs.InstantiateFromLesson(lesson, srs.InstantiateOptions{
			LearnerID: learner.ID,
			LessonID:  lesson.ID,
			Now:       now,
			IDPrefix:  "card",
		})
		if err != nil {
			continue
		}
		incoming = append(incoming, cards...)
	}

	if len(incoming) == 0 {
		return nil
	}

	merged, added := srs.MergeCards(existing, incoming)
	if added == 0 {
		return nil
	}
	return s.deps.Repository.SaveSrsCards(r.Context(), learner.ID, merged)
}

/* ═══════════════════════════════════════════════════════════════════════
   GET /api/v1/srs/queue
   ═══════════════════════════════════════════════════════════════════════ */

func (s *Server) handleSrsQueue(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}
	if err := s.syncSrsCards(r, learner); err != nil {
		WriteError(w, err)
		return
	}

	cards, err := s.deps.Repository.GetSrsCards(r.Context(), learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	max := 20
	if v := r.URL.Query().Get("max"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			max = n
		}
	}
	order := srs.OrderByDue
	switch r.URL.Query().Get("order") {
	case "lapses":
		order = srs.OrderByLapses
	case "ease":
		order = srs.OrderByEase
	}
	var conceptFilter []string
	if c := r.URL.Query().Get("concept"); c != "" {
		conceptFilter = []string{c}
	}

	now := s.deps.Clock.Now()
	due := srs.BuildDueQueue(cards, srs.QueueOptions{
		Now:           now,
		MaxCards:      max,
		ConceptFilter: conceptFilter,
		OrderBy:       order,
	})

	WriteJSON(w, http.StatusOK, map[string]any{
		"cards":        toSrsCardDTOs(due, now),
		"count":        len(due),
		"generated_at": now,
	})
}

/* ═══════════════════════════════════════════════════════════════════════
   POST /api/v1/srs/cards/{cardID}/review
   ═══════════════════════════════════════════════════════════════════════ */

func (s *Server) handleSrsReview(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}
	if err := s.syncSrsCards(r, learner); err != nil {
		WriteError(w, err)
		return
	}

	cardID := chi.URLParam(r, "cardID")
	if cardID == "" {
		WriteBadRequest(w, "card_id manquant")
		return
	}

	var req ReviewCardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteBadRequest(w, "corps JSON invalide")
		return
	}
	button := srs.ReviewButton(req.Button)
	switch button {
	case srs.ButtonAgain, srs.ButtonHard, srs.ButtonGood, srs.ButtonEasy:
	default:
		WriteBadRequest(w, fmt.Sprintf("bouton invalide : %q", req.Button))
		return
	}

	cards, err := s.deps.Repository.GetSrsCards(r.Context(), learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}
	idx := -1
	for i, c := range cards {
		if c.ID == cardID {
			idx = i
			break
		}
	}
	if idx == -1 {
		WriteNotFound(w, "carte introuvable")
		return
	}

	now := s.deps.Clock.Now()
	grade := srs.GradeFromButton(button)
	updated, err := srs.ReviewCard(cards[idx], grade, now)
	if err != nil {
		WriteError(w, err)
		return
	}

	cards[idx] = updated
	if err := s.deps.Repository.SaveSrsCards(r.Context(), learnerID, cards); err != nil {
		WriteError(w, err)
		return
	}

	WriteJSON(w, http.StatusOK, map[string]any{
		"card": toSrsCardDTO(updated, now),
	})
}

/* ═══════════════════════════════════════════════════════════════════════
   GET /api/v1/srs/stats
   ═══════════════════════════════════════════════════════════════════════ */

func (s *Server) handleSrsStats(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}
	if err := s.syncSrsCards(r, learner); err != nil {
		WriteError(w, err)
		return
	}

	cards, err := s.deps.Repository.GetSrsCards(r.Context(), learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	now := s.deps.Clock.Now()
	stats := srs.ComputeStats(cards, now)
	snapshot := srs.BuildQueueSnapshot(cards, now)

	WriteJSON(w, http.StatusOK, map[string]any{
		"stats": stats,
		"queue": snapshot,
	})
}

/* ═══════════════════════════════════════════════════════════════════════
   GET /api/v1/srs/forecast
   ═══════════════════════════════════════════════════════════════════════ */

func (s *Server) handleSrsForecast(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}
	if err := s.syncSrsCards(r, learner); err != nil {
		WriteError(w, err)
		return
	}

	cards, err := s.deps.Repository.GetSrsCards(r.Context(), learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	days := 30
	if v := r.URL.Query().Get("days"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			days = n
		}
	}
	if days > 365 {
		days = 365
	}

	forecast := srs.Forecast(cards, days, s.deps.Clock.Now())
	WriteJSON(w, http.StatusOK, map[string]any{
		"days":     days,
		"forecast": forecast,
	})
}

/* ═══════════════════════════════════════════════════════════════════════
   DTO + MAPPERS
   ═══════════════════════════════════════════════════════════════════════ */

// SrsCardDTO est la vue sérialisable d'une carte SRS.
type SrsCardDTO struct {
	ID             string  `json:"id"`
	ConceptID      string  `json:"concept_id"`
	Front          string  `json:"front"`
	Back           string  `json:"back"`
	EaseFactor     float64 `json:"ease_factor"`
	IntervalDays   int     `json:"interval_days"`
	Repetitions    int     `json:"repetitions"`
	Lapses         int     `json:"lapses"`
	DueAt          string  `json:"due_at"`
	LastReviewedAt string  `json:"last_reviewed_at,omitempty"`
	IsDue          bool    `json:"is_due"`
}

func toSrsCardDTO(c domain.SrsCard, now time.Time) SrsCardDTO {
	dto := SrsCardDTO{
		ID:           c.ID,
		ConceptID:    c.ConceptID,
		Front:        c.Front,
		Back:         c.Back,
		EaseFactor:   c.EaseFactor,
		IntervalDays: c.IntervalDays,
		Repetitions:  c.Repetitions,
		Lapses:       c.Lapses,
		DueAt:        c.DueAt.UTC().Format(time.RFC3339),
		IsDue:        !c.DueAt.After(now),
	}
	if !c.LastReviewedAt.IsZero() {
		dto.LastReviewedAt = c.LastReviewedAt.UTC().Format(time.RFC3339)
	}
	return dto
}

func toSrsCardDTOs(cards []domain.SrsCard, now time.Time) []SrsCardDTO {
	out := make([]SrsCardDTO, len(cards))
	for i, c := range cards {
		out[i] = toSrsCardDTO(c, now)
	}
	return out
}