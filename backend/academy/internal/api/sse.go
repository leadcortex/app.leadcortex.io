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

// sseKeepaliveInterval est l'intervalle d'envoi des commentaires keepalive.
// Il doit être plus court que les timeouts proxy (souvent 60s).
const sseKeepaliveInterval = 25 * time.Second

// sseClientBuffer est la taille du buffer par client. En cas de saturation,
// les événements sont perdus (SSE tolère la perte).
const sseClientBuffer = 64

/* ═══════════════════════════════════════════════════════════════════════
   CLIENT
   ═══════════════════════════════════════════════════════════════════════ */

// sseClient représente une connexion SSE ouverte.
type sseClient struct {
	// learnerID — identifiant de l'apprenant propriétaire de la connexion.
	// Sert au filtrage (multi-utilisateur futur).
	learnerID string

	// ch — canal sur lequel le hub pousse les événements.
	// Fermé par le hub au Close ou à l'Unsubscribe.
	ch chan missions.BusinessEvent
}

/* ═══════════════════════════════════════════════════════════════════════
   HUB
   ═══════════════════════════════════════════════════════════════════════ */

// Hub diffuse les événements du missions.EventBus à tous les clients SSE
// abonnés.
//
// Le Hub est safe en usage concurrent. Il est créé par NewServer et son
// cycle de vie est piloté par Server.Run.
type Hub struct {
	mu      sync.RWMutex
	clients map[*sseClient]struct{}
	bus     *missions.EventBus
	log     logger.Logger
	closed  bool
}

// NewHub construit un hub rattaché au bus.
// Le bus peut être nil : dans ce cas, aucun événement ne sera diffusé
// (utile en test si on ne teste pas le SSE).
func NewHub(bus *missions.EventBus, log logger.Logger) *Hub {
	return &Hub{
		clients: make(map[*sseClient]struct{}),
		bus:     bus,
		log:     log,
	}
}

/* ─── Cycle de vie ────────────────────────────────────────────────────── */

// Run écoute le bus et diffuse les événements aux clients.
//
// Bloque jusqu'à :
//
//   - annulation du context → nil
//   - fermeture du bus → nil
//
// Ferme tous les clients à la sortie.
func (h *Hub) Run(ctx context.Context) error {
	if h.bus == nil {
		// Pas de bus : rien à faire, on bloque jusqu'à l'annulation.
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
				// Bus fermé.
				h.Close()
				return nil
			}
			h.broadcast(ev)
		}
	}
}

// Close ferme tous les clients et empêche toute nouvelle souscription.
// Idempotent.
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

// ClientCount retourne le nombre de clients connectés.
func (h *Hub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

/* ─── Souscription ────────────────────────────────────────────────────── */

// Subscribe ajoute un client au hub. Retourne le client et une fonction
// d'unsubscription à appeler systématiquement (defer).
//
// Si le hub est fermé, retourne un client avec un canal déjà fermé et
// une fonction d'unsub no-op. Le handler SSE fermera immédiatement.
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

// unsubscribe retire un client et ferme son canal.
// Safe : ignore les clients déjà retirés.
func (h *Hub) unsubscribe(c *sseClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.clients == nil {
		return // déjà fermé
	}
	if _, ok := h.clients[c]; !ok {
		return // déjà retiré
	}
	delete(h.clients, c)
	close(c.ch)
}

// broadcast envoie un événement à tous les clients.
//
// La diffusion est non bloquante : si un client est saturé, l'événement
// est ignoré pour ce client.
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
			// Client saturé : on saute.
			if h.log.GetLevel().String() != "" {
				h.log.Warn().
					Str("learner_id", c.learnerID).
					Str("kind", ev.Kind()).
					Msg("client SSE saturé, événement ignoré")
			}
		}
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   HANDLER HTTP
   ═══════════════════════════════════════════════════════════════════════ */

// handleSSE est le handler HTTP de l'endpoint SSE.
//
// Format des trames envoyées :
//
//	event: <kind>
//	data: <payload-json>
//	<blank line>
//
// Le client peut filtrer par `kind` (EventSource.addEventListener).
func (s *Server) handleSSE(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		WriteInternal(w, "streaming non supporté par ce serveur")
		return
	}

	learnerID := MustLearnerID(r.Context())

	// En-têtes SSE.
	w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache, no-transform")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)

	// Envoi d'un commentaire initial pour ouvrir le stream côté client.
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
				// Hub fermé ou client évincé.
				return
			}
			if err := writeSSEEvent(w, ev); err != nil {
				// Le client s'est déconnecté : on arrête proprement.
				return
			}
			flusher.Flush()
		case <-ticker.C:
			// Commentaire keepalive pour empêcher la fermeture par les
			// proxies intermédiaires.
			if _, err := fmt.Fprint(w, ": keepalive\n\n"); err != nil {
				return
			}
			flusher.Flush()
		}
	}
}

/* ─── Sérialisation SSE ───────────────────────────────────────────────── */

// ssePayload est le JSON envoyé dans le champ `data:` de chaque trame.
type ssePayload struct {
	Kind    string         `json:"kind"`
	At      string         `json:"at"`
	Payload map[string]any `json:"payload,omitempty"`
}

// writeSSEEvent écrit une trame SSE complète pour un événement.
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

	// Format SSE : event + data + double saut de ligne.
	if _, err := fmt.Fprintf(w, "event: %s\n", ev.Kind()); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(w, "data: %s\n\n", data); err != nil {
		return err
	}
	return nil
}