// backend/academy/internal/api/dto.go

package api

import (
	"github.com/leadcortex/academy/internal/domain"
)


type LearnerDTO struct {
	ID               string   `json:"id"`
	DisplayName      string   `json:"display_name"`
	Email            string   `json:"email,omitempty"`
	TenantID         string   `json:"tenant_id,omitempty"`
	XP               int      `json:"xp"`
	Level            int      `json:"level"`
	XPForNextLevel   int      `json:"xp_for_next_level"`
	LevelProgress    float64  `json:"level_progress"`
	StreakDays       int      `json:"streak_days"`
	BestStreakDays   int      `json:"best_streak_days"`
	Hearts           int      `json:"hearts"`
	MaxHearts        int      `json:"max_hearts"`
	UnlockedAvatarIDs []string `json:"unlocked_avatar_ids"`
	EquippedAvatarID string   `json:"equipped_avatar_id,omitempty"`
	EarnedBadgeIDs   []string `json:"earned_badge_ids"`
}

func ToLearnerDTO(l *domain.Learner) LearnerDTO {
	if l == nil {
		return LearnerDTO{}
	}
	dto := LearnerDTO{
		ID:                l.ID,
		DisplayName:       l.DisplayName,
		Email:             l.Email,
		TenantID:          l.TenantID,
		XP:                l.XP,
		Level:             l.Level,
		XPForNextLevel:    domain.XPForLevel(l.Level + 1),
		StreakDays:        l.StreakDays,
		BestStreakDays:    l.BestStreakDays,
		Hearts:            l.Hearts,
		MaxHearts:         domain.MaxHearts,
		UnlockedAvatarIDs: append([]string{}, l.UnlockedAvatarIDs...),
		EquippedAvatarID:  l.EquippedAvatarID,
	}
	for _, b := range l.EarnedBadges {
		dto.EarnedBadgeIDs = append(dto.EarnedBadgeIDs, b.BadgeID)
	}
	cur := domain.XPForLevel(l.Level)
	next := domain.XPForLevel(l.Level + 1)
	if next > cur {
		dto.LevelProgress = float64(l.XP-cur) / float64(next-cur)
	} else {
		dto.LevelProgress = 1
	}
	return dto
}


type ProgramDTO struct {
	ID               string      `json:"id"`
	Order            int         `json:"order"`
	Title            string      `json:"title"`
	Subtitle         string      `json:"subtitle"`
	Description      string      `json:"description"`
	Icon             string      `json:"icon"`
	Color            string      `json:"color"`
	Difficulty       int         `json:"difficulty"`
	EstimatedMinutes int         `json:"estimated_minutes"`
	TotalLessons     int         `json:"total_lessons"`
	Modules          []ModuleDTO `json:"modules,omitempty"`
}

type ModuleDTO struct {
	ID               string      `json:"id"`
	ProgramID        string      `json:"program_id"`
	Order            int         `json:"order"`
	Title            string      `json:"title"`
	Description      string      `json:"description"`
	EstimatedMinutes int         `json:"estimated_minutes"`
	TotalLessons     int         `json:"total_lessons"`
	Lessons          []LessonDTO `json:"lessons,omitempty"`
}

type LessonDTO struct {
	ID          string   `json:"id"`
	ModuleID    string   `json:"module_id"`
	Order       int      `json:"order"`
	Slug        string   `json:"slug"`
	Title       string   `json:"title"`
	Subtitle    string   `json:"subtitle"`
	DurationMin int      `json:"duration_min"`
	Difficulty  int      `json:"difficulty"`
	XPTotal     int      `json:"xp_total"`
	Concepts    []string `json:"concepts,omitempty"`
	Skills      []string `json:"skills,omitempty"`
	BlockCount  int      `json:"block_count"`
}

type LessonDetailDTO struct {
	LessonDTO
	Blocks []BlockDTO `json:"blocks"`
}

