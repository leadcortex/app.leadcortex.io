// backend/academy/internal/progress/events.go

package progress

import "time"

type EventType string

const (
	EventLessonStarted   EventType = "lesson.started"
	EventLessonBlockView EventType = "lesson.block.viewed"
	EventLessonCompleted EventType = "lesson.completed"
	EventLessonMastered  EventType = "lesson.mastered"

	EventExerciseAnswered EventType = "exercise.answered"
	EventMissionSucceeded EventType = "mission.succeeded"
	EventMissionFailed    EventType = "mission.failed"

	EventXPGained      EventType = "xp.gained"
	EventStreakUpdated EventType = "streak.updated"
	EventHeartConsumed EventType = "heart.consumed"
	EventHeartsRestored EventType = "hearts.restored"
	EventConceptUpdated EventType = "concept.updated"
	EventBadgeEarned   EventType = "badge.earned"
	EventAvatarUnlocked EventType = "avatar.unlocked"
)

type Event interface {
	eventType() EventType
	at() time.Time
}

func EventTypeOf(e Event) EventType { return e.eventType() }

func EventAt(e Event) time.Time { return e.at() }


type LessonStarted struct {
	At        time.Time
	LearnerID string
	LessonID  string
}

func (LessonStarted) eventType() EventType { return EventLessonStarted }
func (e LessonStarted) at() time.Time      { return e.At }

type LessonBlockViewed struct {
	At         time.Time
	LearnerID  string
	LessonID   string
	BlockIndex int
	SlidesConsumed int
}

func (LessonBlockViewed) eventType() EventType { return EventLessonBlockView }
func (e LessonBlockViewed) at() time.Time      { return e.At }

type LessonCompleted struct {
	At        time.Time
	LearnerID string
	LessonID  string
	XPEarned  int
}

func (LessonCompleted) eventType() EventType { return EventLessonCompleted }
func (e LessonCompleted) at() time.Time      { return e.At }

type LessonMastered struct {
	At        time.Time
	LearnerID string
	LessonID  string
}

func (LessonMastered) eventType() EventType { return EventLessonMastered }
func (e LessonMastered) at() time.Time      { return e.At }


type ExerciseAnswered struct {
	At         time.Time
	LearnerID  string
	LessonID   string
	BlockIndex int
	ExerciseID string
	Score int
	AttemptNumber int
	XPAwarded int
}

func (ExerciseAnswered) eventType() EventType { return EventExerciseAnswered }
func (e ExerciseAnswered) at() time.Time      { return e.At }


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


type XPGained struct {
	At        time.Time
	LearnerID string
	Amount    int
	Source    string
}

func (XPGained) eventType() EventType { return EventXPGained }
func (e XPGained) at() time.Time      { return e.At }

type StreakUpdated struct {
	At          time.Time
	LearnerID   string
	StreakDays  int
	BestStreak  int
	Increased   bool
}

func (StreakUpdated) eventType() EventType { return EventStreakUpdated }
func (e StreakUpdated) at() time.Time      { return e.At }

type ConceptUpdated struct {
	At        time.Time
	LearnerID string
	ConceptID string
	Level     int
	Mastered  bool
}

func (ConceptUpdated) eventType() EventType { return EventConceptUpdated }
func (e ConceptUpdated) at() time.Time      { return e.At }

type BadgeEarned struct {
	At        time.Time
	LearnerID string
	BadgeID   string
}

func (BadgeEarned) eventType() EventType { return EventBadgeEarned }
func (e BadgeEarned) at() time.Time      { return e.At }

type AvatarUnlocked struct {
	At        time.Time
	LearnerID string
	AvatarID  string
}

func (AvatarUnlocked) eventType() EventType { return EventAvatarUnlocked }
func (e AvatarUnlocked) at() time.Time      { return e.At }