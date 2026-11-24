// backend/academy/internal/api/middleware.go

package api

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"runtime/debug"
	"strings"
	"time"

	"github.com/leadcortex/academy/internal/logger"
	"github.com/leadcortex/academy/internal/repository"
)

type MiddlewareConfig struct {
	Logger logger.Logger

	CORSOrigins []string

	AllowDevFallback bool

	DefaultLearnerID string
}

func (c MiddlewareConfig) withDefaults() MiddlewareConfig {
	if c.DefaultLearnerID == "" {
		c.DefaultLearnerID = repository.DefaultLearnerID
	}
	if c.Logger.GetLevel() == 0 && c.Logger.GetLevel().String() == "" {
	}
	return c
}


func WithRequestIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Request-ID")
		if id == "" {
			id = newRequestID()
		}
		w.Header().Set("X-Request-ID", id)
		ctx := WithRequestID(r.Context(), id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func newRequestID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "t-" + time.Now().UTC().Format("20060102150405.000000000")
	}
	return hex.EncodeToString(b)
}


type statusRecorder struct {
	http.ResponseWriter
	status int
	wrote  bool
}

func (s *statusRecorder) WriteHeader(code int) {
	if s.wrote {
		return
	}
	s.status = code
	s.wrote = true
	s.ResponseWriter.WriteHeader(code)
}

func (s *statusRecorder) Write(b []byte) (int, error) {
	if !s.wrote {
		s.WriteHeader(http.StatusOK)
	}
	return s.ResponseWriter.Write(b)
}

func (s *statusRecorder) flush() {
	if !s.wrote {
		s.WriteHeader(http.StatusOK)
	}
	if flusher, ok := s.ResponseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
}

type flushableStatusRecorder struct {
	*statusRecorder
}

func (s *flushableStatusRecorder) Flush() {
	s.statusRecorder.flush()
}

func WithLoggingMiddleware(l logger.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			recorder := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
			var rw http.ResponseWriter = recorder
			if _, ok := w.(http.Flusher); ok {
				rw = &flushableStatusRecorder{statusRecorder: recorder}
			}
			next.ServeHTTP(rw, r)
			l.Info().
				Str("method", r.Method).
				Str("path", r.URL.Path).
				Int("status", recorder.status).
				Dur("duration", time.Since(start)).
				Str("request_id", RequestIDFromContext(r.Context())).
				Str("remote", r.RemoteAddr).
				Msg("http")
		})
	}
}


func WithRecoveryMiddleware(l logger.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rec := recover(); rec != nil {
					l.Error().
						Interface("panic", rec).
						Str("path", r.URL.Path).
						Str("request_id", RequestIDFromContext(r.Context())).
						Bytes("stack", debug.Stack()).
						Msg("panic récupérée")
					WriteInternal(w, "panic récupérée")
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}


func WithCORSMiddleware(allowed []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" && isAllowedOrigin(origin, allowed) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Add("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			} else if len(allowed) == 1 && allowed[0] == "*" {
				w.Header().Set("Access-Control-Allow-Origin", "*")
			}
			w.Header().Set("Access-Control-Allow-Methods",
				"GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers",
				"Content-Type, Authorization, X-Learner-ID, X-Request-ID, Last-Event-ID")
			w.Header().Set("Access-Control-Max-Age", "3600")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func isAllowedOrigin(origin string, allowed []string) bool {
	if origin == "" {
		return false
	}
	for _, a := range allowed {
		if a == "*" || a == origin {
			return true
		}
	}
	return false
}


func WithLearnerMiddleware(cfg MiddlewareConfig) func(http.Handler) http.Handler {
	cfg = cfg.withDefaults()
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			id := strings.TrimSpace(r.Header.Get("X-Learner-ID"))

			if id == "" && cfg.AllowDevFallback {
				id = cfg.DefaultLearnerID
			}

			if id == "" {
				WriteUnauthorized(w, "en-tête X-Learner-ID requis")
				return
			}

			ctx := WithLearnerID(r.Context(), id)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}


func Chain(h http.Handler, mws ...func(http.Handler) http.Handler) http.Handler {
	for i := len(mws) - 1; i >= 0; i-- {
		h = mws[i](h)
	}
	return h
}

func StandardMiddlewares(cfg MiddlewareConfig) []func(http.Handler) http.Handler {
	cfg = cfg.withDefaults()
	return []func(http.Handler) http.Handler{
		WithRecoveryMiddleware(cfg.Logger),
		WithRequestIDMiddleware,
		WithLoggingMiddleware(cfg.Logger),
		WithCORSMiddleware(cfg.CORSOrigins),
		WithLearnerMiddleware(cfg),
	}
}
