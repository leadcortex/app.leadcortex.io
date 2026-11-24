// backend/academy/internal/avatars/pipeline.go

package avatars

import (
	"fmt"
	"strings"

	"github.com/leadcortex/academy/internal/domain"
)

func AssetURL(avatarID, poseKey string) (string, error) {
	a, ok := Find(avatarID)
	if !ok {
		return "", fmt.Errorf("%w : %s", ErrUnknownAvatar, avatarID)
	}
	pose := ResolvePose(avatarID, poseKey)
	base := strings.TrimSuffix(a.SVGPath, "/")
	return base + "#" + pose, nil
}

type TierStyle struct {
	Key domain.AvatarTier

	Label string

	AccentColor string

	BackgroundGradient string

	HasGlow bool

	HasStar bool
}

var TierStyles = map[domain.AvatarTier]TierStyle{
	domain.AvatarTierClassic: {
		Key:                domain.AvatarTierClassic,
		Label:              "Classique",
		AccentColor:        "#3186FF",
		BackgroundGradient: "linear-gradient(135deg, #F0F5FF 0%, #FFFFFF 100%)",
		HasGlow:            false,
		HasStar:            false,
	},
	domain.AvatarTierCollector: {
		Key:                domain.AvatarTierCollector,
		Label:              "Collection",
		AccentColor:        "#F5A623",
		BackgroundGradient: "linear-gradient(135deg, #FFF7E6 0%, #FFFDF7 100%)",
		HasGlow:            true,
		HasStar:            false,
	},
}

func StyleFor(tier domain.AvatarTier) TierStyle {
	if s, ok := TierStyles[tier]; ok {
		return s
	}
	return TierStyles[domain.AvatarTierClassic]
}

func StyleForAvatar(avatarID string) (TierStyle, error) {
	a, ok := Find(avatarID)
	if !ok {
		return TierStyle{}, fmt.Errorf("%w : %s", ErrUnknownAvatar, avatarID)
	}
	style := StyleFor(a.Tier)
	if a.Unlock.Kind == domain.AvatarUnlockFounding {
		style.HasStar = true
		style.AccentColor = "#FFD166"
	}
	return style, nil
}

type Render struct {
	AvatarID    string `json:"avatar_id"`
	Name        string `json:"name"`
	Tier        string `json:"tier"`
	Description string `json:"description"`
	PoseKey     string `json:"pose_key"`
	PoseLabel   string `json:"pose_label"`
	AssetURL    string `json:"asset_url"`
	AccentColor string `json:"accent_color"`
	Gradient    string `json:"gradient"`
	HasGlow     bool   `json:"has_glow"`
	HasStar     bool   `json:"has_star"`
	Unlocked    bool   `json:"unlocked"`
	Equipped    bool   `json:"equipped"`
}

func BuildRender(avatarID, poseKey string, learner *domain.Learner) (Render, error) {
	a, ok := Find(avatarID)
	if !ok {
		return Render{}, fmt.Errorf("%w : %s", ErrUnknownAvatar, avatarID)
	}
	style, err := StyleForAvatar(avatarID)
	if err != nil {
		return Render{}, err
	}
	url, err := AssetURL(avatarID, poseKey)
	if err != nil {
		return Render{}, err
	}

	resolvedPose := ResolvePose(avatarID, poseKey)
	poseLabel := resolvedPose
	for _, p := range a.Poses {
		if p.Key == resolvedPose {
			poseLabel = p.Label
			break
		}
	}

	r := Render{
		AvatarID:    a.ID,
		Name:        a.Name,
		Tier:        string(a.Tier),
		Description: a.Description,
		PoseKey:     resolvedPose,
		PoseLabel:   poseLabel,
		AssetURL:    url,
		AccentColor: style.AccentColor,
		Gradient:    style.BackgroundGradient,
		HasGlow:     style.HasGlow,
		HasStar:     style.HasStar,
	}

	if learner != nil {
		r.Unlocked = containsID(learner.UnlockedAvatarIDs, a.ID)
		r.Equipped = learner.EquippedAvatarID == a.ID
	}
	return r, nil
}

func BuildCatalog(learner *domain.Learner) []Render {
	initCatalog()
	out := make([]Render, 0, len(catalogList))
	for _, a := range catalogList {
		r, err := BuildRender(a.ID, a.DefaultPose, learner)
		if err != nil {
			continue
		}
		out = append(out, r)
	}
	return out
}

func containsID(xs []string, id string) bool {
	for _, x := range xs {
		if x == id {
			return true
		}
	}
	return false
}