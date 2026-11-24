// backend/academy/internal/domain/avatar.go

package domain

type Avatar struct {
	ID string

	Name string

	Tier AvatarTier

	Description string

	SVGPath string

	DefaultPose string

	Poses []AvatarPose

	Unlock AvatarUnlock
}

type AvatarTier string

const (
	AvatarTierClassic   AvatarTier = "classic"
	AvatarTierCollector AvatarTier = "collector"
)

type AvatarPose struct {
	Key string
	Label string
	IsDefault bool
}

type AvatarUnlock struct {
	Kind AvatarUnlockKind
	Value string
	Description string
}

type AvatarUnlockKind string

const (
	AvatarUnlockProgram AvatarUnlockKind = "program"
	AvatarUnlockStreak AvatarUnlockKind = "streak"
	AvatarUnlockLessons AvatarUnlockKind = "lessons"
	AvatarUnlockMissionCount AvatarUnlockKind = "mission_count"
	AvatarUnlockAllPrograms AvatarUnlockKind = "all_programs"
	AvatarUnlockSecret AvatarUnlockKind = "secret"
	AvatarUnlockFounding AvatarUnlockKind = "founding"
)

func (a Avatar) Validate() error {
	if a.ID == "" {
		return NewValidationError("Avatar", "id", "obligatoire")
	}
	if a.Name == "" {
		return NewValidationError("Avatar", "name", "obligatoire")
	}
	switch a.Tier {
	case AvatarTierClassic, AvatarTierCollector:
	default:
		return NewValidationError("Avatar", "tier", "tier inconnu")
	}
	if a.SVGPath == "" {
		return NewValidationError("Avatar", "svg_path", "obligatoire")
	}
	switch a.Unlock.Kind {
	case AvatarUnlockProgram, AvatarUnlockStreak, AvatarUnlockLessons,
		AvatarUnlockMissionCount, AvatarUnlockAllPrograms,
		AvatarUnlockSecret, AvatarUnlockFounding:
	default:
		return NewValidationError("Avatar", "unlock.kind", "type de déblocage inconnu")
	}
	if a.Unlock.Description == "" {
		return NewValidationError("Avatar", "unlock.description", "obligatoire")
	}
	return nil
}