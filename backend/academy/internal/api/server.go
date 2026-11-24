// backend/academy/internal/api/server.go

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


type ServerConfig struct {
	Addr string

	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	IdleTimeout     time.Duration
	ShutdownTimeout time.Duration

	CORSOrigins []string

	AllowDevFallback bool

	DefaultLearnerID string
}

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

func (c ServerConfig) validate() error {
	if c.Addr == "" {
		return errors.New("api: ServerConfig.Addr obligatoire")
	}
	if c.ShutdownTimeout <= 0 {
		return errors.New("api: ServerConfig.ShutdownTimeout doit être > 0")
	}
	return nil
}


type Clock interface {
	Now() time.Time
}

type realClock struct{}

func (realClock) Now() time.Time { return time.Now().UTC() }


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


type Server struct {
	cfg  ServerConfig
	log  logger.Logger
	deps Dependencies
	hub  *Hub

	httpSrv *http.Server
	handler http.Handler
}

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

	s.hub = NewHub(deps.Bus, deps.Logger)

	s.handler = s.buildRouter()

	s.httpSrv = &http.Server{
		Addr:         cfg.Addr,
		Handler:      s.handler,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		IdleTimeout:  cfg.IdleTimeout,
	}

	return s, nil
}


func (s *Server) Router() http.Handler { return s.handler }

func (s *Server) Hub() *Hub { return s.hub }

func (s *Server) Config() ServerConfig { return s.cfg }


func (s *Server) Run(ctx context.Context) error {
	hubCtx, hubCancel := context.WithCancel(ctx)
	defer hubCancel()

	hubErrCh := make(chan error, 1)
	go func() {
		if err := s.hub.Run(hubCtx); err != nil && !errors.Is(err, context.Canceled) {
			hubErrCh <- err
		}
	}()

	httpErrCh := make(chan error, 1)
	go func() {
		s.log.Info().Str("addr", s.cfg.Addr).Msg("serveur HTTP en écoute")
		if err := s.httpSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			httpErrCh <- fmt.Errorf("api: ListenAndServe : %w", err)
		}
	}()

	select {
	case <-ctx.Done():
		s.log.Info().Msg("arrêt demandé, shutdown en cours")
		return s.shutdown()
	case err := <-httpErrCh:
		return err
	case err := <-hubErrCh:
		s.log.Error().Err(err).Msg("hub SSE arrêté brutalement")
		_ = s.shutdown()
		return err
	}
}

func (s *Server) shutdown() error {
	shutdownCtx, cancel := context.WithTimeout(context.Background(), s.cfg.ShutdownTimeout)
	defer cancel()

	s.hub.Close()

	if err := s.httpSrv.Shutdown(shutdownCtx); err != nil {
		s.log.Error().Err(err).Msg("shutdown échoué")
		return fmt.Errorf("api: shutdown : %w", err)
	}
	s.log.Info().Msg("serveur arrêté proprement")
	return nil
}


func (s *Server) notImplemented(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusNotImplemented, apiError{
		Error:   "not_implemented",
		Message: "endpoint non encore implémenté",
		Code:    http.StatusNotImplemented,
	})
}

func (s *Server) versionInfo() version.Info {
	return version.Current()
}