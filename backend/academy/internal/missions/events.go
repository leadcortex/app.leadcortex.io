package missions

import (
	"time"
)

// BusinessEvent est un événement métier provenant de l'app LeadCortex.
//
// Un événement porte un Kind (ex. "lead.created"), un Timestamp, et un
// Payload arbitraire (souvent une map[string]any représentant l'entité
// créée ou modifiée).
type BusinessEvent interface {
	// Kind — identifiant du type d'événement, ex. "lead.created".
	Kind() string

	// At — instant d'occurrence (UTC).
	At() time.Time

	// Payload — données additionnelles (map aplatie au besoin).
	// Peut être nil.
	Payload() map[string]any
}

/* ─── Implémentation générique ────────────────────────────────────────── */

// GenericEvent est une implémentation concrète de BusinessEvent,
// utilisable pour tous les cas standard.
type GenericEvent struct {
	K          string         `json:"kind"`
	T          time.Time      `json:"at"`
	P          map[string]any `json:"payload,omitempty"`
}

// NewEvent construit un GenericEvent.
//
// Si `at` est zéro, l'instant courant UTC est utilisé. Si `payload` est
// nil, une map vide est utilisée.
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

// Validate vérifie les invariants de base d'un événement.
func (e GenericEvent) Validate() error {
	if e.K == "" {
		return ErrInvalidEvent
	}
	return nil
}

/* ─── Kinds standard ──────────────────────────────────────────────────── */

// Kinds standard utilisés par les programmes YAML.
//
// Cette liste n'est pas exhaustive : tout Kind arbitraire peut être
// publié sur le bus. Elle sert de référence documentaire pour les
// auteurs de contenu.
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