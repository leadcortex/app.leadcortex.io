package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/leadcortex/academy/internal/assessment"
	"github.com/leadcortex/academy/internal/domain"
	"github.com/leadcortex/academy/internal/gamification"
	"github.com/leadcortex/academy/internal/progress"
)

/* ═══════════════════════════════════════════════════════════════════════
   POST /api/v1/lessons/{lessonID}/exercises/{exerciseID}/answer
   ═══════════════════════════════════════════════════════════════════════ */

func (s *Server) handleAnswerExercise(w http.ResponseWriter, r *http.Request) {
	learnerID := MustLearnerID(r.Context())
	learner, err := s.getOrCreateLearner(r, learnerID)
	if err != nil {
		WriteError(w, err)
		return
	}

	lessonID := chi.URLParam(r, "lessonID")
	exerciseID := chi.URLParam(r, "exerciseID")
	if lessonID == "" || exerciseID == "" {
		WriteBadRequest(w, "lesson_id ou exercise_id manquant")
		return
	}

	lesson, ok := s.deps.Registry.Lesson(lessonID)
	if !ok {
		WriteNotFound(w, "leçon introuvable")
		return
	}

	blockIndex, exercise, ok := findExerciseBlock(lesson, exerciseID)
	if !ok {
		WriteNotFound(w, "exercice introuvable dans cette leçon")
		return
	}

	var req AnswerExerciseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteBadRequest(w, "corps JSON invalide")
		return
	}

	if req.Kind != "" && domain.ExerciseKind(req.Kind) != exercise.Kind {
		WriteValidation(w, map[string]string{
			"kind": fmt.Sprintf("attendu %q, reçu %q", exercise.Kind, req.Kind),
		})
		return
	}

	answer, err := buildAnswer(exercise.Kind, req)
	if err != nil {
		WriteBadRequest(w, err.Error())
		return
	}

	res, err := s.deps.Evaluator.Evaluate(*exercise, answer)
	if err != nil {
		WriteError(w, err)
		return
	}

	attemptNumber := 1
	prevBest := 0
	if lp, exists := learner.LessonProgress[lessonID]; exists {
		attemptNumber = lp.AttemptsByExercise[exerciseID] + 1
		if sc, ok := lp.Scores[exerciseID]; ok {
			prevBest = sc
		}
	}
	previouslyCorrect := prevBest >= s.deps.Evaluator.PassingScore

	xpAwarded := 0
	if res.Correct && !previouslyCorrect {
		xpAwarded = exercise.XP
	}

	now := s.deps.Clock.Now()
	result, err := s.deps.Engine.Apply(learner, progress.ExerciseAnswered{
		At:            now,
		LearnerID:     learnerID,
		LessonID:      lessonID,
		BlockIndex:    blockIndex,
		ExerciseID:    exerciseID,
		Score:         res.Score,
		AttemptNumber: attemptNumber,
		XPAwarded:     xpAwarded,
	})
	if err != nil {
		WriteError(w, err)
		return
	}

	if err := s.deps.Repository.SaveLearner(r.Context(), learner); err != nil {
		WriteError(w, err)
		return
	}

	// ─── Progression des quêtes quotidiennes ─────────────────────────
	var questUpdates []gamification.QuestUpdate
	if res.Correct {
		questUpdates = append(questUpdates, gamification.QuestUpdate{
			Kind:   gamification.QuestExercises,
			Amount: 1,
		})
	}
	if xpAwarded > 0 {
		questUpdates = append(questUpdates, gamification.QuestUpdate{
			Kind:   gamification.QuestXP,
			Amount: xpAwarded,
		})
	}
	if result.Transitioned && result.NewStatus == domain.LessonStatusCompleted {
		questUpdates = append(questUpdates, gamification.QuestUpdate{
			Kind:   gamification.QuestLessons,
			Amount: 1,
		})
	}
	if err := s.progressQuests(r, learnerID, questUpdates...); err != nil {
		s.log.Warn().Err(err).Str("learner_id", learnerID).
			Msg("progressQuests (exercise) a échoué")
	}

	finalStatus := result.NewStatus
	if finalStatus == "" {
		if lp, ok := learner.LessonProgress[lessonID]; ok {
			finalStatus = lp.Status
		}
	}

	WriteJSON(w, http.StatusOK, toEvaluationResponse(res, xpAwarded, finalStatus))
}

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS (inchangés)
   ═══════════════════════════════════════════════════════════════════════ */

