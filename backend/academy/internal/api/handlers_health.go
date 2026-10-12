package api

import (
	"net/http"
)

// handleHealthz — liveness probe.
//
// Répond 200 tant que le process HTTP répond. Ne touche ni au repository
// ni au curriculum : c'est un signal « le process est vivant ».
func (s *Server) handleHealthz(w http.ResponseWriter, _ *http.Request) {
	WriteJSON(w, http.StatusOK, map[string]any{"status": "ok"})
}

// handleReadyz — readiness probe.
//
// Vérifie que :
//   - le registre de curriculum est chargé (non nil)
//   - le repository répond à un Ping
//
// Renvoie 503 si l'une des conditions n'est pas satisfaite.
func (s *Server) handleReadyz(w http.ResponseWriter, r *http.Request) {
	if s.deps.Registry == nil {
		WriteUnavailable(w, "curriculum non chargé")
		return
	}
	if s.deps.Repository != nil {
		if err := s.deps.Repository.Ping(r.Context()); err != nil {
			WriteUnavailable(w, "repository indisponible")
			return
		}
	}
	WriteJSON(w, http.StatusOK, map[string]any{"status": "ready"})
}

// handleVersion — métadonnées de build.
func (s *Server) handleVersion(w http.ResponseWriter, _ *http.Request) {
	WriteJSON(w, http.StatusOK, s.versionInfo())
}