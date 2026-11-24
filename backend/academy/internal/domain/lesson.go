// backend/academy/internal/domain/lesson.go

package domain

import "time"

type Lesson struct {
	ID string

	ModuleID string

	Order int

	Slug string

	Title string

	Subtitle string

	DurationMin int

	Difficulty int

	XPTotal int

	Concepts []string

	Skills []string

	Blocks []Block

	Prerequisites LessonPrerequisites

	Unlocks LessonUnlocks

	Rewards LessonRewards

	SrsTemplates []SrsCardTemplate
}

type LessonPrerequisites struct {
	PreviousLessonIDs []string

	RequiredConceptIDs []string
}

type LessonUnlocks struct {
	LessonIDs []string
	AvatarIDs []string
	BadgeIDs []string
}

type LessonRewards struct {
	XP int
	HeartsRefund int
}

func (l Lesson) Validate() error {
	if l.ID == "" {
		return NewValidationError("Lesson", "id", "obligatoire")
	}
	if l.ModuleID == "" {
		return NewValidationError("Lesson", "module_id", "obligatoire")
	}
	if l.Order <= 0 {
		return NewValidationError("Lesson", "order", "doit être > 0")
	}
	if l.Title == "" {
		return NewValidationError("Lesson", "title", "obligatoire")
	}
	if l.DurationMin <= 0 {
		return NewValidationError("Lesson", "duration_min", "doit être > 0")
	}
	if l.Difficulty < 1 || l.Difficulty > 5 {
		return NewValidationError("Lesson", "difficulty", "doit être entre 1 et 5")
	}
	if l.XPTotal < 0 {
		return NewValidationError("Lesson", "xp_total", "ne peut pas être négatif")
	}
	if len(l.Blocks) == 0 {
		return NewValidationError("Lesson", "blocks", "au moins un bloc requis")
	}
	for i, b := range l.Blocks {
		if err := b.Validate(); err != nil {
			return &ValidationError{
				Entity: "Lesson",
				Field:  "blocks",
				Reason: "bloc " + itoa(i) + " : " + err.Error(),
			}
		}
	}
	for i, t := range l.SrsTemplates {
		if err := t.Validate(); err != nil {
			return &ValidationError{
				Entity: "Lesson",
				Field:  "srs_templates",
				Reason: "template " + itoa(i) + " : " + err.Error(),
			}
		}
	}
	return nil
}

func (l Lesson) FindBlock(t BlockType) Block {
	for _, b := range l.Blocks {
		if b.BlockType() == t {
			return b
		}
	}
	return nil
}

func (l Lesson) BlockIndex(t BlockType) int {
	for i, b := range l.Blocks {
		if b.BlockType() == t {
			return i
		}
	}
	return -1
}

func (l Lesson) TotalXP() int {
	total := l.Rewards.XP
	for _, b := range l.Blocks {
		switch blk := b.(type) {
		case PracticeBlock:
			for _, e := range blk.Exercises {
				total += e.XP
			}
		case MissionBlock:
			total += blk.Mission.OnSuccess.XP
		}
	}
	return total
}


type BlockState struct {
	Viewed bool

	SlidesViewed int

	ExercisesAnswered int

	MissionSucceeded bool

	LastUpdatedAt time.Time
}

func (s BlockState) IsCompleteFor(b Block) bool {
	switch blk := b.(type) {
	case CoverBlock:
		return s.Viewed
	case TheoryBlock:
		return s.SlidesViewed >= len(blk.Slides)
	case PracticeBlock:
		return s.ExercisesAnswered >= len(blk.Exercises)
	case MissionBlock:
		return s.MissionSucceeded
	case DebriefBlock:
		return s.Viewed
	default:
		return false
	}
}

func (s BlockState) ProgressRatioFor(b Block) float64 {
	switch blk := b.(type) {
	case CoverBlock:
		if s.Viewed {
			return 1
		}
		return 0
	case TheoryBlock:
		if len(blk.Slides) == 0 {
			return 1
		}
		r := float64(s.SlidesViewed) / float64(len(blk.Slides))
		if r > 1 {
			return 1
		}
		return r
	case PracticeBlock:
		if len(blk.Exercises) == 0 {
			return 1
		}
		r := float64(s.ExercisesAnswered) / float64(len(blk.Exercises))
		if r > 1 {
			return 1
		}
		return r
	case MissionBlock:
		if s.MissionSucceeded {
			return 1
		}
		return 0
	case DebriefBlock:
		if s.Viewed {
			return 1
		}
		return 0
	default:
		return 0
	}
}


type LessonProgress struct {
	LessonID string

	Status LessonStatus

	StartedAt time.Time

	CompletedAt time.Time

	LastActivityAt time.Time

	CurrentBlockIndex int

	BlockStates []BlockState

	Scores map[string]int

	AttemptsByExercise map[string]int

	XPEarned int
}

func NewLessonProgress(lesson *Lesson) LessonProgress {
	states := make([]BlockState, len(lesson.Blocks))
	return LessonProgress{
		LessonID:           lesson.ID,
		Status:             LessonStatusLocked,
		CurrentBlockIndex:  -1,
		BlockStates:        states,
		Scores:             map[string]int{},
		AttemptsByExercise: map[string]int{},
		XPEarned:           0,
	}
}

func (p LessonProgress) Validate(lesson *Lesson) error {
	if p.LessonID != lesson.ID {
		return NewValidationError("LessonProgress", "lesson_id",
			"ne correspond pas à la leçon associée")
	}
	if len(p.BlockStates) != len(lesson.Blocks) {
		return NewValidationError("LessonProgress", "block_states",
			"la longueur doit être égale au nombre de blocs de la leçon")
	}
	if p.CurrentBlockIndex < -1 || p.CurrentBlockIndex >= len(lesson.Blocks) {
		return NewValidationError("LessonProgress", "current_block_index",
			"index hors limites")
	}
	return nil
}

func (p LessonProgress) IsCompleted() bool {
	return p.Status == LessonStatusCompleted || p.Status == LessonStatusMastered
}

func (p LessonProgress) OverallProgressRatio(lesson *Lesson) float64 {
	if len(lesson.Blocks) == 0 {
		return 0
	}
	var total float64
	for i, b := range lesson.Blocks {
		if i >= len(p.BlockStates) {
			break
		}
		total += p.BlockStates[i].ProgressRatioFor(b)
	}
	return total / float64(len(lesson.Blocks))
}

func (p LessonProgress) AllBlocksCompleted(lesson *Lesson) bool {
	for i, b := range lesson.Blocks {
		if i >= len(p.BlockStates) {
			return false
		}
		if !p.BlockStates[i].IsCompleteFor(b) {
			return false
		}
	}
	return len(lesson.Blocks) > 0
}

type LessonStatus string

const (
	LessonStatusLocked LessonStatus = "locked"
	LessonStatusAvailable LessonStatus = "available"
	LessonStatusInProgress LessonStatus = "in_progress"
	LessonStatusCompleted LessonStatus = "completed"
	LessonStatusMastered LessonStatus = "mastered"
)