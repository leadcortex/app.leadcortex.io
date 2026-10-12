package api

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/leadcortex/academy/internal/assessment"
	"github.com/leadcortex/academy/internal/avatars"
	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/logger"
	"github.com/leadcortex/academy/internal/missions"
	"github.com/leadcortex/academy/internal/progress"
	"github.com/leadcortex/academy/internal/repository"
	"github.com/leadcortex/academy/internal/version"
)

/* ═══════════════════════════════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════════════════════════════ */

// ServerConfig regroupe les paramètres de fonctionnement du serveur HTTP.
type ServerConfig struct {
	// Addr — adresse d'écoute, ex. ":8080".
	Addr string

	// Timeouts HTTP.
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	IdleTimeout     time.Duration
	ShutdownTimeout time.Duration

	// CORSOrigins — origines autorisées pour les appels cross-domain.
	CORSOrigins []string

	// AllowDevFallback — si vrai, l'absence de X-Learner-ID utilise
	// le DefaultLearnerID (dev/staging uniquement).
	AllowDevFallback bool

	// DefaultLearnerID — identifiant de repli. Vide = repository.DefaultLearnerID.
	DefaultLearnerID string
}

// DefaultServerConfig — configuration par défaut (dev).
func DefaultServerConfig() ServerConfig {
	return ServerConfig{
		Addr:            ":8080",
		ReadTimeout:     15 * time.Second,
		WriteTimeout:    30 * time.Second,
		IdleTimeout:     120 * time.Second,
		ShutdownTimeout: 10 * time.Second,
		CORSOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowDevFallback: true,
	}
}

// validate vérifie les invariants de la config.
func (c ServerConfig) validate() error {
	if c.Addr == "" {
		return errors.New("api: ServerConfig.Addr obligatoire")
	}
	if c.ShutdownTimeout <= 0 {
		return errors.New("api: ServerConfig.ShutdownTimeout doit être > 0")
	}
	return nil
}

/* ═══════════════════════════════════════════════════════════════════════
   CLOCK
   ═══════════════════════════════════════════════════════════════════════ */

// Clock est l'abstraction d'horloge du package api. Permet de figer le
// temps dans les tests (SSE keepalive, logs, timestamps d'événements).
type Clock interface {
	Now() time.Time
}

// realClock — implémentation par défaut.
type realClock struct{}

func (realClock) Now() time.Time { return time.Now().UTC() }

/* ═══════════════════════════════════════════════════════════════════════
   DEPENDENCIES
   ═══════════════════════════════════════════════════════════════════════ */

// Dependencies regroupe les services internes injectés dans le Server.
//
// Les champs obligatoires sont : Logger, Registry, Repository, Engine.
// Les autres peuvent être nil et les routes correspondantes renverront
// un 501 (utile en développement incrémental).
type Dependencies struct {
	Logger       logger.Logger
	Registry     *curriculum.Registry
	Resolver     *curriculum.Resolver
	Repository   repository.Repository
	Engine       *progress.Engine
	Evaluator    *assessment.Evaluator
	Bus          *missions.EventBus
	Orchestrator *missions.Orchestrator
	Avatars      *avatars.Service
	Clock        Clock
}

// validate vérifie que les deps obligatoires sont présentes.
func (d Dependencies) validate() error {
	if d.Registry == nil {
		return errors.New("api: Dependencies.Registry obligatoire")
	}
	if d.Repository == nil {
		return errors.New("api: Dependencies.Repository obligatoire")
	}
	if d.Engine == nil {
		return errors.New("api: Dependencies.Engine obligatoire")
	}
	return nil
}

/* ═══════════════════════════════════════════════════════════════════════
   SERVER
   ═══════════════════════════════════════════════════════════════════════ */

// Server est le serveur HTTP de l'academy. Il encapsule :
//
//   - le routeur chi (voir router.go)
//   - le hub SSE (voir sse.go)
//   - la configuration HTTP
//   - les dépendances métier (registry, repo, engine, bus…)
//
// Server est safe en lecture concurrente après NewServer. La méthode
// Run bloque jusqu'à l'annulation du contexte ou une erreur fatale.
type Server struct {
	cfg  ServerConfig
	log  logger.Logger
	deps Dependencies
	hub  *Hub

	httpSrv *http.Server
	handler http.Handler
}

