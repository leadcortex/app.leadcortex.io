package domain

// Avatar est une mascotte débloquable par l'apprenant.
//
// 12 avatars au total, en deux tiers :
//   - Classic (6) : progression standard (fin d'un programme, streak…)
//   - Collector (6) : méta-progression (100 % d'une catégorie, secret…)
//
// Le Founding Dolphin est le dernier avatar débloqué : réservé à la
// complétion totale de l'academy.
type Avatar struct {
	// ID — identifiant unique, ex. "eagle", "golden-dolphin".
	ID string

	// Name — nom affiché, ex. "Aigle".
	Name string

	// Tier — tier (classic | collector).
	Tier AvatarTier

	// Description — phrase d'accroche.
	Description string

	// SVGPath — chemin relatif vers le SVG de l'avatar.
	// Ex. "/images/SVG-avatar/classic/Eagle.svg".
	SVGPath string

	// DefaultPose — pose par défaut si pas de pose spécifique requise.
	DefaultPose string

	// Poses — poses disponibles pour cet avatar.
	// Vide = seule la pose par défaut est disponible.
	Poses []AvatarPose

	// UnlockCondition — condition de déblocage (voir ci-dessous).
	Unlock AvatarUnlock
}

// AvatarTier énumère les tiers d'avatar.
type AvatarTier string

const (
	AvatarTierClassic   AvatarTier = "classic"
	AvatarTierCollector AvatarTier = "collector"
)

// AvatarPose décrit une pose spécifique d'un avatar.
//
// En pratique, la pose est un attribut passé au rendu SVG côté React ; le
// backend ne stocke ici que les métadonnées nécessaires à l'UI pour savoir
// quelles poses sont disponibles (et éventuellement les débloquer).
type AvatarPose struct {
	// Key — identifiant de la pose, ex. "curious", "happy".
	Key string
	// Label — libellé affiché.
	Label string
	// IsDefault — vraie pour la pose par défaut.
	IsDefault bool
}

// AvatarUnlock décrit la condition de déblocage d'un avatar.
type AvatarUnlock struct {
	// Kind — type de condition.
	Kind AvatarUnlockKind
	// Value — valeur associée (dépend du Kind).
	Value string
	// Description — texte affiché à l'apprenant quand l'avatar est verrouillé.
	Description string
}

// AvatarUnlockKind énumère les types de conditions de déblocage.
type AvatarUnlockKind string

const (
	// AvatarUnlockProgram — débloqué à la fin d'un programme (Value = ProgramID).
	AvatarUnlockProgram AvatarUnlockKind = "program"
	// AvatarUnlockStreak — débloqué à un streak donné (Value = nombre de jours).
	AvatarUnlockStreak AvatarUnlockKind = "streak"
	// AvatarUnlockLessons — débloqué à un nombre de leçons terminées (Value = nombre).
	AvatarUnlockLessons AvatarUnlockKind = "lessons"
	// AvatarUnlockMissionCount — débloqué à un nombre de missions réussies (Value = nombre).
	AvatarUnlockMissionCount AvatarUnlockKind = "mission_count"
	// AvatarUnlockAllPrograms — débloqué quand tous les programmes du tronc commun sont terminés.
	AvatarUnlockAllPrograms AvatarUnlockKind = "all_programs"
	// AvatarUnlockSecret — condition cachée (non décrite jusqu'au déblocage).
	AvatarUnlockSecret AvatarUnlockKind = "secret"
	// AvatarUnlockFounding — condition spéciale du Founding Dolphin.
	AvatarUnlockFounding AvatarUnlockKind = "founding"
)

// Validate vérifie les invariants.
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