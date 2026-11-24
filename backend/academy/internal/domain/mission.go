// backend/academy/internal/domain/mission.go

package domain

type Mission struct {
	ID string

	LessonID string

	Title string

	BriefMD string

	Target MissionTarget

	Validation MissionValidation

	OnSuccess MissionOnSuccess

	OnFailure MissionOnFailure

	HintAfterMinutes int

	RetryAllowed bool
}

type MissionTarget struct {
	Route string
	CTA string
}

type MissionValidation struct {
	Trigger string

	Conditions ConditionGroup
}

type MissionOnSuccess struct {
	XP int
	MascotLine string
	UnlocksMissionIDs []string
	UnlocksAvatarIDs []string
	BadgeIDs []string
}

type MissionOnFailure struct {
	FeedbackMD string
	HintMD string
}

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

type MissionStatus string

const (
	MissionStatusLocked      MissionStatus = "locked"
	MissionStatusAvailable   MissionStatus = "available"
	MissionStatusInProgress  MissionStatus = "in_progress"
	MissionStatusCompleted   MissionStatus = "completed"
	MissionStatusFailed      MissionStatus = "failed"
	MissionStatusSkipped     MissionStatus = "skipped"
)

type MissionProgress struct {
	MissionID string
	Status    MissionStatus

	Attempts int

	StartedAt interface{ IsZero() bool }

	CompletedAt interface{ IsZero() bool }

	LastEventPayload map[string]any
}