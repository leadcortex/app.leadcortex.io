// backend/academy/internal/api/sse.go

package api

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/leadcortex/academy/internal/logger"
	"github.com/leadcortex/academy/internal/missions"
)

const sseKeepaliveInterval = 25 * time.Second

const sseClientBuffer = 64


type sseClient struct {
	learnerID string

	ch chan missions.BusinessEvent
}


type Hub struct {
	mu      sync.RWMutex
	clients map[*sseClient]struct{}
	bus     *missions.EventBus
	log     logger.Logger
	closed  bool
}

func NewHub(bus *missions.EventBus, log logger.Logger) *Hub {
	return &Hub{
		clients: make(map[*sseClient]struct{}),
		bus:     bus,
		log:     log,
	}
}


func (h *Hub) Run(ctx context.Context) error {
	if h.bus == nil {
		<-ctx.Done()
		h.Close()
		return nil
	}

	ch, err := h.bus.SubscribeAll()
	if err != nil {
		if errors.Is(err, missions.ErrBusClosed) {
			h.Close()
			return nil
		}
		return fmt.Errorf("api: hub SubscribeAll : %w", err)
	}
	defer func() { _ = h.bus.Unsubscribe(ch) }()

	for {
		select {
		case <-ctx.Done():
			h.Close()
			return nil
		case ev, ok := <-ch:
			if !ok {
				h.Close()
				return nil
			}
			h.broadcast(ev)
		}
	}
}

func (h *Hub) Close() {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.closed {
		return
	}
	h.closed = true
	for c := range h.clients {
		close(c.ch)
	}
	h.clients = nil
}

func (h *Hub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}


func (h *Hub) Subscribe(learnerID string) (*sseClient, func()) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.closed {
		closed := make(chan missions.BusinessEvent)
		close(closed)
		return &sseClient{learnerID: learnerID, ch: closed}, func() {}
	}

	c := &sseClient{
		learnerID: learnerID,
		ch:        make(chan missions.BusinessEvent, sseClientBuffer),
	}
	h.clients[c] = struct{}{}

	unsub := func() { h.unsubscribe(c) }
	return c, unsub
}

func (h *Hub) unsubscribe(c *sseClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.clients == nil {
		return
	}
	if _, ok := h.clients[c]; !ok {
		return
	}
	delete(h.clients, c)
	close(c.ch)
}

func (h *Hub) broadcast(ev missions.BusinessEvent) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if h.closed {
		return
	}
	for c := range h.clients {
		select {
		case c.ch <- ev:
		default:
			if h.log.GetLevel().String() != "" {
				h.log.Warn().
					Str("learner_id", c.learnerID).
					Str("kind", ev.Kind()).
					Msg("client SSE saturé, événement ignoré")
			}
		}
	}
}


func (s *Server) handleSSE(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		WriteInternal(w, "streaming non supporté par ce serveur")
		return
	}

	learnerID := MustLearnerID(r.Context())

	w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache, no-transform")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)

	_, _ = fmt.Fprint(w, ": connected\n\n")
	flusher.Flush()

	client, unsub := s.hub.Subscribe(learnerID)
	defer unsub()

	ticker := time.NewTicker(sseKeepaliveInterval)
	defer ticker.Stop()

	ctx := r.Context()
	for {
		select {
		case <-ctx.Done():
			return
		case ev, ok := <-client.ch:
			if !ok {
				return
			}
			if err := writeSSEEvent(w, ev); err != nil {
				return
			}
			flusher.Flush()
		case <-ticker.C:
			if _, err := fmt.Fprint(w, ": keepalive\n\n"); err != nil {
				return
			}
			flusher.Flush()
		}
	}
}


type ssePayload struct {
	Kind    string         `json:"kind"`
	At      string         `json:"at"`
	Payload map[string]any `json:"payload,omitempty"`
}

func writeSSEEvent(w http.ResponseWriter, ev missions.BusinessEvent) error {
	payload := ssePayload{
		Kind:    ev.Kind(),
		At:      ev.At().UTC().Format(time.RFC3339),
		Payload: ev.Payload(),
	}
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	if _, err := fmt.Fprintf(w, "event: %s\n", ev.Kind()); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(w, "data: %s\n\n", data); err != nil {
		return err
	}
	return nil
}