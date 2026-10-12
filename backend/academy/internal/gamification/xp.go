package gamification

import (
	"github.com/leadcortex/academy/internal/domain"
)

// RewardKind énumère les types de récompenses accordées à un palier
// de niveau.
type RewardKind string

const (
	// RewardHearts — cœurs bonus (Amount = nombre de cœurs rendus).
	RewardHearts RewardKind = "hearts"
	// RewardBadge — badge débloqué (Value = BadgeID).
	RewardBadge RewardKind = "badge"
	// RewardAvatar — avatar débloqué (Value = AvatarID).
	RewardAvatar RewardKind = "avatar"
	// RewardTitle — titre cosmétique (Value = titre affiché).
	RewardTitle RewardKind = "title"
)

// Reward décrit une récompense attribuée à un palier de niveau.
type Reward struct {
	Kind   RewardKind `json:"kind"`
	Value  string     `json:"value,omitempty"`
	Amount int        `json:"amount,omitempty"`
}

// levelRewards — table des récompenses par niveau atteint.
//
// Seuls les niveaux présents dans cette table déclenchent une récompense.
// Un niveau absent ne donne rien de spécial (montée de niveau silencieuse).
//
// La progression est volontairement généreuse sur les 10 premiers niveaux
// (badges, avatars) puis plus rare pour garder l'attrait du long terme.
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

// RewardsForLevel renvoie les récompenses exactes d'un niveau donné.
// Renvoie une slice vide si le niveau n'a pas de récompense.
func RewardsForLevel(level int) []Reward {
	if r, ok := levelRewards[level]; ok {
		// Copie défensive pour ne jamais exposer la table interne.
		out := make([]Reward, len(r))
		copy(out, r)
		return out
	}
	return nil
}

// RewardsForLevelRange renvoie les récompenses attribuées lors d'un
// passage de `oldLevel` à `newLevel` (bornes incluses).
//
// Utilisé par progress.Engine après chaque gain d'XP pour savoir ce qui
// doit être attribué.
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

// XPProgress décrit la progression d'un Learner à l'intérieur de son
// niveau courant, prête à être affichée dans l'UI.
type XPProgress struct {
	CurrentLevel     int     `json:"current_level"`
	CurrentXP        int     `json:"current_xp"`
	LevelFloorXP     int     `json:"level_floor_xp"`
	NextLevelXP      int     `json:"next_level_xp"`
	XPIntoLevel      int     `json:"xp_into_level"`
	XPForNextLevel   int     `json:"xp_for_next_level"`
	RatioIntoLevel   float64 `json:"ratio_into_level"` // 0-1
	IsMaxLevel       bool    `json:"is_max_level"`
}

// XPProgressFor calcule la progression d'un Learner dans son niveau.
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