type BlockDTO struct {
	Index    int              `json:"index"`
	Type     string           `json:"type"`
	Cover    *CoverBlockDTO   `json:"cover,omitempty"`
	Theory   *TheoryBlockDTO  `json:"theory,omitempty"`
	Practice *PracticeBlockDTO `json:"practice,omitempty"`
	Mission  *MissionBlockDTO `json:"mission,omitempty"`
	Debrief  *DebriefBlockDTO `json:"debrief,omitempty"`
}

type CoverBlockDTO struct {
	Title      string   `json:"title"`
	Subtitle   string   `json:"subtitle,omitempty"`
	MascotPose string   `json:"mascot_pose,omitempty"`
	MascotLine string   `json:"mascot_line,omitempty"`
	Objectives []string `json:"objectives"`
}

type TheoryBlockDTO struct {
	Slides []TheorySlideDTO `json:"slides"`
}

type TheorySlideDTO struct {
	ID         string         `json:"id"`
	Title      string         `json:"title"`
	BodyMD     string         `json:"body_md,omitempty"`
	Callout    *CalloutDTO    `json:"callout,omitempty"`
	Quote      *QuoteDTO      `json:"quote,omitempty"`
	Visual     *VisualDTO     `json:"visual,omitempty"`
	QuizInline *InlineQuizDTO `json:"quiz_inline,omitempty"`
}

type CalloutDTO struct {
	Tone  string `json:"tone"`
	Title string `json:"title,omitempty"`
	Text  string `json:"text"`
}

type QuoteDTO struct {
	Text   string `json:"text"`
	Author string `json:"author,omitempty"`
}

type VisualDTO struct {
	Kind    string         `json:"kind"`
	Asset   string         `json:"asset,omitempty"`
	Alt     string         `json:"alt,omitempty"`
	Caption string         `json:"caption,omitempty"`
	Payload map[string]any `json:"payload,omitempty"`
}

type InlineQuizDTO struct {
	Question string   `json:"question"`
	Options  []string `json:"options"`
	Answer   int      `json:"answer"`
}

type PracticeBlockDTO struct {
	Exercises []ExerciseDTO `json:"exercises"`
}

type MissionBlockDTO struct {
	Mission MissionDTO `json:"mission"`
}

type DebriefBlockDTO struct {
	Sections         []string `json:"sections"`
	CustomMascotLine string   `json:"custom_mascot_line,omitempty"`
}


type ExerciseDTO struct {
	ID         string   `json:"id"`
	Kind       string   `json:"kind"`
	Prompt     string   `json:"prompt"`
	XP         int      `json:"xp"`
	Difficulty int      `json:"difficulty"`
	Concepts   []string `json:"concepts,omitempty"`
	Payload    any      `json:"payload"`
}

type MCqPayloadDTO struct {
	Options []string `json:"options"`
}

type MultiSelectPayloadDTO struct {
	Options []string `json:"options"`
}

type FillBlankPayloadDTO struct {
	BlankCount int `json:"blank_count"`
}

type OrderStepsPayloadDTO struct {
	Steps []string `json:"steps"`
}

type MatchPairsPayloadDTO struct {
	Pairs []MatchPairDTO `json:"pairs"`
}

type MatchPairDTO struct {
	Left  string `json:"left"`
	Right string `json:"right"`
}

type FreeTextPayloadDTO struct {
	MinWords int `json:"min_words"`
	MaxWords int `json:"max_words,omitempty"`
}

type ScenarioPayloadDTO struct {
	Steps []ScenarioStepDTO `json:"steps"`
}

type ScenarioStepDTO struct {
	ID        string   `json:"id"`
	Situation string   `json:"situation"`
	Question  string   `json:"question"`
	Choices   []string `json:"choices"`
}

type InAppMissionPayloadDTO struct {
	MissionID string `json:"mission_id"`
}


