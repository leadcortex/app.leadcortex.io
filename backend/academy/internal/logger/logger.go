// Package logger configure un logger structuré zerolog et l'expose via un
// contexte standard, pour que les sous-packages (curriculum, progress…)
// l'utilisent sans dépendre du package `config`.
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

// Logger est l'interface minimale utilisée partout dans l'academy.
// (zerolog.Logger l'implémente nativement.)
type Logger = zerolog.Logger

type ctxKey struct{}

// ctxLoggerKey est la clé sous laquelle on range le logger dans un contexte.
var ctxLoggerKey = ctxKey{}

// New construit un logger à partir de la config.
//
//  - En production ou format=json : JSON structuré, idéal pour la collecte.
//  - En dev avec format=console : sortie colorée lisible par un humain.
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

	// Champs communs à tous les logs
	logger = logger.With().
		Str("service", "leadcortex-academy").
		Str("env", string(env)).
		Logger()

	// Redirige le logger global de zerolog (utilisé par des libs tierces).
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

// ─── Propagation par contexte ────────────────────────────────────────────

// WithLogger range `l` dans `ctx` pour les couches basses.
func WithLogger(ctx context.Context, l Logger) context.Context {
	return context.WithValue(ctx, ctxLoggerKey, l)
}

// FromContext récupère le logger rangé dans `ctx`, ou le logger global zerolog
// si aucun n'est présent (fallback sûr pour les tests).
func FromContext(ctx context.Context) Logger {
	if l, ok := ctx.Value(ctxLoggerKey).(Logger); ok {
		return l
	}
	return log.Logger
}

// ─── Helpers optionnels ──────────────────────────────────────────────────

// Named renvoie une copie du logger avec un sous-composant nommé.
func Named(l Logger, component string) Logger {
	return l.With().Str("component", component).Logger()
}

// WithRequestID attache un identifiant de requête (utile côté HTTP, partie 16).
func WithRequestID(l Logger, requestID string) Logger {
	return l.With().Str("request_id", requestID).Logger()
}