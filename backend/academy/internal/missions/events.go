// backend/academy/internal/missions/events.go

package missions

import (
	"time"
)

type BusinessEvent interface {
	Kind() string

	At() time.Time

	Payload() map[string]any
}


type GenericEvent struct {
	K          string         `json:"kind"`
	T          time.Time      `json:"at"`
	P          map[string]any `json:"payload,omitempty"`
}

func NewEvent(kind string, at time.Time, payload map[string]any) GenericEvent {
	if at.IsZero() {
		at = time.Now().UTC()
	}
	if payload == nil {
		payload = map[string]any{}
	}
	return GenericEvent{K: kind, T: at, P: payload}
}

func (e GenericEvent) Kind() string            { return e.K }
func (e GenericEvent) At() time.Time           { return e.T }
func (e GenericEvent) Payload() map[string]any { return e.P }

func (e GenericEvent) Validate() error {
	if e.K == "" {
		return ErrInvalidEvent
	}
	return nil
}


const (
	EventLeadCreated       = "lead.created"
	EventLeadUpdated       = "lead.updated"
	EventLeadEnriched      = "lead.enriched"
	EventLeadSaved         = "lead.saved"
	EventCompanyViewed     = "company.viewed"
	EventCompanyCreated    = "company.created"
	EventCompanyEnriched   = "company.enriched"
	EventSequenceCreated   = "sequence.created"
	EventSequenceLaunched  = "sequence.launched"
	EventEmailDrafted      = "email.drafted"
	EventEmailSent         = "email.sent"
	EventCallLogged        = "call.logged"
	EventMeetingScheduled  = "meeting.scheduled"
	EventDealCreated       = "deal.created"
	EventDealMoved         = "deal.moved"
	EventWorkflowCreated   = "workflow.created"
	EventWorkflowLaunched  = "workflow.launched"
	EventListCreated       = "list.created"
	EventFormSubmitted     = "form.submitted"
)