// NewServer construit un serveur prêt à démarrer.
//
// Erreurs possibles :
//   - config invalide
//   - dépendances obligatoires manquantes
func NewServer(cfg ServerConfig, deps Dependencies) (*Server, error) {
	if err := cfg.validate(); err != nil {
		return nil, err
	}
	if err := deps.validate(); err != nil {
		return nil, err
	}
	if deps.Clock == nil {
		deps.Clock = realClock{}
	}

	s := &Server{
		cfg:  cfg,
		log:  deps.Logger,
		deps: deps,
	}

	// Hub SSE : il diffuse les événements du bus aux clients abonnés.
	s.hub = NewHub(deps.Bus, deps.Logger)

	// Construction du routeur HTTP.
	s.handler = s.buildRouter()

	// Serveur HTTP bas niveau.
	s.httpSrv = &http.Server{
		Addr:         cfg.Addr,
		Handler:      s.handler,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		IdleTimeout:  cfg.IdleTimeout,
	}

	return s, nil
}

/* ─── Accesseurs (utilisés par les tests et les handlers) ─────────────── */

// Router retourne le handler HTTP complet. Utile pour httptest.NewServer.
func (s *Server) Router() http.Handler { return s.handler }

// Hub retourne le hub SSE. Utile pour brancher un bus ad-hoc dans les tests.
func (s *Server) Hub() *Hub { return s.hub }

// Config retourne la configuration effective.
func (s *Server) Config() ServerConfig { return s.cfg }

/* ─── Cycle de vie ────────────────────────────────────────────────────── */

// Run démarre le serveur HTTP et le hub SSE. Bloque jusqu'à :
//
//   - annulation du context (arrêt gracieux demandé) → nil
//   - erreur fatale du ListenAndServe → l'erreur
//
// Le hub SSE est démarré dans une goroutine séparée et s'arrête
// automatiquement quand ctx est annulé ou que le bus est fermé.
func (s *Server) Run(ctx context.Context) error {
	// Hub SSE en arrière-plan.
	hubCtx, hubCancel := context.WithCancel(ctx)
	defer hubCancel()

	hubErrCh := make(chan error, 1)
	go func() {
		if err := s.hub.Run(hubCtx); err != nil && !errors.Is(err, context.Canceled) {
			hubErrCh <- err
		}
	}()

	// Serveur HTTP.
	httpErrCh := make(chan error, 1)
	go func() {
		s.log.Info().Str("addr", s.cfg.Addr).Msg("serveur HTTP en écoute")
		if err := s.httpSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			httpErrCh <- fmt.Errorf("api: ListenAndServe : %w", err)
		}
	}()

	// Attente signal / erreur.
	select {
	case <-ctx.Done():
		s.log.Info().Msg("arrêt demandé, shutdown en cours")
		return s.shutdown()
	case err := <-httpErrCh:
		return err
	case err := <-hubErrCh:
		// Le hub a planté : on arrête le serveur HTTP.
		s.log.Error().Err(err).Msg("hub SSE arrêté brutalement")
		_ = s.shutdown()
		return err
	}
}

// shutdown effectue un arrêt gracieux du serveur HTTP.
func (s *Server) shutdown() error {
	shutdownCtx, cancel := context.WithTimeout(context.Background(), s.cfg.ShutdownTimeout)
	defer cancel()

	// Ferme d'abord le hub (libère les clients SSE).
	s.hub.Close()

	if err := s.httpSrv.Shutdown(shutdownCtx); err != nil {
		s.log.Error().Err(err).Msg("shutdown échoué")
		return fmt.Errorf("api: shutdown : %w", err)
	}
	s.log.Info().Msg("serveur arrêté proprement")
	return nil
}

/* ═══════════════════════════════════════════════════════════════════════
   HANDLERS DE SANTÉ (utilisés par router.go)
   ═══════════════════════════════════════════════════════════════════════ */

// notImplemented est le stub utilisé par toutes les routes métier qui
// seront branchées dans les vagues 4-8. Répond 501.
func (s *Server) notImplemented(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusNotImplemented, apiError{
		Error:   "not_implemented",
		Message: "endpoint non encore implémenté",
		Code:    http.StatusNotImplemented,
	})
}

// versionInfo permet de centraliser l'appel à version.Current() — utile
// pour les tests qui veulent vérifier la forme de la réponse.
func (s *Server) versionInfo() version.Info {
	return version.Current()
}