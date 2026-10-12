package avatars

import (
	"fmt"

	"github.com/leadcortex/academy/internal/domain"
)

// DefaultPoseKey — clé de la pose par défaut.
const DefaultPoseKey = "neutral"

// PosesFor renvoie les poses disponibles d'un avatar.
func PosesFor(avatarID string) ([]domain.AvatarPose, error) {
	a, ok := Find(avatarID)
	if !ok {
		return nil, fmt.Errorf("%w : %s", ErrUnknownAvatar, avatarID)
	}
	out := make([]domain.AvatarPose, len(a.Poses))
	copy(out, a.Poses)
	return out, nil
}

// HasPose indique si une pose donnée existe pour un avatar.
func HasPose(avatarID, poseKey string) bool {
	a, ok := Find(avatarID)
	if !ok {
		return false
	}
	for _, p := range a.Poses {
		if p.Key == poseKey {
			return true
		}
	}
	return false
}

// ResolvePose retourne la pose demandée si elle existe, sinon la pose
// par défaut de l'avatar. Utilisé par le pipeline pour éviter les
// erreurs de rendu.
func ResolvePose(avatarID, requested string) string {
	a, ok := Find(avatarID)
	if !ok {
		return DefaultPoseKey
	}
	if requested == "" {
		return a.DefaultPose
	}
	for _, p := range a.Poses {
		if p.Key == requested {
			return p.Key
		}
	}
	return a.DefaultPose
}

// IsFoundingAvatar — raccourci pour savoir si un avatar est le dauphin
// fondateur.
func IsFoundingAvatar(avatarID string) bool {
	a, ok := Find(avatarID)
	if !ok {
		return false
	}
	return a.Unlock.Kind == domain.AvatarUnlockFounding
}