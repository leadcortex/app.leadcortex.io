// backend/academy/internal/progress/engine.go

package progress

import (
	"fmt"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

type Clock interface {
	Now() time.Time
}

type realClock struct{}

func (realClock) Now() time.Time { return time.Now().UTC() }

type Engine struct {
	registry *curriculum.Registry
	resolver *curriculum.Resolver
	gate     *gate
	clock    Clock
}

func NewEngine(registry *curriculum.Registry, resolver *curriculum.Resolver, clock Clock) *Engine {
	if clock == nil {
		clock = realClock{}
	}
	return &Engine{
		registry: registry,
		resolver: resolver,
		gate:     newGate(registry),
		clock:    clock,
	}
}


func (e *Engine) CanStart(learner *domain.Learner, lessonID string) (bool, UnlockResult) {
	result := e.gate.EvaluateLesson(learner, lessonID)
	return result.Unlocked, result
}


type ApplyResult struct {
	Emitted []Event

	Transitioned bool

	NewStatus domain.LessonStatus
}

func (e *Engine) Apply(learner *domain.Learner, ev Event) (ApplyResult, error) {
	switch v := ev.(type) {
	case LessonStarted:
		return e.applyLessonStarted(learner, v)
	case LessonBlockViewed:
		return e.applyLessonBlockViewed(learner, v)
	case ExerciseAnswered:
		return e.applyExerciseAnswered(learner, v)
	case MissionSucceeded:
		return e.applyMissionSucceeded(learner, v)
	case MissionFailed:
		return e.applyMissionFailed(learner, v)
	default:
		return ApplyResult{}, fmt.Errorf("%w : type d'événement non géré",
			ErrInvalidEvent)
	}
}


func (e *Engine) applyLessonStarted(learner *domain.Learner, ev LessonStarted) (ApplyResult, error) {
	lesson, ok := e.registry.Lesson(ev.LessonID)
	if !ok {
		return ApplyResult{}, fmt.Errorf("%w : %s", ErrLessonNotInRegistry, ev.LessonID)
	}

	unlock := e.gate.EvaluateLesson(learner, ev.LessonID)
	if !unlock.Unlocked {
		return ApplyResult{}, &UnlockError{
			LessonID:        ev.LessonID,
			MissingPreqs:    unlock.MissingLessons,
			MissingConcepts: unlock.MissingConcepts,
			Reason:          unlock.Reason,
		}
	}

	progress, exists := learner.LessonProgress[lesson.ID]
	if !exists {
		progress = domain.NewLessonProgress(lesson)
	}
	if progress.Status == domain.LessonStatusLocked {
		if err := assertTransition(lesson.ID, domain.LessonStatusLocked,
			domain.LessonStatusAvailable); err != nil {
			return ApplyResult{}, err
		}
		progress.Status = domain.LessonStatusAvailable
	}

	if progress.Status != domain.LessonStatusAvailable &&
		progress.Status != domain.LessonStatusInProgress {
		return ApplyResult{}, &TransitionError{
			LessonID: lesson.ID,
			From:     progress.Status,
			To:       domain.LessonStatusInProgress,
			Reason:   "seule une leçon disponible ou en cours peut être démarrée",
		}
	}

	now := ev.At
	if progress.Status == domain.LessonStatusAvailable {
		if err := assertTransition(lesson.ID, domain.LessonStatusAvailable,
			domain.LessonStatusInProgress); err != nil {
			return ApplyResult{}, err
		}
		progress.Status = domain.LessonStatusInProgress
		progress.StartedAt = now
		progress.CurrentBlockIndex = 0
	}

	progress.LastActivityAt = now
	learner.LessonProgress[lesson.ID] = progress

	streakChanged := learner.RecordActivity(now)

	result := ApplyResult{
		Transitioned: progress.Status != domain.LessonStatusAvailable,
		NewStatus:    progress.Status,
	}
	if streakChanged {
		result.Emitted = append(result.Emitted, StreakUpdated{
			At:         now,
			LearnerID:  learner.ID,
			StreakDays: learner.StreakDays,
			BestStreak: learner.BestStreakDays,
			Increased:  true,
		})
	}
	return result, nil
}

func (e *Engine) applyLessonBlockViewed(learner *domain.Learner, ev LessonBlockViewed) (ApplyResult, error) {
	lesson, ok := e.registry.Lesson(ev.LessonID)
	if !ok {
		return ApplyResult{}, fmt.Errorf("%w : %s", ErrLessonNotInRegistry, ev.LessonID)
	}

	progress, exists := learner.LessonProgress[lesson.ID]
	if !exists {
		return ApplyResult{}, fmt.Errorf("%w : %s", ErrLessonNotStarted, lesson.ID)
	}
	if progress.Status == domain.LessonStatusLocked ||
		progress.Status == domain.LessonStatusAvailable {
		return ApplyResult{}, fmt.Errorf("%w : %s (status %s)",
			ErrLessonNotStarted, lesson.ID, progress.Status)
	}

	if ev.BlockIndex < 0 || ev.BlockIndex >= len(lesson.Blocks) {
		return ApplyResult{}, fmt.Errorf("%w : index %d hors limites (0-%d)",
			ErrBlockOutOfOrder, ev.BlockIndex, len(lesson.Blocks)-1)
	}

	state := progress.BlockStates[ev.BlockIndex]
	state.Viewed = true
	if ev.SlidesConsumed > 0 {
		state.SlidesViewed += ev.SlidesConsumed
	}
	state.LastUpdatedAt = ev.At
	progress.BlockStates[ev.BlockIndex] = state
	progress.LastActivityAt = ev.At
	learner.LessonProgress[lesson.ID] = progress

	return e.tryCompleteLesson(learner, lesson, progress, ev.At)
}

func (e *Engine) applyExerciseAnswered(learner *domain.Learner, ev ExerciseAnswered) (ApplyResult, error) {
	lesson, ok := e.registry.Lesson(ev.LessonID)
	if !ok {
		return ApplyResult{}, fmt.Errorf("%w : %s", ErrLessonNotInRegistry, ev.LessonID)
	}
	progress, exists := learner.LessonProgress[lesson.ID]
	if !exists {
		return ApplyResult{}, fmt.Errorf("%w : %s", ErrLessonNotStarted, lesson.ID)
	}
	if ev.BlockIndex < 0 || ev.BlockIndex >= len(lesson.Blocks) {
		return ApplyResult{}, fmt.Errorf("%w : index %d hors limites",
			ErrBlockOutOfOrder, ev.BlockIndex)
	}

	block, isPractice := lesson.Blocks[ev.BlockIndex].(domain.PracticeBlock)
	if !isPractice {
		return ApplyResult{}, fmt.Errorf("%w : le bloc %d n'est pas de pratique",
			ErrInvalidEvent, ev.BlockIndex)
	}

	var exercise *domain.Exercise
	for i := range block.Exercises {
		if block.Exercises[i].ID == ev.ExerciseID {
			exercise = &block.Exercises[i]
			break
		}
	}
	if exercise == nil {
		return ApplyResult{}, fmt.Errorf("%w : exercice %q introuvable",
			ErrInvalidEvent, ev.ExerciseID)
	}

	if progress.Scores == nil {
		progress.Scores = map[string]int{}
	}
	if progress.AttemptsByExercise == nil {
		progress.AttemptsByExercise = map[string]int{}
	}
	progress.AttemptsByExercise[ev.ExerciseID] = ev.AttemptNumber
	if ev.Score > progress.Scores[ev.ExerciseID] {
		progress.Scores[ev.ExerciseID] = ev.Score
	}

	state := progress.BlockStates[ev.BlockIndex]
	answeredCount := 0
	for _, ex := range block.Exercises {
		if progress.AttemptsByExercise[ex.ID] > 0 {
			answeredCount++
		}
	}
	state.ExercisesAnswered = answeredCount
	state.LastUpdatedAt = ev.At
	progress.BlockStates[ev.BlockIndex] = state

	result := ApplyResult{}
	now := ev.At
	for _, cid := range exercise.Concepts {
		updated := e.updateConceptMastery(learner, cid, ev.Score >= 70, now)
		if updated != nil {
			result.Emitted = append(result.Emitted, *updated)
		}
	}

	xpAwarded := 0
	if ev.XPAwarded > 0 {
		xpAwarded = ev.XPAwarded
		learner.AddXP(xpAwarded)
		progress.XPEarned += xpAwarded
		result.Emitted = append(result.Emitted, XPGained{
			At:        now,
			LearnerID: learner.ID,
			Amount:    xpAwarded,
			Source:    "exercise",
		})
	}

	progress.LastActivityAt = now
	learner.LessonProgress[lesson.ID] = progress
	learner.RecordActivity(now)

	complete, err := e.tryCompleteLesson(learner, lesson, progress, now)
	if err != nil {
		return result, err
	}
	result.Emitted = append(result.Emitted, complete.Emitted...)
	if complete.Transitioned {
		result.Transitioned = true
		result.NewStatus = complete.NewStatus
	}
	return result, nil
}

func (e *Engine) applyMissionSucceeded(learner *domain.Learner, ev MissionSucceeded) (ApplyResult, error) {
	lesson, ok := e.registry.Lesson(ev.LessonID)
	if !ok {
		return ApplyResult{}, fmt.Errorf("%w : %s", ErrLessonNotInRegistry, ev.LessonID)
	}
	progress, exists := learner.LessonProgress[lesson.ID]
	if !exists {
		return ApplyResult{}, fmt.Errorf("%w : %s", ErrLessonNotStarted, lesson.ID)
	}
	if ev.BlockIndex < 0 || ev.BlockIndex >= len(lesson.Blocks) {
		return ApplyResult{}, fmt.Errorf("%w : index hors limites", ErrBlockOutOfOrder)
	}

	block, isMission := lesson.Blocks[ev.BlockIndex].(domain.MissionBlock)
	if !isMission {
		return ApplyResult{}, fmt.Errorf("%w : le bloc %d n'est pas une mission",
			ErrInvalidEvent, ev.BlockIndex)
	}
	if block.Mission.ID != ev.MissionID {
		return ApplyResult{}, fmt.Errorf("%w : mission %q attendue, reçue %q",
			ErrInvalidEvent, block.Mission.ID, ev.MissionID)
	}

	state := progress.BlockStates[ev.BlockIndex]
	already := state.MissionSucceeded
	state.MissionSucceeded = true
	state.Viewed = true
	state.LastUpdatedAt = ev.At
	progress.BlockStates[ev.BlockIndex] = state

	missionProgress := learner.MissionProgress[ev.MissionID]
	missionProgress.MissionID = ev.MissionID
	if missionProgress.StartedAt == nil {
		missionProgress.StartedAt = ev.At
	}
	if !already {
		missionProgress.Attempts++
	}
	missionProgress.Status = domain.MissionStatusCompleted
	missionProgress.CompletedAt = ev.At
	learner.MissionProgress[ev.MissionID] = missionProgress

	result := ApplyResult{}
	now := ev.At

	if !already {
		xp := ev.XPAwarded
		if xp == 0 {
			xp = block.Mission.OnSuccess.XP
		}
		learner.AddXP(xp)
		progress.XPEarned += xp
		if xp > 0 {
			result.Emitted = append(result.Emitted, XPGained{
				At:        now,
				LearnerID: learner.ID,
				Amount:    xp,
				Source:    "mission",
			})
		}

		for _, aid := range block.Mission.OnSuccess.UnlocksAvatarIDs {
			if learner.UnlockAvatar(aid) {
				result.Emitted = append(result.Emitted, AvatarUnlocked{
					At:        now,
					LearnerID: learner.ID,
					AvatarID:  aid,
				})
			}
		}
		for _, bid := range block.Mission.OnSuccess.BadgeIDs {
			if learner.EarnBadge(bid, now) {
				result.Emitted = append(result.Emitted, BadgeEarned{
					At:        now,
					LearnerID: learner.ID,
					BadgeID:   bid,
				})
			}
		}
	}

	progress.LastActivityAt = now
	learner.LessonProgress[lesson.ID] = progress
	learner.RecordActivity(now)

	complete, err := e.tryCompleteLesson(learner, lesson, progress, now)
	if err != nil {
		return result, err
	}
	result.Emitted = append(result.Emitted, complete.Emitted...)
	if complete.Transitioned {
		result.Transitioned = true
		result.NewStatus = complete.NewStatus
	}
	return result, nil
}

func (e *Engine) applyMissionFailed(learner *domain.Learner, ev MissionFailed) (ApplyResult, error) {
	lesson, ok := e.registry.Lesson(ev.LessonID)
	if !ok {
		return ApplyResult{}, fmt.Errorf("%w : %s", ErrLessonNotInRegistry, ev.LessonID)
	}
	progress, exists := learner.LessonProgress[lesson.ID]
	if !exists {
		return ApplyResult{}, fmt.Errorf("%w : %s", ErrLessonNotStarted, lesson.ID)
	}
	learner.ConsumeHeart()
	progress.LastActivityAt = ev.At
	learner.LessonProgress[lesson.ID] = progress
	return ApplyResult{}, nil
}


func (e *Engine) tryCompleteLesson(
	learner *domain.Learner,
	lesson *domain.Lesson,
	progress domain.LessonProgress,
	now time.Time,
) (ApplyResult, error) {
	if !progress.AllBlocksCompleted(lesson) {
		return ApplyResult{}, nil
	}

	if progress.Status == domain.LessonStatusCompleted ||
		progress.Status == domain.LessonStatusMastered {
		return e.tryMasterLesson(learner, lesson, progress, now)
	}

	if err := assertTransition(lesson.ID, progress.Status,
		domain.LessonStatusCompleted); err != nil {
		return ApplyResult{}, err
	}

	progress.Status = domain.LessonStatusCompleted
	progress.CompletedAt = now
	learner.LessonProgress[lesson.ID] = progress

	result := ApplyResult{
		Transitioned: true,
		NewStatus:    domain.LessonStatusCompleted,
	}

	if lesson.Rewards.XP > 0 {
		learner.AddXP(lesson.Rewards.XP)
		progress.XPEarned += lesson.Rewards.XP
		learner.LessonProgress[lesson.ID] = progress
		result.Emitted = append(result.Emitted, XPGained{
			At:        now,
			LearnerID: learner.ID,
			Amount:    lesson.Rewards.XP,
			Source:    "lesson",
		})
	}

	for i := 0; i < lesson.Rewards.HeartsRefund; i++ {
		if learner.Hearts < domain.MaxHearts {
			learner.Hearts++
		}
	}

	for _, aid := range lesson.Unlocks.AvatarIDs {
		if learner.UnlockAvatar(aid) {
			result.Emitted = append(result.Emitted, AvatarUnlocked{
				At: now, LearnerID: learner.ID, AvatarID: aid,
			})
		}
	}
	for _, bid := range lesson.Unlocks.BadgeIDs {
		if learner.EarnBadge(bid, now) {
			result.Emitted = append(result.Emitted, BadgeEarned{
				At: now, LearnerID: learner.ID, BadgeID: bid,
			})
		}
	}

	result.Emitted = append(result.Emitted, LessonCompleted{
		At:        now,
		LearnerID: learner.ID,
		LessonID:  lesson.ID,
		XPEarned:  progress.XPEarned,
	})

	e.updateProgramProgress(learner, lesson, now)

	masterResult, err := e.tryMasterLesson(learner, lesson, progress, now)
	if err != nil {
		return result, err
	}
	result.Emitted = append(result.Emitted, masterResult.Emitted...)
	if masterResult.Transitioned {
		result.NewStatus = masterResult.NewStatus
	}
	return result, nil
}

func (e *Engine) tryMasterLesson(
	learner *domain.Learner,
	lesson *domain.Lesson,
	progress domain.LessonProgress,
	now time.Time,
) (ApplyResult, error) {
	if progress.Status != domain.LessonStatusCompleted {
		return ApplyResult{}, nil
	}
	if !shouldMaster(learner, lesson) {
		return ApplyResult{}, nil
	}
	if err := assertTransition(lesson.ID, domain.LessonStatusCompleted,
		domain.LessonStatusMastered); err != nil {
		return ApplyResult{}, err
	}
	progress.Status = domain.LessonStatusMastered
	learner.LessonProgress[lesson.ID] = progress

	return ApplyResult{
		Transitioned: true,
		NewStatus:    domain.LessonStatusMastered,
		Emitted: []Event{LessonMastered{
			At:        now,
			LearnerID: learner.ID,
			LessonID:  lesson.ID,
		}},
	}, nil
}


func (e *Engine) updateConceptMastery(
	learner *domain.Learner,
	conceptID string,
	success bool,
	now time.Time,
) *ConceptUpdated {
	m, exists := learner.ConceptMastery[conceptID]
	if !exists {
		m = domain.Mastery{ConceptID: conceptID, Level: 0}
	}
	prevLevel := m.Level

	m.Attempts++
	if success {
		m.Correct++
		m.Level = clampLevel(int(m.Level) + 15)
	} else {
		m.Level = clampLevel(int(m.Level) - 5)
	}
	m.LastReviewed = now

	learner.ConceptMastery[conceptID] = m

	if m.Level != prevLevel {
		return &ConceptUpdated{
			At:        now,
			LearnerID: learner.ID,
			ConceptID: conceptID,
			Level:     int(m.Level),
			Mastered:  m.IsMastered(),
		}
	}
	return nil
}

func clampLevel(v int) domain.MasteryLevel {
	if v < 0 {
		return 0
	}
	if v > 100 {
		return 100
	}
	return domain.MasteryLevel(v)
}


func (e *Engine) updateProgramProgress(
	learner *domain.Learner,
	lesson *domain.Lesson,
	now time.Time,
) {
	module, ok := e.registry.Module(lesson.ModuleID)
	if !ok {
		return
	}
	program, ok := e.registry.Program(module.ProgramID)
	if !ok {
		return
	}

	progress, exists := learner.ProgramProgress[program.ID]
	if !exists {
		progress = domain.ProgramProgress{
			ProgramID:          program.ID,
			StartedAt:          now,
			CompletedLessonIDs: []string{},
		}
	}

	already := false
	for _, id := range progress.CompletedLessonIDs {
		if id == lesson.ID {
			already = true
			break
		}
	}
	if !already {
		progress.CompletedLessonIDs = append(progress.CompletedLessonIDs, lesson.ID)
	}

	totalLessons := program.TotalLessons()
	if len(progress.CompletedLessonIDs) >= totalLessons && progress.CompletedAt.IsZero() {
		progress.CompletedAt = now
	}

	learner.ProgramProgress[program.ID] = progress
}


type Recommendation struct {
	Kind RecommendationKind
	LessonID string
	Reason string
}

type RecommendationKind string

const (
	RecoLesson     RecommendationKind = "lesson"
	RecoReview     RecommendationKind = "review"
	RecoDailyQuest RecommendationKind = "daily_quest"
	RecoNone       RecommendationKind = "none"
)

func (e *Engine) Recommend(learner *domain.Learner) Recommendation {
	for _, lesson := range e.registry.AllLessons() {
		progress, ok := learner.LessonProgress[lesson.ID]
		if ok && progress.Status == domain.LessonStatusInProgress {
			return Recommendation{
				Kind:     RecoLesson,
				LessonID: lesson.ID,
				Reason:   "Reprendre la leçon en cours",
			}
		}
	}

	for _, lesson := range e.registry.AllLessons() {
		progress, ok := learner.LessonProgress[lesson.ID]
		if ok {
			if progress.Status == domain.LessonStatusAvailable ||
				progress.Status == domain.LessonStatusInProgress {
				return Recommendation{
					Kind:     RecoLesson,
					LessonID: lesson.ID,
					Reason:   "Continuer le parcours",
				}
			}
			continue
		}
		if unlock := e.gate.EvaluateLesson(learner, lesson.ID); unlock.Unlocked {
			return Recommendation{
				Kind:     RecoLesson,
				LessonID: lesson.ID,
				Reason:   "Commencer le parcours",
			}
		}
	}

	return Recommendation{
		Kind:   RecoNone,
		Reason: "Aucune action recommandée",
	}
}
