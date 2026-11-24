// backend/academy/internal/api/context.go

package api

import (
	"context"

	"github.com/leadcortex/academy/internal/logger"
)

type ctxKey int

const (
	ctxKeyRequestID ctxKey = iota
	ctxKeyLearnerID
)


func WithRequestID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, ctxKeyRequestID, id)
}

func RequestIDFromContext(ctx context.Context) string {
	if v, ok := ctx.Value(ctxKeyRequestID).(string); ok {
		return v
	}
	return ""
}


func WithLearnerID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, ctxKeyLearnerID, id)
}

func LearnerIDFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(ctxKeyLearnerID).(string)
	if !ok || v == "" {
		return "", false
	}
	return v, true
}

func MustLearnerID(ctx context.Context) string {
	id, _ := LearnerIDFromContext(ctx)
	return id
}


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