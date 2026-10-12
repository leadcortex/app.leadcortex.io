package api

import (
	"context"

	"github.com/leadcortex/academy/internal/logger"
)

// ctxKey est un type privé pour les clés de contexte. Évite les collisions
// avec des clés d'autres packages.
type ctxKey int

const (
	ctxKeyRequestID ctxKey = iota
	ctxKeyLearnerID
)

/* ─── Request ID ──────────────────────────────────────────────────────── */

// WithRequestID range un request ID dans le contexte.
func WithRequestID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, ctxKeyRequestID, id)
}

// RequestIDFromContext récupère le request ID ou "".
func RequestIDFromContext(ctx context.Context) string {
	if v, ok := ctx.Value(ctxKeyRequestID).(string); ok {
		return v
	}
	return ""
}

/* ─── Learner ID ──────────────────────────────────────────────────────── */

// WithLearnerID range le learner ID dans le contexte.
func WithLearnerID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, ctxKeyLearnerID, id)
}

// LearnerIDFromContext récupère le learner ID.
// Renvoie ("", false) si absent.
func LearnerIDFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(ctxKeyLearnerID).(string)
	if !ok || v == "" {
		return "", false
	}
	return v, true
}

// MustLearnerID récupère le learner ID ou "".
// À utiliser dans les handlers qui sont toujours derrière le middleware
// learner — le retour est garanti non vide si le middleware a tourné.
func MustLearnerID(ctx context.Context) string {
	id, _ := LearnerIDFromContext(ctx)
	return id
}

/* ─── Logger ──────────────────────────────────────────────────────────── */

// RequestLogger retourne un logger enrichi des champs de la requête
// (request_id, learner_id) rangés dans le contexte.
func RequestLogger(ctx context.Context) logger.Logger {
	l := logger.FromContext(ctx)
	if id := RequestIDFromContext(ctx); id != "" {
		l = l.With().Str("request_id", id).Logger()
	}
	if lid, ok := LearnerIDFromContext(ctx); ok {
		l = l.With().Str("learner_id", lid).Logger()
	}
	return l
}