type MissionDTO struct {
	ID               string                `json:"id"`
	LessonID         string                `json:"lesson_id"`
	Title            string                `json:"title"`
	BriefMD          string                `json:"brief_md"`
	Target           MissionTargetDTO      `json:"target"`
	Trigger          string                `json:"trigger,omitempty"`
	HintAfterMinutes int                   `json:"hint_after_minutes,omitempty"`
	RetryAllowed     bool                  `json:"retry_allowed"`
	OnSuccess        MissionOnSuccessDTO   `json:"on_success"`
	OnFailure        MissionOnFailureDTO   `json:"on_failure"`
}

type MissionTargetDTO struct {
	Route string `json:"route"`
	CTA   string `json:"cta"`
}

type MissionOnSuccessDTO struct {
	XP         int    `json:"xp"`
	MascotLine string `json:"mascot_line,omitempty"`
}

type MissionOnFailureDTO struct {
	FeedbackMD string `json:"feedback_md"`
	HintMD     string `json:"hint_md,omitempty"`
}


type EvaluationResponse struct {
	Score           int               `json:"score"`
	Correct         bool              `json:"correct"`
	FeedbackMD      string            `json:"feedback_md"`
	ConceptsTouched []string          `json:"concepts_touched,omitempty"`
	Details         *ResultDetailsDTO `json:"details,omitempty"`
	XPAwarded       int               `json:"xp_awarded"`
	LessonStatus    string            `json:"lesson_status,omitempty"`
}

type ResultDetailsDTO struct {
	BlankResults    []SubResultDTO `json:"blank_results,omitempty"`
	PairResults     []SubResultDTO `json:"pair_results,omitempty"`
	StepResults     []SubResultDTO `json:"step_results,omitempty"`
	ScenarioResults []SubResultDTO `json:"scenario_results,omitempty"`
	MatchedKeywords []string       `json:"matched_keywords,omitempty"`
	MissingKeywords []string       `json:"missing_keywords,omitempty"`
	WordCount       int            `json:"word_count,omitempty"`
}

type SubResultDTO struct {
	Index    int    `json:"index"`
	Expected string `json:"expected,omitempty"`
	Got      string `json:"got,omitempty"`
	Correct  bool   `json:"correct"`
}


type EquipAvatarRequest struct {
	AvatarID string `json:"avatar_id"`
}

type ViewBlockRequest struct {
	SlidesConsumed int `json:"slides_consumed,omitempty"`
}

type AnswerExerciseRequest struct {
	Kind string `json:"kind"`

	Selected int `json:"selected,omitempty"`

	SelectedMultiple []int `json:"selected_multiple,omitempty"`

	Blanks []string `json:"blanks,omitempty"`

	Steps []string `json:"steps,omitempty"`

	Pairs []MatchPairDTO `json:"pairs,omitempty"`

	Text string `json:"text,omitempty"`

	Choices []int `json:"choices,omitempty"`
}

type MissionAttemptRequest struct {
	Payload map[string]any `json:"payload,omitempty"`
}

type ReviewCardRequest struct {
	Button string `json:"button"`
}

type PlanSessionRequest struct {
	Mode string `json:"mode"`
}

type PublishEventRequest struct {
	Kind    string         `json:"kind"`
	At      string         `json:"at,omitempty"`
	Payload map[string]any `json:"payload,omitempty"`
}


func ToProgramSummaryDTO(p *domain.Program) ProgramDTO {
	if p == nil {
		return ProgramDTO{}
	}
	return ProgramDTO{
		ID:               p.ID,
		Order:            p.Order,
		Title:            p.Title,
		Subtitle:         p.Subtitle,
		Description:      p.Description,
		Icon:             p.Icon,
		Color:            p.Color,
		Difficulty:       p.Difficulty,
		EstimatedMinutes: p.EstimatedMinutes,
		TotalLessons:     p.TotalLessons(),
	}
}

func ToProgramDTO(p *domain.Program) ProgramDTO {
	dto := ToProgramSummaryDTO(p)
	if p == nil {
		return dto
	}
	dto.Modules = make([]ModuleDTO, 0, len(p.Modules))
	for i := range p.Modules {
		dto.Modules = append(dto.Modules, ToModuleDTO(&p.Modules[i]))
	}
	return dto
}

