package progress

import "time"

// EventType identifie le type d'un événement métier.
type EventType string

const (
	// Événements de leçon.
	EventLessonStarted   EventType = "lesson.started"
	EventLessonBlockView EventType = "lesson.block.viewed"
	EventLessonCompleted EventType = "lesson.completed"
	EventLessonMastered  EventType = "lesson.mastered"

	// Événements d'exercice / mission.
	EventExerciseAnswered EventType = "exercise.answered"
	EventMissionSucceeded EventType = "mission.succeeded"
	EventMissionFailed    EventType = "mission.failed"

	// Événements transverses.
	EventXPGained      EventType = "xp.gained"
	EventStreakUpdated EventType = "streak.updated"
	EventHeartConsumed EventType = "heart.consumed"
	EventHeartsRestored EventType = "hearts.restored"
	EventConceptUpdated EventType = "concept.updated"
	EventBadgeEarned   EventType = "badge.earned"
	EventAvatarUnlocked EventType = "avatar.unlocked"
)

// Event est l'interface commune à tous les événements métier.
// Chaque événement concret expose son type et son horodatage.
type Event interface {
	eventType() EventType
	at() time.Time
}

// Type — accesseur public du type d'événement.
func EventTypeOf(e Event) EventType { return e.eventType() }

// At — accesseur public de l'horodatage.
func EventAt(e Event) time.Time { return e.at() }

// ─── Événements de leçon ────────────────────────────────────────────────

// LessonStarted est émis quand un apprenant démarre une leçon.
type LessonStarted struct {
	At        time.Time
	LearnerID string
	LessonID  string
}

func (LessonStarted) eventType() EventType { return EventLessonStarted }
func (e LessonStarted) at() time.Time      { return e.At }

// LessonBlockViewed est émis quand un bloc est vu (cover/debrief) ou
// qu'un slide théorique est consulté.
type LessonBlockViewed struct {
	At         time.Time
	LearnerID  string
	LessonID   string
	BlockIndex int
	// SlidesConsumed — nombre de slides consommés dans cet événement.
	// Pertinent pour un bloc theory (1 par défaut).
	SlidesConsumed int
}

func (LessonBlockViewed) eventType() EventType { return EventLessonBlockView }
func (e LessonBlockViewed) at() time.Time      { return e.At }

// LessonCompleted est émis quand tous les blocs d'une leçon sont terminés.
type LessonCompleted struct {
	At        time.Time
	LearnerID string
	LessonID  string
	XPEarned  int
}

func (LessonCompleted) eventType() EventType { return EventLessonCompleted }
func (e LessonCompleted) at() time.Time      { return e.At }

// LessonMastered est émis quand tous les concepts de la leçon sont maîtrisés.
type LessonMastered struct {
	At        time.Time
	LearnerID string
	LessonID  string
}

func (LessonMastered) eventType() EventType { return EventLessonMastered }
func (e LessonMastered) at() time.Time      { return e.At }

// ─── Événements d'exercice ──────────────────────────────────────────────

// ExerciseAnswered est émis quand un exercice est répondu.
type ExerciseAnswered struct {
	At         time.Time
	LearnerID  string
	LessonID   string
	BlockIndex int
	ExerciseID string
	// Score — score 0-100 attribué à cette tentative.
	Score int
	// AttemptNumber — numéro de tentative (1-based).
	AttemptNumber int
	// XPAwarded — XP gagnée (0 si échec ou déjà réussie).
	XPAwarded int
}

func (ExerciseAnswered) eventType() EventType { return EventExerciseAnswered }
func (e ExerciseAnswered) at() time.Time      { return e.At }

// ─── Événements de mission ──────────────────────────────────────────────

// MissionSucceeded est émis quand une mission est réussie.
type MissionSucceeded struct {
	At         time.Time
	LearnerID  string
	LessonID   string
	BlockIndex int
	MissionID  string
	XPAwarded  int
}

func (MissionSucceeded) eventType() EventType { return EventMissionSucceeded }
func (e MissionSucceeded) at() time.Time      { return e.At }

// MissionFailed est émis quand une mission est tentée mais échoue.
type MissionFailed struct {
	At         time.Time
	LearnerID  string
	LessonID   string
	BlockIndex int
	MissionID  string
	Reason     string
}

func (MissionFailed) eventType() EventType { return EventMissionFailed }
func (e MissionFailed) at() time.Time      { return e.At }

// ─── Événements transverses ─────────────────────────────────────────────

// XPGained est émis à chaque attribution d'XP (interne, pour traçabilité).
type XPGained struct {
	At        time.Time
	LearnerID string
	Amount    int
	Source    string // "exercise", "mission", "lesson", "bonus"
}

func (XPGained) eventType() EventType { return EventXPGained }
func (e XPGained) at() time.Time      { return e.At }

// StreakUpdated est émis quand le streak change.
type StreakUpdated struct {
	At          time.Time
	LearnerID   string
	StreakDays  int
	BestStreak  int
	Increased   bool
}

func (StreakUpdated) eventType() EventType { return EventStreakUpdated }
func (e StreakUpdated) at() time.Time      { return e.At }

// ConceptUpdated est émis quand le niveau de maîtrise d'un concept change.
type ConceptUpdated struct {
	At        time.Time
	LearnerID string
	ConceptID string
	Level     int // 0-100
	Mastered  bool
}

func (ConceptUpdated) eventType() EventType { return EventConceptUpdated }
func (e ConceptUpdated) at() time.Time      { return e.At }

// BadgeEarned est émis quand un badge est obtenu.
type BadgeEarned struct {
	At        time.Time
	LearnerID string
	BadgeID   string
}

func (BadgeEarned) eventType() EventType { return EventBadgeEarned }
func (e BadgeEarned) at() time.Time      { return e.At }

// AvatarUnlocked est émis quand un avatar est débloqué.
type AvatarUnlocked struct {
	At        time.Time
	LearnerID string
	AvatarID  string
}

func (AvatarUnlocked) eventType() EventType { return EventAvatarUnlocked }
func (e AvatarUnlocked) at() time.Time      { return e.At }