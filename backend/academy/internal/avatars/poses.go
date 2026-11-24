// backend/academy/internal/avatars/poses.go

package avatars

import (
	"fmt"

	"github.com/leadcortex/academy/internal/domain"
)

const DefaultPoseKey = "neutral"

func PosesFor(avatarID string) ([]domain.AvatarPose, error) {
	a, ok := Find(avatarID)
	if !ok {
		return nil, fmt.Errorf("%w : %s", ErrUnknownAvatar, avatarID)
	}
	out := make([]domain.AvatarPose, len(a.Poses))
	copy(out, a.Poses)
	return out, nil
}

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

func IsFoundingAvatar(avatarID string) bool {
	a, ok := Find(avatarID)
	if !ok {
		return false
	}
	return a.Unlock.Kind == domain.AvatarUnlockFounding
}