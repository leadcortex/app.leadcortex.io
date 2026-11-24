// backend/academy/internal/domain/badge.go

package domain

import "time"

type Badge struct {
	ID string

	Name string

	Description string

	Icon string

	Color string

	Category BadgeCategory

	Rarity BadgeRarity

	Condition ConditionGroup
}

type BadgeCategory string

const (
	BadgeCategoryProgress BadgeCategory = "progress"
	BadgeCategoryStreak   BadgeCategory = "streak"
	BadgeCategoryMastery  BadgeCategory = "mastery"
	BadgeCategoryMission  BadgeCategory = "mission"
	BadgeCategorySocial   BadgeCategory = "social"
	BadgeCategorySecret   BadgeCategory = "secret"
)

type BadgeRarity string

const (
	BadgeRarityCommon    BadgeRarity = "common"
	BadgeRarityRare      BadgeRarity = "rare"
	BadgeRarityEpic      BadgeRarity = "epic"
	BadgeRarityLegendary BadgeRarity = "legendary"
)

func (b Badge) Validate() error {
	if b.ID == "" {
		return NewValidationError("Badge", "id", "obligatoire")
	}
	if b.Name == "" {
		return NewValidationError("Badge", "name", "obligatoire")
	}
	if b.Description == "" {
		return NewValidationError("Badge", "description", "obligatoire")
	}
	switch b.Category {
	case BadgeCategoryProgress, BadgeCategoryStreak, BadgeCategoryMastery,
		BadgeCategoryMission, BadgeCategorySocial, BadgeCategorySecret:
	default:
		return NewValidationError("Badge", "category", "catégorie inconnue")
	}
	switch b.Rarity {
	case BadgeRarityCommon, BadgeRarityRare, BadgeRarityEpic, BadgeRarityLegendary:
	default:
		return NewValidationError("Badge", "rarity", "rareté inconnue")
	}
	return b.Condition.Validate()
}

type BadgeEarned struct {
	BadgeID  string
	EarnedAt time.Time
}