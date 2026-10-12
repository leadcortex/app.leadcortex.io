package api

import (
	"bufio"
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/rs/zerolog"

	"github.com/leadcortex/academy/internal/missions"
)

/* ─── Hub : souscription / désinscription ─────────────────────────────── */

func TestHub_SubscribeUnsubscribe(t *testing.T) {
	bus := missions.NewEventBus()
	defer bus.Close()
	hub := NewHub(bus, zerolog.Nop())

	c, unsub := hub.Subscribe("u1")
	if c == nil {
		t.Fatal("client nil")
	}
	if hub.ClientCount() != 1 {
		t.Errorf("ClientCount : attendu 1, obtenu %d", hub.ClientCount())
	}

	unsub()
	if hub.ClientCount() != 0 {
		t.Errorf("après unsub : attendu 0, obtenu %d", hub.ClientCount())
	}

	// Second unsub : doit être silencieux.
	unsub()
}

func TestHub_Broadcast(t *testing.T) {
	bus := missions.NewEventBus()
	defer bus.Close()
	hub := NewHub(bus, zerolog.Nop())

	c1, unsub1 := hub.Subscribe("u1")
	defer unsub1()
	c2, unsub2 := hub.Subscribe("u2")
	defer unsub2()

	ev := missions.NewEvent("test.event", time.Now(), map[string]any{"x": 1})
	hub.broadcast(ev)

	for i, c := range []*sseClient{c1, c2} {
		select {
		case got := <-c.ch:
			if got.Kind() != "test.event" {
				t.Errorf("client %d : kind attendu test.event, obtenu %s", i, got.Kind())
			}
		case <-time.After(200 * time.Millisecond):
			t.Errorf("client %d : timeout", i)
		}
	}
}

func TestHub_Close(t *testing.T) {
	bus := missions.NewEventBus()
	hub := NewHub(bus, zerolog.Nop())

	c, _ := hub.Subscribe("u1")
	hub.Close()

	// Le canal doit être fermé.
	select {
	case _, ok := <-c.ch:
		if ok {
			t.Error("le canal devrait être fermé")
		}
	case <-time.After(200 * time.Millisecond):
		t.Fatal("le canal devrait être fermé immédiatement")
	}

	// Close idempotent.
	hub.Close()

	// Nouvelle souscription après close : client avec canal fermé.
	c2, unsub2 := hub.Subscribe("u2")
	defer unsub2()
	select {
	case _, ok := <-c2.ch:
		if ok {
			t.Error("canal du nouveau client devrait être fermé")
		}
	default:
		// Aucune valeur, c'est OK — le canal est juste fermé.
	}
}

func TestHub_RunReceivesFromBus(t *testing.T) {
	bus := missions.NewEventBus()
	hub := NewHub(bus, zerolog.Nop())

	c, unsub := hub.Subscribe("u1")
	defer unsub()

	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan struct{})
	go func() {
		_ = hub.Run(ctx)
		close(done)
	}()
	defer func() {
		cancel()
		<-done
	}()

	// Laisse le hub s'abonner au bus.
	time.Sleep(30 * time.Millisecond)

	ev := missions.NewEvent("lead.created", time.Now(), nil)
	_ = bus.Publish(ev)

	select {
	case got := <-c.ch:
		if got.Kind() != "lead.created" {
			t.Errorf("kind : attendu lead.created, obtenu %s", got.Kind())
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("timeout : événement non reçu")
	}

	bus.Close()
}