func findExerciseBlock(
	lesson *domain.Lesson,
	exerciseID string,
) (int, *domain.Exercise, bool) {
	for i, b := range lesson.Blocks {
		pb, ok := b.(domain.PracticeBlock)
		if !ok {
			continue
		}
		for j := range pb.Exercises {
			if pb.Exercises[j].ID == exerciseID {
				ex := pb.Exercises[j]
				return i, &ex, true
			}
		}
	}
	return 0, nil, false
}

func buildAnswer(kind domain.ExerciseKind, req AnswerExerciseRequest) (assessment.Answer, error) {
	switch kind {
	case domain.ExerciseMCQ:
		return assessment.MCQAnswer{Selected: req.Selected}, nil
	case domain.ExerciseMultiSelect:
		return assessment.MultiSelectAnswer{Selected: req.SelectedMultiple}, nil
	case domain.ExerciseFillBlank:
		return assessment.FillBlankAnswer{Blanks: req.Blanks}, nil
	case domain.ExerciseOrderSteps:
		return assessment.OrderStepsAnswer{Steps: req.Steps}, nil
	case domain.ExerciseMatchPairs:
		pairs := make([]domain.MatchPair, len(req.Pairs))
		for i, p := range req.Pairs {
			pairs[i] = domain.MatchPair{Left: p.Left, Right: p.Right}
		}
		return assessment.MatchPairsAnswer{Pairs: pairs}, nil
	case domain.ExerciseFreeText:
		return assessment.FreeTextAnswer{Text: req.Text}, nil
	case domain.ExerciseScenario:
		return assessment.ScenarioAnswer{Choices: req.Choices}, nil
	case domain.ExerciseInAppMission:
		return nil, errors.New("les missions in-app ne s'évaluent pas via cet endpoint")
	}
	return nil, fmt.Errorf("type d'exercice non supporté : %q", kind)
}

func toEvaluationResponse(
	res assessment.Result,
	xpAwarded int,
	status domain.LessonStatus,
) EvaluationResponse {
	dto := EvaluationResponse{
		Score:           res.Score,
		Correct:         res.Correct,
		FeedbackMD:      res.FeedbackMD,
		ConceptsTouched: append([]string{}, res.ConceptsTouched...),
		XPAwarded:       xpAwarded,
		LessonStatus:    string(status),
	}
	if res.Details != nil {
		dto.Details = &ResultDetailsDTO{
			MatchedKeywords: append([]string{}, res.Details.MatchedKeywords...),
			MissingKeywords: append([]string{}, res.Details.MissingKeywords...),
			WordCount:       res.Details.WordCount,
		}
		dto.Details.BlankResults = toSubResults(res.Details.BlankResults)
		dto.Details.PairResults = toSubResults(res.Details.PairResults)
		dto.Details.StepResults = toSubResults(res.Details.StepResults)
		dto.Details.ScenarioResults = toSubResults(res.Details.ScenarioResults)
	}
	return dto
}

func toSubResults(in []assessment.SubResult) []SubResultDTO {
	if len(in) == 0 {
		return nil
	}
	out := make([]SubResultDTO, len(in))
	for i, s := range in {
		out[i] = SubResultDTO{
			Index:    s.Index,
			Expected: s.Expected,
			Got:      s.Got,
			Correct:  s.Correct,
		}
	}
	return out
}