func ToModuleDTO(m *domain.Module) ModuleDTO {
	if m == nil {
		return ModuleDTO{}
	}
	dto := ModuleDTO{
		ID:               m.ID,
		ProgramID:        m.ProgramID,
		Order:            m.Order,
		Title:            m.Title,
		Description:      m.Description,
		EstimatedMinutes: m.EstimatedMinutes(),
		TotalLessons:     len(m.Lessons),
	}
	dto.Lessons = make([]LessonDTO, 0, len(m.Lessons))
	for i := range m.Lessons {
		dto.Lessons = append(dto.Lessons, ToLessonDTO(&m.Lessons[i]))
	}
	return dto
}

func ToLessonDTO(l *domain.Lesson) LessonDTO {
	if l == nil {
		return LessonDTO{}
	}
	return LessonDTO{
		ID:          l.ID,
		ModuleID:    l.ModuleID,
		Order:       l.Order,
		Slug:        l.Slug,
		Title:       l.Title,
		Subtitle:    l.Subtitle,
		DurationMin: l.DurationMin,
		Difficulty:  l.Difficulty,
		XPTotal:     l.XPTotal,
		Concepts:    append([]string{}, l.Concepts...),
		Skills:      append([]string{}, l.Skills...),
		BlockCount:  len(l.Blocks),
	}
}

func ToLessonDetailDTO(l *domain.Lesson) LessonDetailDTO {
	dto := LessonDetailDTO{LessonDTO: ToLessonDTO(l)}
	if l == nil {
		return dto
	}
	dto.Blocks = make([]BlockDTO, 0, len(l.Blocks))
	for i, b := range l.Blocks {
		dto.Blocks = append(dto.Blocks, toBlockDTO(i, b))
	}
	return dto
}

func ToExerciseDTO(e domain.Exercise) ExerciseDTO {
	dto := ExerciseDTO{
		ID:         e.ID,
		Kind:       string(e.Kind),
		Prompt:     e.Prompt,
		XP:         e.XP,
		Difficulty: e.Difficulty,
		Concepts:   append([]string{}, e.Concepts...),
	}
	switch p := e.Payload.(type) {
	case domain.MCqPayload:
		dto.Payload = MCqPayloadDTO{Options: append([]string{}, p.Options...)}
	case domain.MultiSelectPayload:
		dto.Payload = MultiSelectPayloadDTO{Options: append([]string{}, p.Options...)}
	case domain.FillBlankPayload:
		dto.Payload = FillBlankPayloadDTO{BlankCount: len(p.Blanks)}
	case domain.OrderStepsPayload:
		dto.Payload = OrderStepsPayloadDTO{Steps: append([]string{}, p.Steps...)}
	case domain.MatchPairsPayload:
		pairs := make([]MatchPairDTO, len(p.Pairs))
		for i, mp := range p.Pairs {
			pairs[i] = MatchPairDTO{Left: mp.Left, Right: mp.Right}
		}
		dto.Payload = MatchPairsPayloadDTO{Pairs: pairs}
	case domain.FreeTextPayload:
		dto.Payload = FreeTextPayloadDTO{MinWords: p.MinWords, MaxWords: p.MaxWords}
	case domain.ScenarioPayload:
		steps := make([]ScenarioStepDTO, len(p.Steps))
		for i, s := range p.Steps {
			choices := make([]string, len(s.Choices))
			for j, c := range s.Choices {
				choices[j] = c.Label
			}
			steps[i] = ScenarioStepDTO{
				ID:        s.ID,
				Situation: s.Situation,
				Question:  s.Question,
				Choices:   choices,
			}
		}
		dto.Payload = ScenarioPayloadDTO{Steps: steps}
	case domain.InAppMissionPayload:
		dto.Payload = InAppMissionPayloadDTO{MissionID: p.MissionID}
	default:
		dto.Payload = nil
	}
	return dto
}

