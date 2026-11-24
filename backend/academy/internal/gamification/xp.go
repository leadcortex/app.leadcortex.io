// backend/academy/internal/gamification/xp.go

package gamification

import (
	"github.com/leadcortex/academy/internal/domain"
)

type RewardKind string

const (
	RewardHearts RewardKind = "hearts"
	RewardBadge RewardKind = "badge"
	RewardAvatar RewardKind = "avatar"
	RewardTitle RewardKind = "title"
)

type Reward struct {
	Kind   RewardKind `json:"kind"`
	Value  string     `json:"value,omitempty"`
	Amount int        `json:"amount,omitempty"`
}

var levelRewards = map[int][]Reward{
	2:  {{Kind: RewardTitle, Value: "Apprenti"}},
	3:  {{Kind: RewardHearts, Amount: 1}},
	5:  {{Kind: RewardBadge, Value: "level-5"}, {Kind: RewardTitle, Value: "Prospecteur"}},
	7:  {{Kind: RewardAvatar, Value: "eagle"}},
	10: {{Kind: RewardBadge, Value: "level-10"}, {Kind: RewardTitle, Value: "Chasseur"}},
	15: {{Kind: RewardAvatar, Value: "wolf"}},
	20: {{Kind: RewardBadge, Value: "level-20"}, {Kind: RewardTitle, Value: "Stratège"}},
	30: {{Kind: RewardBadge, Value: "level-30"}, {Kind: RewardTitle, Value: "Vétéran"}},
	50: {{Kind: RewardBadge, Value: "level-50"}, {Kind: RewardTitle, Value: "Maître"}},
}

func RewardsForLevel(level int) []Reward {
	if r, ok := levelRewards[level]; ok {
		out := make([]Reward, len(r))
		copy(out, r)
		return out
	}
	return nil
}

func RewardsForLevelRange(oldLevel, newLevel int) []Reward {
	if newLevel <= oldLevel {
		return nil
	}
	var out []Reward
	for lvl := oldLevel + 1; lvl <= newLevel; lvl++ {
		out = append(out, RewardsForLevel(lvl)...)
	}
	return out
}

type XPProgress struct {
	CurrentLevel     int     `json:"current_level"`
	CurrentXP        int     `json:"current_xp"`
	LevelFloorXP     int     `json:"level_floor_xp"`
	NextLevelXP      int     `json:"next_level_xp"`
	XPIntoLevel      int     `json:"xp_into_level"`
	XPForNextLevel   int     `json:"xp_for_next_level"`
	RatioIntoLevel   float64 `json:"ratio_into_level"`
	IsMaxLevel       bool    `json:"is_max_level"`
}

func XPProgressFor(xp int) XPProgress {
	level := domain.LevelFromXP(xp)
	floor := domain.XPForLevel(level)
	next := domain.XPForLevel(level + 1)

	p := XPProgress{
		CurrentLevel: level,
		CurrentXP:    xp,
		LevelFloorXP: floor,
		NextLevelXP:  next,
		XPIntoLevel:  xp - floor,
	}
	if next > floor {
		p.XPForNextLevel = next - floor
		p.RatioIntoLevel = float64(xp-floor) / float64(next-floor)
		if p.RatioIntoLevel > 1 {
			p.RatioIntoLevel = 1
		}
		if p.RatioIntoLevel < 0 {
			p.RatioIntoLevel = 0
		}
	} else {
		p.IsMaxLevel = true
		p.RatioIntoLevel = 1
	}
	return p
}