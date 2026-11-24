// backend/academy/internal/api/handlers_health.go

package api

import (
	"net/http"
)

func (s *Server) handleHealthz(w http.ResponseWriter, _ *http.Request) {
	WriteJSON(w, http.StatusOK, map[string]any{"status": "ok"})
}

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

func (s *Server) handleVersion(w http.ResponseWriter, _ *http.Request) {
	WriteJSON(w, http.StatusOK, s.versionInfo())
}