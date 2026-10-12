package progress

import (
	"fmt"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

// Clock permet d'injecter une horloge testable.
type Clock interface {
	Now() time.Time
}

// realClock — implémentation par défaut.
type realClock struct{}

func (realClock) Now() time.Time { return time.Now().UTC() }

// Engine orchestre les transitions de progression.
//
// Il est safe en lecture concurrente. Les écritures sur le Learner doivent
// être sérialisées par l'appelant (repository ou service layer).
type Engine struct {
	registry *curriculum.Registry
	resolver *curriculum.Resolver
	gate     *gate
	clock    Clock
}

// NewEngine construit un moteur adossé à un registre de curriculum.
// Si clock est nil, `realClock` est utilisé.
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

/* ─── Évaluation d'accès ──────────────────────────────────────────────── */

// CanStart indique si une leçon peut être démarrée.
//
// Renvoie (true, UnlockResult{Unlocked:true}) si accessible ;
// (false, UnlockResult{...}) sinon.
func (e *Engine) CanStart(learner *domain.Learner, lessonID string) (bool, UnlockResult) {
	result := e.gate.EvaluateLesson(learner, lessonID)
	return result.Unlocked, result
}

/* ─── Application d'événements ────────────────────────────────────────── */

// ApplyResult décrit ce qui s'est produit après application d'un événement.
type ApplyResult struct {
	// Emitted — événements dérivés émis par le moteur
	// (ex. LessonCompleted après un dernier bloc terminé).
	Emitted []Event

	// Transitioned — vrai si le statut de la leçon a changé.
	Transitioned bool

	// NewStatus — nouveau statut (si Transitioned).
	NewStatus domain.LessonStatus
}

// Apply applique un événement au Learner.
//
// Le Learner est muté en place. Les événements dérivés sont retournés
// via ApplyResult.Emitted pour être propagés à un EventBus ou une UI.
//
// Erreurs possibles :
//   - ErrLessonNotInRegistry
//   - ErrLessonNotStarted (si l'événement nécessite une leçon démarrée)
//   - ErrBlockOutOfOrder
//   - ErrInvalidEvent
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

/* ─── Handlers d'événements ───────────────────────────────────────────── */

func (e *Engine) applyLessonStarted(learner *domain.Learner, ev LessonStarted) (ApplyResult, error) {
	lesson, ok := e.registry.Lesson(ev.LessonID)
	if !ok {
		return ApplyResult{}, fmt.Errorf("%w : %s", ErrLessonNotInRegistry, ev.LessonID)
	}

	// Vérifier l'accès.
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

	// Déjà démarrée : idempotent (on ne relance pas la transition).
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

	// Mise à jour du streak (compte la leçon démarrée comme activité).
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

	// Mettre à jour l'état du bloc.
	state := progress.BlockStates[ev.BlockIndex]
	state.Viewed = true
	if ev.SlidesConsumed > 0 {
		state.SlidesViewed += ev.SlidesConsumed
	}
	state.LastUpdatedAt = ev.At
	progress.BlockStates[ev.BlockIndex] = state
	progress.LastActivityAt = ev.At
	learner.LessonProgress[lesson.ID] = progress

	// Vérifier si la leçon est complète.
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

	// Retrouver l'exercice par ID.
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

	// Enregistrer le score.
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

	// Compter l'exercice comme répondu (une seule fois).
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

	// Mettre à jour la maîtrise des concepts liés.
	result := ApplyResult{}
	now := ev.At
	for _, cid := range exercise.Concepts {
		updated := e.updateConceptMastery(learner, cid, ev.Score >= 70, now)
		if updated != nil {
			result.Emitted = append(result.Emitted, *updated)
		}
	}

	// XP.
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

	// Vérifier si la leçon devient complète.
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

	// Marquer la mission comme réussie.
	state := progress.BlockStates[ev.BlockIndex]
	already := state.MissionSucceeded
	state.MissionSucceeded = true
	state.Viewed = true
	state.LastUpdatedAt = ev.At
	progress.BlockStates[ev.BlockIndex] = state

	result := ApplyResult{}
	now := ev.At

	// XP attribuée une seule fois.
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

		// Déblocages d'avatars / badges.
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
	// Un échec de mission consomme une vie (mécanique Duolingo).
	learner.ConsumeHeart()
	progress.LastActivityAt = ev.At
	learner.LessonProgress[lesson.ID] = progress
	// Pas de transition : la mission reste à retenter.
	return ApplyResult{}, nil
}

/* ─── Complétion et maîtrise ──────────────────────────────────────────── */

// tryCompleteLesson vérifie si tous les blocs sont terminés et effectue
// la transition vers completed (et éventuellement vers mastered).
func (e *Engine) tryCompleteLesson(
	learner *domain.Learner,
	lesson *domain.Lesson,
	progress domain.LessonProgress,
	now time.Time,
) (ApplyResult, error) {
	if !progress.AllBlocksCompleted(lesson) {
		return ApplyResult{}, nil
	}

	// Transition vers completed.
	if progress.Status == domain.LessonStatusCompleted ||
		progress.Status == domain.LessonStatusMastered {
		// Déjà complétée : on retente la transition mastered sans re-créditer l'XP.
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

	// XP bonus de complétion.
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

	// Vies rendues.
	for i := 0; i < lesson.Rewards.HeartsRefund; i++ {
		if learner.Hearts < domain.MaxHearts {
			learner.Hearts++
		}
	}

	// Déblocages liés à la leçon (avatars, badges).
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

	// Mettre à jour la progression du programme.
	e.updateProgramProgress(learner, lesson, now)

	// Tentative de passage en mastered.
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

// tryMasterLesson tente la transition completed → mastered.
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

/* ─── Maîtrise des concepts ───────────────────────────────────────────── */

// updateConceptMastery met à jour le niveau de maîtrise d'un concept.
//
// Règle simple (améliorée en Partie 5 par le scorer d'exercices) :
//   - Succès : +15 points (borné à 100)
//   - Échec   : -5 points (borné à 0)
//
// Renvoie un événement ConceptUpdated si le niveau change.
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

/* ─── Progression du programme ────────────────────────────────────────── */

// updateProgramProgress recalcule l'état du programme parent d'une leçon.
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

	// Ajouter la leçon si pas déjà fait.
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

	// Vérifier la complétion totale.
	totalLessons := program.TotalLessons()
	if len(progress.CompletedLessonIDs) >= totalLessons && progress.CompletedAt.IsZero() {
		progress.CompletedAt = now
	}

	learner.ProgramProgress[program.ID] = progress
}

/* ─── Recommandation ──────────────────────────────────────────────────── */

// Recommendation décrit l'action suivante suggérée à un apprenant.
type Recommendation struct {
	// Kind — type de la recommandation.
	Kind RecommendationKind
	// LessonID — leçon concernée (si Kind = RecommendationLesson).
	LessonID string
	// Reason — texte lisible par l'humain.
	Reason string
}

// RecommendationKind énumère les types de recommandations.
type RecommendationKind string

const (
	RecoLesson       RecommendationKind = "lesson"
	RecoReview       RecommendationKind = "review"
	RecoDailyQuest   RecommendationKind = "daily_quest"
	RecoNone         RecommendationKind = "none"
)

// Recommend renvoie la prochaine action conseillée à l'apprenant.
//
// Ordre de priorité :
//  1. Leçon en cours non terminée (reprendre)
//  2. Leçon suivante débloquée du parcours
//  3. Révisions SRS en attente (Partie 6)
//  4. Aucune action
func (e *Engine) Recommend(learner *domain.Learner) Recommendation {
	// 1. Leçon en cours ?
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

	// 2. Première leçon disponible.
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
		// Pas de progression enregistrée : évaluer le déblocage.
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