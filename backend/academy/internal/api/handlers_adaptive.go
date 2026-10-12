package api

import (
	"encoding/json"
	"net/http"

	"github.com/leadcortex/academy/internal/adaptivity"
	"github.com/leadcortex/academy/internal/domain"
)

/* ═══════════════════════════════════════════════════════════════════════
   GET /api/v1/me/recommendation
   ═══════════════════════════════════════════════════════════════════════ */

// handleRecommendation retourne l'action prioritaire que l'UI doit
// mettre en avant pour ce Learner.
//
// Le calcul est PUR : adaptivity.Recommend analyse le Learner + le
// registry + les cartes SRS et retourne une seule recommandation
// (reprendre une leçon, réviser un concept, démarrer une nouvelle leçon,
// ou aucune action).
func (s *Server) handleRecommendation(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	// Les cartes SRS ne sont pas critiques : si la lecture échoue, on
	// continue avec une liste vide.
	cards, _ := s.deps.Repository.GetSrsCards(r.Context(), learnerID)

	rec := adaptivity.Recommend(learner, adaptivity.RecommendOptions{
		Registry: s.deps.Registry,
		SrsCards: cards,
		Now:      s.deps.Clock.Now(),
	})
	WriteJSON(w, http.StatusOK, rec)
}

/* ═══════════════════════════════════════════════════════════════════════
   POST /api/v1/me/plan
   ═══════════════════════════════════════════════════════════════════════ */

// handlePlanSession construit un plan de session pour le mode demandé.
//
// Modes supportés (adaptivity.PlanMode) :
//
//	micro        — 1 objectif (5 min)
//	standard     — 2-3 objectifs (15 min)
//	deep         — séquence complète (30 min)
//	review_only  — uniquement des révisions SRS
//
// Si le corps est vide ou si `mode` est absent, le mode "standard" est
// utilisé. Un mode inconnu renvoie 400.
func (s *Server) handlePlanSession(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	// Décodage souple : un corps vide est autorisé.
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

	// Les cartes SRS alimentent les modes qui incluent des révisions.
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

// compile-time guard pour l'import domain (évite un unused).
var _ = domain.LessonStatusLocked