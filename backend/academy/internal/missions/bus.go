// backend/academy/internal/missions/bus.go

package missions

import (
	"fmt"
	"sync"
)

type EventBus struct {
	mu          sync.RWMutex
	subscribers map[string][]chan BusinessEvent
	all         []chan BusinessEvent
	closed      bool

	bufferSize int
}

func NewEventBus() *EventBus {
	return &EventBus{
		subscribers: make(map[string][]chan BusinessEvent),
		bufferSize:  32,
	}
}

func NewEventBusWithBuffer(size int) *EventBus {
	if size <= 0 {
		size = 32
	}
	return &EventBus{
		subscribers: make(map[string][]chan BusinessEvent),
		bufferSize:  size,
	}
}


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

func (b *EventBus) Unsubscribe(ch <-chan BusinessEvent) bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.removeLocked(ch)
}

func (b *EventBus) removeLocked(ch <-chan BusinessEvent) bool {
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
	for i, c := range b.all {
		if c == ch {
			b.all = append(b.all[:i], b.all[i+1:]...)
			return true
		}
	}
	return false
}


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

	for _, ch := range b.subscribers[event.Kind()] {
		select {
		case ch <- event:
		default:
		}
	}

	for _, ch := range b.all {
		select {
		case ch <- event:
		default:
		}
	}
	return nil
}


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

func (b *EventBus) IsClosed() bool {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return b.closed
}

func (b *EventBus) SubscriberCount() int {
	b.mu.RLock()
	defer b.mu.RUnlock()
	n := len(b.all)
	for _, chans := range b.subscribers {
		n += len(chans)
	}
	return n
}