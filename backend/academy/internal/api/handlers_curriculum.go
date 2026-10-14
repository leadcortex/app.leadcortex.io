package api

import (
	"net/http"

	"github.com/leadcortex/academy/internal/domain"
)

/* ═══════════════════════════════════════════════════════════════════════
   DTOs
   ═══════════════════════════════════════════════════════════════════════ */

// CurriculumSnapshotDTO — vue complète du curriculum en un seul call.
//
// Le frontend peut remplacer son import JSON local par un fetch unique
// vers GET /api/v1/curriculum.
type CurriculumSnapshotDTO struct {
	Programs []ProgramSnapshotDTO `json:"programs"`
	Total    int                  `json:"total"`
}

// ProgramSnapshotDTO — un programme avec ses modules et leçons.
type ProgramSnapshotDTO struct {
	ID               string              `json:"id"`
	Order            int                 `json:"order"`
	Title            string              `json:"title"`
	Subtitle         string              `json:"subtitle"`
	Description      string              `json:"description"`
	Icon             string              `json:"icon"`
	Color            string              `json:"color"`
	Difficulty       int                 `json:"difficulty"`
	EstimatedMinutes int                 `json:"estimated_minutes"`
	TotalLessons     int                 `json:"total_lessons"`
	Modules          []ModuleSnapshotDTO `json:"modules"`
}

// ModuleSnapshotDTO — un module avec sa leçon détaillée (blocs inclus).
type ModuleSnapshotDTO struct {
	ID               string            `json:"id"`
	ProgramID        string            `json:"program_id"`
	Order            int               `json:"order"`
	Chapter          int               `json:"chapter"`
	Title            string            `json:"title"`
	Description      string            `json:"description"`
	EstimatedMinutes int               `json:"estimated_minutes"`
	TotalLessons     int               `json:"total_lessons"`
	Lessons          []LessonDetailDTO `json:"lessons"`
}

/* ═══════════════════════════════════════════════════════════════════════
   GET /api/v1/curriculum
   ═══════════════════════════════════════════════════════════════════════ */

// handleGetCurriculum retourne l'intégralité du curriculum en une fois.
//
// Query params :
//   - include_blocks (bool, defaut "true") — inclure les blocs de chaque
//     leçon. Mettre "false" pour ne récupérer que les métadonnées (utile
//     pour afficher un sommaire sans télécharger les contenus).
//
// La réponse peut atteindre ~1-2 Mo avec les blocs, mais elle n'est
// demandée qu'une seule fois au démarrage du frontend.
func (s *Server) handleGetCurriculum(w http.ResponseWriter, r *http.Request) {
	includeBlocks := r.URL.Query().Get("include_blocks") != "false"

	programs := s.deps.Registry.AllPrograms()
	out := make([]ProgramSnapshotDTO, 0, len(programs))

	for _, p := range programs {
		pdto := ProgramSnapshotDTO{
			ID:               p.ID,
			Order:            p.Order,
			Title:            p.Title,
			Subtitle:         p.Subtitle,
			Description:      p.Description,
			Icon:             p.Icon,
			Color:            p.Color,
			Difficulty:       p.Difficulty,
			EstimatedMinutes: p.EstimatedMinutes,
			TotalLessons:     p.TotalLessons(),
			Modules:          make([]ModuleSnapshotDTO, 0, len(p.Modules)),
		}

		for i := range p.Modules {
			m := &p.Modules[i]
			mdto := ModuleSnapshotDTO{
				ID:               m.ID,
				ProgramID:        m.ProgramID,
				Order:            m.Order,
				Chapter:          m.EffectiveChapter(),
				Title:            m.Title,
				Description:      m.Description,
				EstimatedMinutes: m.EstimatedMinutes(),
				TotalLessons:     len(m.Lessons),
				Lessons:          make([]LessonDetailDTO, 0, len(m.Lessons)),
			}

			for j := range m.Lessons {
				l := &m.Lessons[j]
				if includeBlocks {
					mdto.Lessons = append(mdto.Lessons, ToLessonDetailDTO(l))
				} else {
					mdto.Lessons = append(mdto.Lessons, LessonDetailDTO{
						LessonDTO: ToLessonDTO(l),
					})
				}
			}
			pdto.Modules = append(pdto.Modules, mdto)
		}
		out = append(out, pdto)
	}

	WriteJSON(w, http.StatusOK, CurriculumSnapshotDTO{
		Programs: out,
		Total:    len(out),
	})
}

// compile-time guard pour l'import domain (utilisé indirectement via
// les structures exposées).
var _ = domain.LessonStatusLocked