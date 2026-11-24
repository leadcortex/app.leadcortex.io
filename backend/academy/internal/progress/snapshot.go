// backend/academy/internal/progress/snapshot.go

package progress

import (
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

type Snapshot struct {

	LearnerID   string    `json:"learner_id"`
	DisplayName string    `json:"display_name"`
	GeneratedAt time.Time `json:"generated_at"`


	XP            int `json:"xp"`
	Level         int `json:"level"`
	XPForNext     int `json:"xp_for_next_level"`
	LevelProgress float64 `json:"level_progress"`

	StreakDays     int `json:"streak_days"`
	BestStreakDays int `json:"best_streak_days"`
	Hearts         int `json:"hearts"`
	MaxHearts      int `json:"max_hearts"`


	Programs []ProgramSnapshot `json:"programs"`


	Recommendation Recommendation `json:"recommendation"`


	UnlockedAvatarIDs []string `json:"unlocked_avatar_ids"`
	EquippedAvatarID  string   `json:"equipped_avatar_id"`
	EarnedBadgeIDs    []string `json:"earned_badge_ids"`
}

type ProgramSnapshot struct {
	ProgramID      string  `json:"program_id"`
	Title          string  `json:"title"`
	Subtitle       string  `json:"subtitle"`
	Icon           string  `json:"icon"`
	Color          string  `json:"color"`
	Order          int     `json:"order"`
	Difficulty     int     `json:"difficulty"`
	TotalLessons   int     `json:"total_lessons"`
	CompletedCount int     `json:"completed_lessons"`
	ProgressRatio  float64 `json:"progress_ratio"`
	Status         ProgramStatus `json:"status"`
	EstimatedMin   int     `json:"estimated_minutes"`

	Modules []ModuleSnapshot `json:"modules"`
}

type ProgramStatus string

const (
	ProgramStatusLocked      ProgramStatus = "locked"
	ProgramStatusAvailable   ProgramStatus = "available"
	ProgramStatusInProgress  ProgramStatus = "in_progress"
	ProgramStatusCompleted   ProgramStatus = "completed"
)

type ModuleSnapshot struct {
	ModuleID       string  `json:"module_id"`
	Title          string  `json:"title"`
	Order          int     `json:"order"`
	TotalLessons   int     `json:"total_lessons"`
	CompletedCount int     `json:"completed_lessons"`
	ProgressRatio  float64 `json:"progress_ratio"`
	Status         ProgramStatus `json:"status"`

	Lessons []LessonSnapshot `json:"lessons"`
}

type LessonSnapshot struct {
	LessonID      string `json:"lesson_id"`
	Title         string `json:"title"`
	Subtitle      string `json:"subtitle"`
	Order         int    `json:"order"`
	DurationMin   int    `json:"duration_min"`
	Difficulty    int    `json:"difficulty"`
	XPTotal       int    `json:"xp_total"`
	Status        domain.LessonStatus `json:"status"`
	ProgressRatio float64             `json:"progress_ratio"`
	IsLocked      bool                `json:"is_locked"`
	UnlockReason string `json:"unlock_reason,omitempty"`
}


func BuildSnapshot(
	registry *curriculum.Registry,
	engine *Engine,
	learner *domain.Learner,
) Snapshot {
	now := time.Now().UTC()

	snap := Snapshot{
		LearnerID:         learner.ID,
		DisplayName:       learner.DisplayName,
		GeneratedAt:       now,
		XP:                learner.XP,
		Level:             learner.Level,
		XPForNext:         domain.XPForLevel(learner.Level + 1),
		StreakDays:        learner.StreakDays,
		BestStreakDays:    learner.BestStreakDays,
		Hearts:            learner.Hearts,
		MaxHearts:         domain.MaxHearts,
		UnlockedAvatarIDs: append([]string{}, learner.UnlockedAvatarIDs...),
		EquippedAvatarID:  learner.EquippedAvatarID,
	}

	curLevelXP := domain.XPForLevel(learner.Level)
	nextLevelXP := domain.XPForLevel(learner.Level + 1)
	if nextLevelXP > curLevelXP {
		snap.LevelProgress = float64(learner.XP-curLevelXP) / float64(nextLevelXP-curLevelXP)
	} else {
		snap.LevelProgress = 1
	}

	for _, b := range learner.EarnedBadges {
		snap.EarnedBadgeIDs = append(snap.EarnedBadgeIDs, b.BadgeID)
	}

	for _, p := range registry.AllPrograms() {
		snap.Programs = append(snap.Programs, buildProgramSnapshot(registry, engine, learner, p))
	}

	if engine != nil {
		snap.Recommendation = engine.Recommend(learner)
	}

	return snap
}

func buildProgramSnapshot(
	registry *curriculum.Registry,
	engine *Engine,
	learner *domain.Learner,
	program *domain.Program,
) ProgramSnapshot {
	ps := ProgramSnapshot{
		ProgramID:    program.ID,
		Title:        program.Title,
		Subtitle:     program.Subtitle,
		Icon:         program.Icon,
		Color:        program.Color,
		Order:        program.Order,
		Difficulty:   program.Difficulty,
		TotalLessons: program.TotalLessons(),
		EstimatedMin: program.EstimatedMinutes,
	}

	for _, m := range program.Modules {
		ms := buildModuleSnapshot(registry, engine, learner, &m)
		ps.Modules = append(ps.Modules, ms)
		ps.CompletedCount += ms.CompletedCount
	}

	if ps.TotalLessons > 0 {
		ps.ProgressRatio = float64(ps.CompletedCount) / float64(ps.TotalLessons)
	}

	switch {
	case ps.CompletedCount >= ps.TotalLessons && ps.TotalLessons > 0:
		ps.Status = ProgramStatusCompleted
	case ps.CompletedCount > 0:
		ps.Status = ProgramStatusInProgress
	default:
		ps.Status = ProgramStatusAvailable
	}

	if len(ps.Modules) > 0 && ps.Modules[0].Status == ProgramStatusLocked {
		ps.Status = ProgramStatusLocked
	}

	return ps
}

func buildModuleSnapshot(
	registry *curriculum.Registry,
	engine *Engine,
	learner *domain.Learner,
	module *domain.Module,
) ModuleSnapshot {
	ms := ModuleSnapshot{
		ModuleID:     module.ID,
		Title:        module.Title,
		Order:        module.Order,
		TotalLessons: len(module.Lessons),
	}

	for i := range module.Lessons {
		lesson := &module.Lessons[i]
		ls := buildLessonSnapshot(registry, engine, learner, lesson)
		ms.Lessons = append(ms.Lessons, ls)
		if ls.Status == domain.LessonStatusCompleted ||
			ls.Status == domain.LessonStatusMastered {
			ms.CompletedCount++
		}
	}

	if ms.TotalLessons > 0 {
		ms.ProgressRatio = float64(ms.CompletedCount) / float64(ms.TotalLessons)
	}

	switch {
	case ms.CompletedCount >= ms.TotalLessons && ms.TotalLessons > 0:
		ms.Status = ProgramStatusCompleted
	case ms.CompletedCount > 0:
		ms.Status = ProgramStatusInProgress
	default:
		if engine != nil {
			unlock := engine.gate.EvaluateModule(learner, module.ID)
			if unlock.Unlocked {
				ms.Status = ProgramStatusAvailable
			} else {
				ms.Status = ProgramStatusLocked
			}
		}
	}
	return ms
}

func buildLessonSnapshot(
	registry *curriculum.Registry,
	engine *Engine,
	learner *domain.Learner,
	lesson *domain.Lesson,
) LessonSnapshot {
	ls := LessonSnapshot{
		LessonID:    lesson.ID,
		Title:       lesson.Title,
		Subtitle:    lesson.Subtitle,
		Order:       lesson.Order,
		DurationMin: lesson.DurationMin,
		Difficulty:  lesson.Difficulty,
		XPTotal:     lesson.XPTotal,
	}

	progress, ok := learner.LessonProgress[lesson.ID]
	if !ok {
		ls.Status = domain.LessonStatusLocked
		if engine != nil {
			unlock := engine.gate.EvaluateLesson(learner, lesson.ID)
			if unlock.Unlocked {
				ls.Status = domain.LessonStatusAvailable
			} else {
				ls.IsLocked = true
				ls.UnlockReason = unlock.Reason
			}
		}
		return ls
	}

	ls.Status = progress.Status
	ls.ProgressRatio = progress.OverallProgressRatio(lesson)
	ls.IsLocked = progress.Status == domain.LessonStatusLocked
	return ls
}