func ToMissionDTO(m domain.Mission) MissionDTO {
	return MissionDTO{
		ID:       m.ID,
		LessonID: m.LessonID,
		Title:    m.Title,
		BriefMD:  m.BriefMD,
		Target: MissionTargetDTO{
			Route: m.Target.Route,
			CTA:   m.Target.CTA,
		},
		Trigger:          m.Validation.Trigger,
		HintAfterMinutes: m.HintAfterMinutes,
		RetryAllowed:     m.RetryAllowed,
		OnSuccess: MissionOnSuccessDTO{
			XP:         m.OnSuccess.XP,
			MascotLine: m.OnSuccess.MascotLine,
		},
		OnFailure: MissionOnFailureDTO{
			FeedbackMD: m.OnFailure.FeedbackMD,
			HintMD:     m.OnFailure.HintMD,
		},
	}
}


func toBlockDTO(index int, b domain.Block) BlockDTO {
	switch blk := b.(type) {
	case domain.CoverBlock:
		return BlockDTO{
			Index: index, Type: "cover",
			Cover: &CoverBlockDTO{
				Title:      blk.Title,
				Subtitle:   blk.Subtitle,
				MascotPose: blk.MascotPose,
				MascotLine: blk.MascotLine,
				Objectives: append([]string{}, blk.Objectives...),
			},
		}
	case domain.TheoryBlock:
		slides := make([]TheorySlideDTO, len(blk.Slides))
		for i, s := range blk.Slides {
			slides[i] = toTheorySlideDTO(s)
		}
		return BlockDTO{
			Index: index, Type: "theory",
			Theory: &TheoryBlockDTO{Slides: slides},
		}
	case domain.PracticeBlock:
		exercises := make([]ExerciseDTO, len(blk.Exercises))
		for i, e := range blk.Exercises {
			exercises[i] = ToExerciseDTO(e)
		}
		return BlockDTO{
			Index: index, Type: "practice",
			Practice: &PracticeBlockDTO{Exercises: exercises},
		}
	case domain.MissionBlock:
		return BlockDTO{
			Index: index, Type: "mission",
			Mission: &MissionBlockDTO{Mission: ToMissionDTO(blk.Mission)},
		}
	case domain.DebriefBlock:
		sections := make([]string, len(blk.Sections))
		for i, s := range blk.Sections {
			sections[i] = string(s)
		}
		return BlockDTO{
			Index: index, Type: "debrief",
			Debrief: &DebriefBlockDTO{
				Sections:         sections,
				CustomMascotLine: blk.CustomMascotLine,
			},
		}
	default:
		return BlockDTO{Index: index, Type: "unknown"}
	}
}

func toTheorySlideDTO(s domain.TheorySlide) TheorySlideDTO {
	dto := TheorySlideDTO{
		ID:     s.ID,
		Title:  s.Title,
		BodyMD: s.BodyMD,
	}
	if s.Callout != nil {
		dto.Callout = &CalloutDTO{
			Tone:  string(s.Callout.Tone),
			Title: s.Callout.Title,
			Text:  s.Callout.Text,
		}
	}
	if s.Quote != nil {
		dto.Quote = &QuoteDTO{Text: s.Quote.Text, Author: s.Quote.Author}
	}
	if s.Visual != nil {
		dto.Visual = &VisualDTO{
			Kind:    string(s.Visual.Kind),
			Asset:   s.Visual.Asset,
			Alt:     s.Visual.Alt,
			Caption: s.Visual.Caption,
			Payload: s.Visual.Payload,
		}
	}
	if s.QuizInline != nil {
		dto.QuizInline = &InlineQuizDTO{
			Question: s.QuizInline.Question,
			Options:  append([]string{}, s.QuizInline.Options...),
			Answer:   s.QuizInline.Answer,
		}
	}
	return dto
}