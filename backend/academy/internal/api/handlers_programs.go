package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

/* ═══════════════════════════════════════════════════════════════════════
   GET /api/v1/programs
   ═══════════════════════════════════════════════════════════════════════ */

// handleListPrograms retourne la liste des programmes (résumés, sans
// modules ni leçons).
//
// Utilisé par l'écran « Parcours » pour afficher les cartes de programmes.
// Chaque élément contient l'essentiel : id, titre, difficulté, nombre
// total de leçons.
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

/* ═══════════════════════════════════════════════════════════════════════
   GET /api/v1/programs/{programID}
   ═══════════════════════════════════════════════════════════════════════ */

// handleGetProgram retourne un programme complet : modules et leçons
// inclus, mais sans le détail des blocs (voir GET /lessons/{id} pour ça).
//
// Utilisé par l'écran « Détail programme » qui affiche l'arborescence
// module → leçons.
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