func TestHub_RunStopsOnBusClose(t *testing.T) {
	bus := missions.NewEventBus()
	hub := NewHub(bus, zerolog.Nop())

	done := make(chan error, 1)
	go func() {
		done <- hub.Run(context.Background())
	}()

	time.Sleep(30 * time.Millisecond)
	bus.Close()

	select {
	case err := <-done:
		if err != nil {
			t.Errorf("attendu nil, obtenu %v", err)
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("Run n'a pas terminé après close du bus")
	}
}

func TestHub_RunNilBus(t *testing.T) {
	hub := NewHub(nil, zerolog.Nop())
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	go func() { done <- hub.Run(ctx) }()

	time.Sleep(20 * time.Millisecond)
	cancel()

	select {
	case err := <-done:
		if err != nil {
			t.Errorf("attendu nil, obtenu %v", err)
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("Run n'a pas terminé après cancel")
	}
}

/* ─── Handler SSE : intégration bout-en-bout ──────────────────────────── */

func TestSSE_Integration(t *testing.T) {
	bus := missions.NewEventBus()
	defer bus.Close()

	// Server de test (buildTestServer est dans server_test.go).
	s := buildTestServer(t)
	s.deps.Bus = bus
	s.hub = NewHub(bus, zerolog.Nop())

	// Lance le hub.
	hubCtx, hubCancel := context.WithCancel(context.Background())
	defer hubCancel()
	go func() { _ = s.hub.Run(hubCtx) }()

	// Lance un httptest.Server sur le router.
	ts := httptest.NewServer(s.Router())
	defer ts.Close()

	// Prépare la requête SSE.
	reqCtx, reqCancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer reqCancel()

	req, _ := http.NewRequestWithContext(reqCtx, http.MethodGet,
		ts.URL+"/api/v1/events/stream", nil)
	req.Header.Set("X-Learner-ID", "u1")
	req.Header.Set("Accept", "text/event-stream")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("requête SSE : %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("attendu 200, obtenu %d", resp.StatusCode)
	}
	if ct := resp.Header.Get("Content-Type"); !strings.Contains(ct, "text/event-stream") {
		t.Errorf("Content-Type : attendu text/event-stream, obtenu %q", ct)
	}

	// Laisse la souscription s'installer.
	time.Sleep(50 * time.Millisecond)

	// Publie un événement.
	ev := missions.NewEvent("lead.created", time.Now(),
		map[string]any{"lead": map[string]any{"score": 8}})
	if err := bus.Publish(ev); err != nil {
		t.Fatalf("Publish : %v", err)
	}

	// Lit la réponse jusqu'à voir la trame.
	reader := bufio.NewReader(resp.Body)
	deadline := time.Now().Add(2 * time.Second)
	var gotEvent string
	var gotData string
	for time.Now().Before(deadline) {
		line, err := reader.ReadString('\n')
		if err != nil {
			t.Fatalf("lecture SSE : %v", err)
		}
		line = strings.TrimRight(line, "\r\n")
		if strings.HasPrefix(line, "event: ") {
			gotEvent = strings.TrimPrefix(line, "event: ")
		}
		if strings.HasPrefix(line, "data: ") {
			gotData = strings.TrimPrefix(line, "data: ")
			break
		}
	}

	if gotEvent != "lead.created" {
		t.Errorf("event SSE : attendu lead.created, obtenu %q", gotEvent)
	}
	if !strings.Contains(gotData, "lead.created") {
		t.Errorf("data SSE : devrait contenir le kind, obtenu %q", gotData)
	}
	if !strings.Contains(gotData, "score") {
		t.Errorf("data SSE : devrait contenir le payload, obtenu %q", gotData)
	}
}

func TestSSE_RequiresLearner(t *testing.T) {
	s := buildTestServer(t)
	s.cfg.AllowDevFallback = false
	s.handler = s.buildRouter()

	ts := httptest.NewServer(s.Router())
	defer ts.Close()

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/api/v1/events/stream", nil)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("requête : %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("attendu 401, obtenu %d", resp.StatusCode)
	}
}

func TestSSE_InitialComment(t *testing.T) {
	s := buildTestServer(t)
	ts := httptest.NewServer(s.Router())
	defer ts.Close()

	reqCtx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()
	req, _ := http.NewRequestWithContext(reqCtx, http.MethodGet,
		ts.URL+"/api/v1/events/stream", nil)
	req.Header.Set("X-Learner-ID", "u1")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("requête : %v", err)
	}
	defer resp.Body.Close()

	reader := bufio.NewReader(resp.Body)
	line, err := reader.ReadString('\n')
	if err != nil {
		t.Fatalf("lecture : %v", err)
	}
	if !strings.HasPrefix(line, ": connected") {
		t.Errorf("première ligne : attendu : connected, obtenu %q", line)
	}
}