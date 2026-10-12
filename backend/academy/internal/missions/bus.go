package missions

import (
	"fmt"
	"sync"
)

// EventBus est un pub/sub typé, thread-safe, à canaux buffered.
//
// Les abonnés peuvent souscrire à un Kind précis (Subscribe) ou à tous
// les événements (SubscribeAll). Le bus distribue chaque événement de
// façon non bloquante : si le canal d'un abonné est plein, l'événement
// est perdu pour cet abonné (mais reste envoyé aux autres).
//
// # Cycle de vie
//
//	bus := NewEventBus()
//	ch := bus.Subscribe(EventLeadCreated)
//	defer bus.Close() // ferme tous les canaux
//
//	for ev := range ch {
//	    // traiter
//	}
//
// Un bus fermé refuse toute nouvelle publication et toute nouvelle
// souscription.
type EventBus struct {
	mu          sync.RWMutex
	subscribers map[string][]chan BusinessEvent // par Kind
	all         []chan BusinessEvent             // abonnés "tous kinds"
	closed      bool

	// bufferSize — capacité des canaux créés pour les abonnés.
	bufferSize int
}

// NewEventBus crée un bus avec la capacité de buffer par défaut (32).
func NewEventBus() *EventBus {
	return &EventBus{
		subscribers: make(map[string][]chan BusinessEvent),
		bufferSize:  32,
	}
}

// NewEventBusWithBuffer crée un bus avec une capacité explicite.
// Une valeur <= 0 utilise la valeur par défaut.
func NewEventBusWithBuffer(size int) *EventBus {
	if size <= 0 {
		size = 32
	}
	return &EventBus{
		subscribers: make(map[string][]chan BusinessEvent),
		bufferSize:  size,
	}
}

/* ─── Souscription ────────────────────────────────────────────────────── */

// Subscribe abonne le caller aux événements du Kind donné.
//
// Retourne un canal en lecture seule. Le canal est fermé quand le bus
// est fermé via Close.
func (b *EventBus) Subscribe(kind string) (<-chan BusinessEvent, error) {
	if kind == "" {
		return nil, fmt.Errorf("%w : kind vide", ErrInvalidEvent)
	}
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.closed {
		return nil, ErrBusClosed
	}
	ch := make(chan BusinessEvent, b.bufferSize)
	b.subscribers[kind] = append(b.subscribers[kind], ch)
	return ch, nil
}

// SubscribeAll abonne le caller à tous les événements, quel que soit
// leur Kind.
func (b *EventBus) SubscribeAll() (<-chan BusinessEvent, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.closed {
		return nil, ErrBusClosed
	}
	ch := make(chan BusinessEvent, b.bufferSize)
	b.all = append(b.all, ch)
	return ch, nil
}

// Unsubscribe retire un canal précédemment abonné.
//
// Retourne vrai si le canal a été trouvé et retiré. Le canal n'est PAS
// fermé par cette méthode : c'est au caller de le gérer ou au bus lors
// du Close global.
func (b *EventBus) Unsubscribe(ch <-chan BusinessEvent) bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.removeLocked(ch)
}

// removeLocked retire un canal des abonnés. Doit être appelé sous verrou.
func (b *EventBus) removeLocked(ch <-chan BusinessEvent) bool {
	// Parcours des abonnés par Kind.
	for kind, chans := range b.subscribers {
		for i, c := range chans {
			if c == ch {
				b.subscribers[kind] = append(chans[:i], chans[i+1:]...)
				if len(b.subscribers[kind]) == 0 {
					delete(b.subscribers, kind)
				}
				return true
			}
		}
	}
	// Parcours des abonnés "tous".
	for i, c := range b.all {
		if c == ch {
			b.all = append(b.all[:i], b.all[i+1:]...)
			return true
		}
	}
	return false
}

/* ─── Publication ─────────────────────────────────────────────────────── */

// Publish diffuse un événement à tous les abonnés intéressés.
//
// La diffusion est non bloquante : si le canal d'un abonné est plein,
// l'événement est silencieusement ignoré pour cet abonné. Publish
// retourne une erreur seulement si le bus est fermé ou si l'événement
// est nil.
func (b *EventBus) Publish(event BusinessEvent) error {
	if event == nil {
		return fmt.Errorf("%w : nil", ErrInvalidEvent)
	}
	if event.Kind() == "" {
		return fmt.Errorf("%w : kind vide", ErrInvalidEvent)
	}

	b.mu.RLock()
	defer b.mu.RUnlock()
	if b.closed {
		return ErrBusClosed
	}

	// Diffusion aux abonnés du Kind.
	for _, ch := range b.subscribers[event.Kind()] {
		select {
		case ch <- event:
		default:
			// Canal plein : on perd l'événement pour cet abonné.
		}
	}

	// Diffusion aux abonnés "tous kinds".
	for _, ch := range b.all {
		select {
		case ch <- event:
		default:
		}
	}
	return nil
}

/* ─── Fermeture ───────────────────────────────────────────────────────── */

// Close ferme tous les canaux des abonnés et empêche toute nouvelle
// publication ou souscription. Idempotent.
func (b *EventBus) Close() {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.closed {
		return
	}
	b.closed = true
	for _, chans := range b.subscribers {
		for _, ch := range chans {
			close(ch)
		}
	}
	for _, ch := range b.all {
		close(ch)
	}
	b.subscribers = nil
	b.all = nil
}

// IsClosed retourne vrai si le bus a été fermé.
func (b *EventBus) IsClosed() bool {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return b.closed
}

// SubscriberCount retourne le nombre d'abonnés actifs.
func (b *EventBus) SubscriberCount() int {
	b.mu.RLock()
	defer b.mu.RUnlock()
	n := len(b.all)
	for _, chans := range b.subscribers {
		n += len(chans)
	}
	return n
}