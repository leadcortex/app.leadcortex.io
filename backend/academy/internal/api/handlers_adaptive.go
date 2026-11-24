// backend/academy/internal/api/handlers_adaptive.go

package api

import (
	"encoding/json"
	"net/http"

	"github.com/leadcortex/academy/internal/adaptivity"
	"github.com/leadcortex/academy/internal/domain"
)


func (s *Server) handleRecommendation(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	cards, _ := s.deps.Repository.GetSrsCards(r.Context(), learnerID)

	rec := adaptivity.Recommend(learner, adaptivity.RecommendOptions{
		Registry: s.deps.Registry,
		SrsCards: cards,
		Now:      s.deps.Clock.Now(),
	})
	WriteJSON(w, http.StatusOK, rec)
}


func (s *Server) handlePlanSession(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	var req PlanSessionRequest
	if r.Body != nil && r.ContentLength != 0 {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			WriteBadRequest(w, "corps JSON invalide")
			return
		}
	}

	mode := adaptivity.PlanMode(req.Mode)
	if req.Mode == "" {
		mode = adaptivity.PlanStandard
	}
	if !mode.IsKnown() {
		WriteBadRequest(w, "mode de plan invalide : "+string(req.Mode))
		return
	}

	cards, _ := s.deps.Repository.GetSrsCards(r.Context(), learnerID)

	plan, err := adaptivity.PlanSession(learner, mode, adaptivity.PlanOptions{
		Registry: s.deps.Registry,
		SrsCards: cards,
		Now:      s.deps.Clock.Now(),
	})
	if err != nil {
		WriteError(w, err)
		return
	}
	WriteJSON(w, http.StatusOK, plan)
}

var _ = domain.LessonStatusLocked