package domain

import "time"

// Badge est une distinction décernée à un apprenant sous condition.
type Badge struct {
	// ID — identifiant unique, ex. "first-steps".
	ID string

	// Name — nom affiché.
	Name string

	// Description — phrase descriptive.
	Description string

	// Icon — nom logique d'icône (résolu côté UI).
	Icon string

	// Color — couleur d'accent (optionnel).
	Color string

	// Category — catégorie du badge (progression, social, streak…).
	Category BadgeCategory

	// Rarity — rareté (commun, rare, épique, légendaire).
	Rarity BadgeRarity

	// Condition — condition de déblocage.
	Condition ConditionGroup
}

// BadgeCategory énumère les catégories de badges.
type BadgeCategory string

const (
	BadgeCategoryProgress BadgeCategory = "progress" // leçons terminées
	BadgeCategoryStreak   BadgeCategory = "streak"   // jours consécutifs
	BadgeCategoryMastery  BadgeCategory = "mastery"  // maîtrise de concepts
	BadgeCategoryMission  BadgeCategory = "mission"  // missions réussies
	BadgeCategorySocial   BadgeCategory = "social"   // partage, aide…
	BadgeCategorySecret   BadgeCategory = "secret"   // caché jusqu'au déblocage
)

// BadgeRarity énumère les niveaux de rareté.
type BadgeRarity string

const (
	BadgeRarityCommon    BadgeRarity = "common"
	BadgeRarityRare      BadgeRarity = "rare"
	BadgeRarityEpic      BadgeRarity = "epic"
	BadgeRarityLegendary BadgeRarity = "legendary"
)

// Validate vérifie les invariants.
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

// BadgeEarned représente l'obtention d'un badge par un apprenant.
type BadgeEarned struct {
	BadgeID  string
	EarnedAt time.Time
}