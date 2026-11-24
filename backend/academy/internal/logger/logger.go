// backend/academy/internal/logger/logger.go

package logger

import (
	"context"
	"io"
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/leadcortex/academy/internal/config"
)

type Logger = zerolog.Logger

type ctxKey struct{}

var ctxLoggerKey = ctxKey{}

func New(cfg config.LogConfig, env config.Env) Logger {
	level := parseLevel(cfg.Level)
	zerolog.SetGlobalLevel(level)
	zerolog.TimeFieldFormat = time.RFC3339Nano

	var w io.Writer = os.Stdout
	var logger zerolog.Logger

	if strings.EqualFold(cfg.Format, "console") && !env.IsProduction() {
		w = zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: "15:04:05.000",
			NoColor:    false,
		}
		logger = zerolog.New(w).With().Timestamp().Logger()
	} else {
		logger = zerolog.New(w).With().Timestamp().Logger()
	}

	logger = logger.With().
		Str("service", "leadcortex-academy").
		Str("env", string(env)).
		Logger()

	log.Logger = logger

	return logger
}

func parseLevel(raw string) zerolog.Level {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "debug":
		return zerolog.DebugLevel
	case "warn", "warning":
		return zerolog.WarnLevel
	case "error":
		return zerolog.ErrorLevel
	case "info", "":
		return zerolog.InfoLevel
	default:
		return zerolog.InfoLevel
	}
}


func WithLogger(ctx context.Context, l Logger) context.Context {
	return context.WithValue(ctx, ctxLoggerKey, l)
}

func FromContext(ctx context.Context) Logger {
	if l, ok := ctx.Value(ctxLoggerKey).(Logger); ok {
		return l
	}
	return log.Logger
}


func Named(l Logger, component string) Logger {
	return l.With().Str("component", component).Logger()
}

func WithRequestID(l Logger, requestID string) Logger {
	return l.With().Str("request_id", requestID).Logger()
}