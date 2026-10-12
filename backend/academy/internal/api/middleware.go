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

// MiddlewareConfig regroupe la configuration des middlewares.
type MiddlewareConfig struct {
	// Logger — logger zerolog. Si zéro, un logger silencieux sera utilisé.
	Logger logger.Logger

	// CORSOrigins — origines autorisées. Vide ou ["*"] = tout autorisé.
	CORSOrigins []string

	// AllowDevFallback — si vrai, l'absence de X-Learner-ID utilise
	// repository.DefaultLearnerID au lieu de renvoyer 401.
	// À mettre à true en dev/staging uniquement.
	AllowDevFallback bool

	// DefaultLearnerID — identifiant de repli. Vide = repository.DefaultLearnerID.
	DefaultLearnerID string
}

// withDefaults applique les valeurs par défaut.
func (c MiddlewareConfig) withDefaults() MiddlewareConfig {
	if c.DefaultLearnerID == "" {
		c.DefaultLearnerID = repository.DefaultLearnerID
	}
	if c.Logger.GetLevel() == 0 && c.Logger.GetLevel().String() == "" {
		// Logger zéro : on ne fait rien, zerolog gère.
	}
	return c
}

/* ─── Request ID ──────────────────────────────────────────────────────── */

// WithRequestIDMiddleware lit X-Request-ID ou en génère un, l'ajoute au
// contexte et le renvoie dans la réponse.
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

// newRequestID génère un identifiant hexadécimal aléatoire (16 octets).
func newRequestID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		// Fallback très improbable : on retombe sur l'horodatage.
		return "t-" + time.Now().UTC().Format("20060102150405.000000000")
	}
	return hex.EncodeToString(b)
}

/* ─── Logging ─────────────────────────────────────────────────────────── */

// statusRecorder capture le code de réponse pour le log.
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

// WithLoggingMiddleware journalise chaque requête.
func WithLoggingMiddleware(l logger.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rw := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(rw, r)
			l.Info().
				Str("method", r.Method).
				Str("path", r.URL.Path).
				Int("status", rw.status).
				Dur("duration", time.Since(start)).
				Str("request_id", RequestIDFromContext(r.Context())).
				Str("remote", r.RemoteAddr).
				Msg("http")
		})
	}
}

/* ─── Recovery ────────────────────────────────────────────────────────── */

// WithRecoveryMiddleware capture les panics et retourne une 500 JSON.
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

/* ─── CORS ────────────────────────────────────────────────────────────── */

// WithCORSMiddleware gère les en-têtes CORS et les pré-vols OPTIONS.
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

// isAllowedOrigin — vraie si origin est dans la liste (ou "*").
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

/* ─── Learner ─────────────────────────────────────────────────────────── */

// WithLearnerMiddleware extrait le LearnerID depuis l'en-tête X-Learner-ID
// (ou le fallback dev) et l'injecte dans le contexte.
func WithLearnerMiddleware(cfg MiddlewareConfig) func(http.Handler) http.Handler {
	cfg = cfg.withDefaults()
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// 1. En-tête explicite.
			id := strings.TrimSpace(r.Header.Get("X-Learner-ID"))

			// 2. Fallback dev.
			if id == "" && cfg.AllowDevFallback {
				id = cfg.DefaultLearnerID
			}

			// 3. Rejet.
			if id == "" {
				WriteUnauthorized(w, "en-tête X-Learner-ID requis")
				return
			}

			ctx := WithLearnerID(r.Context(), id)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

/* ─── Composition ─────────────────────────────────────────────────────── */

// Chain applique les middlewares dans l'ordre (le premier de la liste
// est le plus externe).
func Chain(h http.Handler, mws ...func(http.Handler) http.Handler) http.Handler {
	for i := len(mws) - 1; i >= 0; i-- {
		h = mws[i](h)
	}
	return h
}

// StandardMiddlewares construit la pile standard :
//
//	recovery → request-id → logging → CORS → learner
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