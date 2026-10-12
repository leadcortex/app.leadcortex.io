package missions

import (
	"sync"
	"testing"
	"time"
)

func TestEventBus_SubscribePublish(t *testing.T) {
	bus := NewEventBus()
	defer bus.Close()

	ch, err := bus.Subscribe(EventLeadCreated)
	if err != nil {
		t.Fatalf("Subscribe : %v", err)
	}

	ev := NewEvent(EventLeadCreated, time.Now().UTC(), map[string]any{"id": "l1"})
	if err := bus.Publish(ev); err != nil {
		t.Fatalf("Publish : %v", err)
	}

	select {
	case got := <-ch:
		if got.Kind() != EventLeadCreated {
			t.Errorf("kind : attendu %s, obtenu %s", EventLeadCreated, got.Kind())
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("timeout : aucun événement reçu")
	}
}

func TestEventBus_SubscribeFiltersByKind(t *testing.T) {
	bus := NewEventBus()
	defer bus.Close()

	ch, _ := bus.Subscribe(EventLeadCreated)

	// Publie un autre kind.
	_ = bus.Publish(NewEvent(EventCompanyViewed, time.Time{}, nil))

	select {
	case ev := <-ch:
		t.Errorf("ne devrait rien recevoir, obtenu %s", ev.Kind())
	case <-time.After(30 * time.Millisecond):
		// OK, rien reçu.
	}

	// Publie le bon kind.
	_ = bus.Publish(NewEvent(EventLeadCreated, time.Time{}, nil))
	select {
	case <-ch:
		// OK
	case <-time.After(100 * time.Millisecond):
		t.Fatal("attendu : réception de lead.created")
	}
}

func TestEventBus_SubscribeAll(t *testing.T) {
	bus := NewEventBus()
	defer bus.Close()

	ch, err := bus.SubscribeAll()
	if err != nil {
		t.Fatalf("SubscribeAll : %v", err)
	}

	kinds := []string{EventLeadCreated, EventCompanyViewed, EventEmailSent}
	for _, k := range kinds {
		_ = bus.Publish(NewEvent(k, time.Time{}, nil))
	}

	received := make([]string, 0, len(kinds))
	for i := 0; i < len(kinds); i++ {
		select {
		case ev := <-ch:
			received = append(received, ev.Kind())
		case <-time.After(100 * time.Millisecond):
			t.Fatalf("timeout après %d événements", i)
		}
	}
	if len(received) != len(kinds) {
		t.Errorf("attendu %d événements, obtenu %d", len(kinds), len(received))
	}
}

func TestEventBus_MultipleSubscribers(t *testing.T) {
	bus := NewEventBus()
	defer bus.Close()

	ch1, _ := bus.Subscribe(EventLeadCreated)
	ch2, _ := bus.Subscribe(EventLeadCreated)

	_ = bus.Publish(NewEvent(EventLeadCreated, time.Time{}, nil))

	for i, ch := range []<-chan BusinessEvent{ch1, ch2} {
		select {
		case <-ch:
			// OK
		case <-time.After(100 * time.Millisecond):
			t.Errorf("abonné %d : timeout", i)
		}
	}
}

func TestEventBus_Unsubscribe(t *testing.T) {
	bus := NewEventBus()
	defer bus.Close()

	ch, _ := bus.Subscribe(EventLeadCreated)
	if !bus.Unsubscribe(ch) {
		t.Error("Unsubscribe devrait retourner true")
	}
	// Second appel : false.
	if bus.Unsubscribe(ch) {
		t.Error("second Unsubscribe devrait retourner false")
	}
	// Le canal n'est pas fermé.
	select {
	case _, ok := <-ch:
		if !ok {
			t.Error("le canal ne devrait pas être fermé")
		}
	default:
		// OK, rien à lire.
	}
}

func TestEventBus_UnsubscribeAll(t *testing.T) {
	bus := NewEventBus()
	defer bus.Close()

	ch, _ := bus.SubscribeAll()
	if !bus.Unsubscribe(ch) {
		t.Error("Unsubscribe (all) devrait retourner true")
	}
}

func TestEventBus_Close(t *testing.T) {
	bus := NewEventBus()
	ch, _ := bus.Subscribe(EventLeadCreated)

	bus.Close()

	// Le canal doit être fermé.
	select {
	case _, ok := <-ch:
		if ok {
			t.Error("le canal devrait être fermé")
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("le canal devrait être fermé immédiatement")
	}
}

func TestEventBus_CloseIdempotent(t *testing.T) {
	bus := NewEventBus()
	bus.Close()
	bus.Close() // ne doit pas paniquer
	if !bus.IsClosed() {
		t.Error("IsClosed devrait être true")
	}
}

func TestEventBus_PublishAfterClose(t *testing.T) {
	bus := NewEventBus()
	bus.Close()

	err := bus.Publish(NewEvent(EventLeadCreated, time.Time{}, nil))
	if err != ErrBusClosed {
		t.Errorf("attendu ErrBusClosed, obtenu %v", err)
	}
}

func TestEventBus_SubscribeAfterClose(t *testing.T) {
	bus := NewEventBus()
	bus.Close()

	_, err := bus.Subscribe(EventLeadCreated)
	if err != ErrBusClosed {
		t.Errorf("attendu ErrBusClosed, obtenu %v", err)
	}
	_, err = bus.SubscribeAll()
	if err != ErrBusClosed {
		t.Errorf("attendu ErrBusClosed, obtenu %v", err)
	}
}

func TestEventBus_SubscribeEmptyKind(t *testing.T) {
	bus := NewEventBus()
	defer bus.Close()

	_, err := bus.Subscribe("")
	if err == nil {
		t.Fatal("attendu une erreur pour kind vide")
	}
}

func TestEventBus_PublishNil(t *testing.T) {
	bus := NewEventBus()
	defer bus.Close()

	err := bus.Publish(nil)
	if err == nil {
		t.Fatal("attendu une erreur pour event nil")
	}
}

func TestEventBus_PublishEmptyKind(t *testing.T) {
	bus := NewEventBus()
	defer bus.Close()

	ev := GenericEvent{K: "", T: time.Now().UTC()}
	if err := bus.Publish(ev); err == nil {
		t.Fatal("attendu une erreur pour kind vide")
	}
}

func TestEventBus_NonBlockingPublish_BufferFull(t *testing.T) {
	// Buffer de 1 : un seul événement peut être mis en attente.
	bus := NewEventBusWithBuffer(1)
	defer bus.Close()

	ch, _ := bus.Subscribe(EventLeadCreated)

	// Remplit le buffer.
	_ = bus.Publish(NewEvent(EventLeadCreated, time.Time{}, nil))
	_ = bus.Publish(NewEvent(EventLeadCreated, time.Time{}, nil))
	_ = bus.Publish(NewEvent(EventLeadCreated, time.Time{}, nil))

	// Seul le premier doit être disponible.
	select {
	case <-ch:
		// OK
	case <-time.After(50 * time.Millisecond):
		t.Fatal("devrait recevoir 1 événement")
	}

	// Les autres sont perdus.
	select {
	case <-ch:
		t.Error("ne devrait plus rien y avoir dans le buffer")
	case <-time.After(30 * time.Millisecond):
		// OK
	}
}

func TestEventBus_SubscriberCount(t *testing.T) {
	bus := NewEventBus()
	defer bus.Close()

	if n := bus.SubscriberCount(); n != 0 {
		t.Errorf("initial : attendu 0, obtenu %d", n)
	}

	_, _ = bus.Subscribe(EventLeadCreated)
	_, _ = bus.Subscribe(EventLeadCreated)
	_, _ = bus.SubscribeAll()

	if n := bus.SubscriberCount(); n != 3 {
		t.Errorf("après souscriptions : attendu 3, obtenu %d", n)
	}
}

func TestEventBus_ConcurrentPublish(t *testing.T) {
	bus := NewEventBusWithBuffer(1000)
	defer bus.Close()

	ch, _ := bus.SubscribeAll()

	var wg sync.WaitGroup
	const publishers = 10
	const perPublisher = 50

	for i := 0; i < publishers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < perPublisher; j++ {
				_ = bus.Publish(NewEvent(EventLeadCreated, time.Time{}, nil))
			}
		}()
	}
	wg.Wait()

	// Drain : on doit recevoir publishers * perPublisher événements
	// (buffer 1000 > 500).
	received := 0
	timeout := time.After(500 * time.Millisecond)
loop:
	for {
		select {
		case <-ch:
			received++
			if received == publishers*perPublisher {
				break loop
			}
		case <-timeout:
			break loop
		}
	}
	if received != publishers*perPublisher {
		t.Errorf("attendu %d, obtenu %d", publishers*perPublisher, received)
	}
}