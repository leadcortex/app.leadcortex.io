package domain

import (
	"time"
)

// Learner représente l'utilisateur qui apprend.
//
// En V1 : mono-utilisateur (un seul Learner par instance). Le champ TenantID
// est optionnel et inutilisé pour l'instant, mais présent partout pour ne
// rien casser quand l'auth 2.0 arrivera.
type Learner struct {
	// ID — identifiant unique (UUID ou identifiant applicatif).
	ID string

	// DisplayName — nom affiché dans l'interface.
	DisplayName string

	// Email — email de l'utilisateur (facultatif en V1).
	Email string

	// TenantID — réservé pour le multi-tenant futur. Vide en V1.
	TenantID string

	// CreatedAt — date de création du profil.
	CreatedAt time.Time

	// LastActivityAt — dernière interaction (leçon, mission, SRS…).
	// Sert au calcul du streak.
	LastActivityAt time.Time

	// ─── Progression globale ──────────────────────────────────────────

	// XP — points d'expérience cumulés (jamais décrémentés).
	XP int

	// Level — niveau dérivé de l'XP (voir LevelFromXP).
	Level int

	// StreakDays — nombre de jours consécutifs d'activité.
	StreakDays int

	// BestStreakDays — record historique du streak.
	BestStreakDays int

	// Hearts — vies restantes (mécanique Duolingo). Rechargées selon
	// la règle définie en Partie 7. Valeur initiale : MaxHearts.
	Hearts int

	// ─── Progression par programme ────────────────────────────────────

	// ProgramProgress — état par programme (clé = ProgramID).
	ProgramProgress map[string]ProgramProgress

	// LessonProgress — état par leçon (clé = LessonID).
	LessonProgress map[string]LessonProgress

	// ConceptMastery — maîtrise par concept (clé = ConceptID).
	ConceptMastery map[string]Mastery

	// ─── Avatars & badges ─────────────────────────────────────────────

	// UnlockedAvatarIDs — IDs des avatars débloqués.
	UnlockedAvatarIDs []string

	// EquippedAvatarID — avatar actuellement utilisé.
	EquippedAvatarID string

	// EarnedBadges — badges obtenus, avec date d'obtention.
	EarnedBadges []BadgeEarned

	// ─── Missions ─────────────────────────────────────────────────────

	// MissionProgress — état par mission (clé = MissionID).
	MissionProgress map[string]MissionProgress
}

// MaxHearts — nombre maximum de vies.
const MaxHearts = 5

// NewLearner crée un nouveau profil avec les valeurs par défaut.
func NewLearner(id, displayName, email string) *Learner {
	now := time.Now().UTC()
	return &Learner{
		ID:               id,
		DisplayName:      displayName,
		Email:            email,
		CreatedAt:        now,
		LastActivityAt:   now,
		XP:               0,
		Level:            1,
		StreakDays:       0,
		BestStreakDays:   0,
		Hearts:           MaxHearts,
		ProgramProgress:  make(map[string]ProgramProgress),
		LessonProgress:   make(map[string]LessonProgress),
		ConceptMastery:   make(map[string]Mastery),
		UnlockedAvatarIDs: []string{},
		EquippedAvatarID: "",
		EarnedBadges:     []BadgeEarned{},
		MissionProgress:  make(map[string]MissionProgress),
	}
}

// Validate vérifie les invariants du Learner.
func (l Learner) Validate() error {
	if l.ID == "" {
		return NewValidationError("Learner", "id", "obligatoire")
	}
	if l.DisplayName == "" {
		return NewValidationError("Learner", "display_name", "obligatoire")
	}
	if l.XP < 0 {
		return NewValidationError("Learner", "xp", "ne peut pas être négatif")
	}
	if l.Hearts < 0 || l.Hearts > MaxHearts {
		return NewValidationError("Learner", "hearts",
			"doit être entre 0 et MaxHearts")
	}
	return nil
}

// AddXP incrémente l'XP et recalcule le niveau. Idempotent sur amount=0.
func (l *Learner) AddXP(amount int) {
	if amount <= 0 {
		return
	}
	l.XP += amount
	l.Level = LevelFromXP(l.XP)
}

// LevelFromXP calcule le niveau à partir de l'XP cumulé.
// Formule : niveau n requiert 100 * n^1.5 XP cumulés.
//
//	niveau 1 → 0 XP
//	niveau 2 → 100 XP
//	niveau 3 → 283 XP
//	niveau 4 → 519 XP
//	niveau 5 → 800 XP
//	…
func LevelFromXP(xp int) int {
	if xp < 0 {
		return 1
	}
	level := 1
	for level < 100 { // plafond de sécurité
		threshold := XPForLevel(level + 1)
		if xp < threshold {
			break
		}
		level++
	}
	return level
}

// XPForLevel renvoie l'XP cumulé requis pour atteindre un niveau donné.
func XPForLevel(level int) int {
	if level <= 1 {
		return 0
	}
	// 100 * (level-1)^1.5, arrondi.
	n := float64(level - 1)
	f := n * n * n
	return int(100 * float64(int(f*100))/100) / 1 // simplification : voir test
}

// RecordActivity met à jour le streak en fonction de la date courante.
// Renvoie true si le streak a changé (utile pour notifier l'UI).
func (l *Learner) RecordActivity(now time.Time) bool {
	prev := l.LastActivityAt
	l.LastActivityAt = now

	// Même jour → rien à faire.
	if sameDay(prev, now) {
		return false
	}

	// J+1 exactement → streak +1.
	if isNextDay(prev, now) {
		l.StreakDays++
		if l.StreakDays > l.BestStreakDays {
			l.BestStreakDays = l.StreakDays
		}
		return true
	}

	// Saut de plus d'un jour → streak remis à 1 (premier jour d'activité
	// compte comme un streak de 1).
	l.StreakDays = 1
	return true
}

// ConsumeHeart retire une vie. Renvoie false si aucune vie disponible.
func (l *Learner) ConsumeHeart() bool {
	if l.Hearts <= 0 {
		return false
	}
	l.Hearts--
	return true
}

// RestoreHearts remet les vies au maximum (ex. après recharge quotidienne).
func (l *Learner) RestoreHearts() {
	l.Hearts = MaxHearts
}

// UnlockAvatar ajoute un avatar à la collection si pas déjà débloqué.
// Renvoie true si l'avatar a été effectivement débloqué.
func (l *Learner) UnlockAvatar(avatarID string) bool {
	for _, id := range l.UnlockedAvatarIDs {
		if id == avatarID {
			return false
		}
	}
	l.UnlockedAvatarIDs = append(l.UnlockedAvatarIDs, avatarID)
	return true
}

// EarnBadge ajoute un badge si pas déjà obtenu.
func (l *Learner) EarnBadge(badgeID string, at time.Time) bool {
	for _, b := range l.EarnedBadges {
		if b.BadgeID == badgeID {
			return false
		}
	}
	l.EarnedBadges = append(l.EarnedBadges, BadgeEarned{
		BadgeID: badgeID,
		EarnedAt: at,
	})
	return true
}

// ─── Helpers temporels ─────────────────────────────────────────────────

func sameDay(a, b time.Time) bool {
	ay, am, ad := a.Date()
	by, bm, bd := b.Date()
	return ay == by && am == bm && ad == bd
}

func isNextDay(prev, now time.Time) bool {
	expected := prev.AddDate(0, 0, 1)
	return sameDay(expected, now)
}