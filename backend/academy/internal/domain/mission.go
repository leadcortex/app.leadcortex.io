package domain

// Mission est une action in-app que l'apprenant doit exécuter pour valider
// une leçon. C'est le cœur différenciant de LeadCortex Academy : au lieu de
// répondre à des questions abstraites, l'apprenant agit réellement dans l'app.
type Mission struct {
	// ID — identifiant stable, ex. "mission-create-first-lead".
	ID string

	// LessonID — leçon à laquelle cette mission appartient.
	LessonID string

	// Title — titre affiché.
	Title string

	// BriefMD — brief détaillé (Markdown).
	BriefMD string

	// Target — route et CTA vers la page de l'app où exécuter la mission.
	Target MissionTarget

	// Validation — condition(s) qui doivent passer pour réussir.
	Validation MissionValidation

	// OnSuccess — récompenses et feedback en cas de réussite.
	OnSuccess MissionOnSuccess

	// OnFailure — feedback en cas d'échec.
	OnFailure MissionOnFailure

	// HintAfterMinutes — délai avant affichage d'un indice (0 = jamais).
	HintAfterMinutes int

	// RetryAllowed — si false, la mission ne peut être tentée qu'une fois.
	RetryAllowed bool
}

// MissionTarget pointe vers l'écran où exécuter la mission.
type MissionTarget struct {
	// Route — route de l'app, ex. "/app/people/new".
	Route string
	// CTA — libellé du bouton, ex. "Ouvrir Prospects".
	CTA string
}

// MissionValidation décrit comment valider la réussite d'une mission.
type MissionValidation struct {
	// Trigger — type d'événement métier attendu, ex. "lead.created".
	// Ce champ est optionnel : si vide, la validation se fait uniquement
	// via Conditions sur l'état courant de l'app.
	Trigger string

	// Conditions — conditions à satisfaire sur le payload de l'événement
	// ou sur l'état courant de l'app.
	Conditions ConditionGroup
}

// MissionOnSuccess décrit les récompenses et le feedback en cas de réussite.
type MissionOnSuccess struct {
	// XP — XP gagnée.
	XP int
	// MascotLine — phrase affichée par la mascotte.
	MascotLine string
	// UnlocksMissionIDs — missions débloquées par celle-ci.
	UnlocksMissionIDs []string
	// UnlocksAvatarIDs — avatars débloqués.
	UnlocksAvatarIDs []string
	// BadgeIDs — badges accordés.
	BadgeIDs []string
}

// MissionOnFailure décrit le feedback en cas d'échec.
type MissionOnFailure struct {
	// FeedbackMD — message affiché à l'apprenant.
	FeedbackMD string
	// HintMD — indice affiché après HintAfterMinutes.
	HintMD string
}

// Validate vérifie les invariants de la mission.
func (m Mission) Validate() error {
	if m.ID == "" {
		return NewValidationError("Mission", "id", "obligatoire")
	}
	if m.LessonID == "" {
		return NewValidationError("Mission", "lesson_id", "obligatoire")
	}
	if m.Title == "" {
		return NewValidationError("Mission", "title", "obligatoire")
	}
	if m.BriefMD == "" {
		return NewValidationError("Mission", "brief_md", "obligatoire")
	}
	if m.Target.Route == "" {
		return NewValidationError("Mission", "target.route", "obligatoire")
	}
	if m.Target.CTA == "" {
		return NewValidationError("Mission", "target.cta", "obligatoire")
	}
	if err := m.Validation.Conditions.Validate(); err != nil {
		return err
	}
	if m.Validation.Conditions.IsEmpty() && m.Validation.Trigger == "" {
		return NewValidationError("Mission", "validation",
			"au moins un trigger ou une condition requis")
	}
	if m.OnSuccess.XP < 0 {
		return NewValidationError("Mission", "on_success.xp", "ne peut pas être négatif")
	}
	return nil
}

// MissionStatus décrit l'état d'une mission pour un apprenant.
type MissionStatus string

const (
	MissionStatusLocked      MissionStatus = "locked"
	MissionStatusAvailable   MissionStatus = "available"
	MissionStatusInProgress  MissionStatus = "in_progress"
	MissionStatusCompleted   MissionStatus = "completed"
	MissionStatusFailed      MissionStatus = "failed"
	MissionStatusSkipped     MissionStatus = "skipped"
)

// MissionProgress est l'état d'une mission pour un apprenant.
type MissionProgress struct {
	MissionID string
	Status    MissionStatus

	// Attempts — nombre de tentatives.
	Attempts int

	// StartedAt — début de la première tentative.
	StartedAt interface{ IsZero() bool }

	// CompletedAt — réussite (si status == completed).
	CompletedAt interface{ IsZero() bool }

	// LastEventPayload — dernier événement reçu (utile pour le debug).
	LastEventPayload map[string]any
}