// backend/academy/internal/api/handlers_curriculum.go

package api

import (
	"net/http"

	"github.com/leadcortex/academy/internal/domain"
)


type CurriculumSnapshotDTO struct {
	Programs []ProgramSnapshotDTO `json:"programs"`
	Total    int                  `json:"total"`
}

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

var _ = domain.LessonStatusLocked