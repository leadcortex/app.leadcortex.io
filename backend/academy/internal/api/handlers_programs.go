// backend/academy/internal/api/handlers_programs.go

package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)


func (s *Server) handleListPrograms(w http.ResponseWriter, _ *http.Request) {
	programs := s.deps.Registry.AllPrograms()
	out := make([]ProgramDTO, 0, len(programs))
	for _, p := range programs {
		out = append(out, ToProgramSummaryDTO(p))
	}
	WriteJSON(w, http.StatusOK, map[string]any{
		"programs": out,
		"total":    len(out),
	})
}


func (s *Server) handleGetProgram(w http.ResponseWriter, r *http.Request) {
	programID := chi.URLParam(r, "programID")
	if programID == "" {
		WriteBadRequest(w, "program_id manquant")
		return
	}
	p, ok := s.deps.Registry.Program(programID)
	if !ok {
		WriteNotFound(w, "programme introuvable")
		return
	}
	WriteJSON(w, http.StatusOK, ToProgramDTO(p))
}