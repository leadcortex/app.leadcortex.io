package curriculum

import (
	"encoding/json"
	"fmt"

	"github.com/leadcortex/academy/internal/domain"
)

// Parse convertit un ProgramYAML en domain.Program validé unitairement.
//
// La validation croisée (références inter-entités, cycles) est effectuée
// ensuite par validator.ValidateAll.
func Parse(src ProgramYAML) (*domain.Program, error) {
	program := &domain.Program{
		ID:               src.ID,
		Order:            src.Order,
		Title:            src.Title,
		Subtitle:         src.Subtitle,
		Description:      src.Description,
		Icon:             src.Icon,
		Color:            src.Color,
		Difficulty:       src.Difficulty,
		Prerequisites:    parseProgramPrereq(src.Prerequisites),
		EstimatedMinutes: 0,
		Modules:          make([]domain.Module, 0, len(src.Modules)),
	}

	concepts := make(map[string]domain.Concept, len(src.Concepts))
	for i, c := range src.Concepts {
		concept := domain.Concept{
			ID:          c.ID,
			Label:       c.Label,
			Description: c.Description,
		}
		if err := concept.Validate(); err != nil {
			return nil, fmt.Errorf("programme %s : concept[%d] : %w", src.ID, i, err)
		}
		if _, dup := concepts[concept.ID]; dup {
			return nil, fmt.Errorf("programme %s : concept dupliqué %q", src.ID, concept.ID)
		}
		concepts[concept.ID] = concept
	}

	for mi, m := range src.Modules {
		module, err := parseModule(m, src.ID, concepts)
		if err != nil {
			return nil, fmt.Errorf("programme %s : module[%d] : %w", src.ID, mi, err)
		}
		program.Modules = append(program.Modules, module)
	}

	for _, m := range program.Modules {
		program.EstimatedMinutes += m.EstimatedMinutes()
	}

	if err := program.Validate(); err != nil {
		return nil, err
	}
	return program, nil
}

func parseProgramPrereq(src ProgramPrereqYAML) domain.ProgramPrerequisites {
	return domain.ProgramPrerequisites{
		PreviousProgramIDs: src.PreviousProgramIDs,
		MinLevel:           src.MinLevel,
		MinXP:              src.MinXP,
	}
}

func parseModule(src ModuleYAML, programID string, concepts map[string]domain.Concept) (domain.Module, error) {
	module := domain.Module{
		ID:          src.ID,
		ProgramID:   programID,
		Order:       src.Order,
		Chapter:     src.Chapter,
		Title:       src.Title,
		Description: src.Description,
		Prerequisites: domain.ModulePrerequisites{
			PreviousModuleIDs:  src.Prerequisites.PreviousModuleIDs,
			RequiredConceptIDs: src.Prerequisites.RequiredConceptIDs,
		},
		Lessons: make([]domain.Lesson, 0, len(src.Lessons)),
	}

	for li, l := range src.Lessons {
		lesson, err := parseLesson(l, src.ID, concepts)
		if err != nil {
			return module, fmt.Errorf("leçon[%d] : %w", li, err)
		}
		module.Lessons = append(module.Lessons, lesson)
	}
	return module, nil
}

func parseLesson(src LessonYAML, moduleID string, concepts map[string]domain.Concept) (domain.Lesson, error) {
	lesson := domain.Lesson{
		ID:          src.ID,
		ModuleID:    moduleID,
		Order:       src.Order,
		Slug:        src.Slug,
		Title:       src.Title,
		Subtitle:    src.Subtitle,
		DurationMin: src.DurationMin,
		Difficulty:  src.Difficulty,
		XPTotal:     src.XPTotal,
		Concepts:    src.Concepts,
		Skills:      src.Skills,
		Prerequisites: domain.LessonPrerequisites{
			PreviousLessonIDs:  src.Prerequisites.PreviousLessonIDs,
			RequiredConceptIDs: src.Prerequisites.RequiredConceptIDs,
		},
		Unlocks: domain.LessonUnlocks{
			LessonIDs: src.Unlocks.LessonIDs,
			AvatarIDs: src.Unlocks.AvatarIDs,
			BadgeIDs:  src.Unlocks.BadgeIDs,
		},
		Rewards: domain.LessonRewards{
			XP:           src.Rewards.XP,
			HeartsRefund: src.Rewards.HeartsRefund,
		},
		Blocks:       make([]domain.Block, 0, len(src.Blocks)),
		SrsTemplates: parseSrsTemplates(src.SrsTemplates),
	}

	for bi, b := range src.Blocks {
		block, err := parseBlock(b, src.ID, concepts)
		if err != nil {
			return lesson, fmt.Errorf("bloc[%d] (%s) : %w", bi, b.Type, err)
		}
		lesson.Blocks = append(lesson.Blocks, block)
	}

	if err := lesson.Validate(); err != nil {
		return lesson, err
	}
	return lesson, nil
}

func parseSrsTemplates(src []SrsTemplateYAML) []domain.SrsCardTemplate {
	out := make([]domain.SrsCardTemplate, 0, len(src))
	for _, t := range src {
		out = append(out, domain.SrsCardTemplate{
			ConceptID: t.Concept,
			Front:     t.Front,
			Back:      t.Back,
		})
	}
	return out
}

func parseBlock(src BlockYAML, lessonID string, concepts map[string]domain.Concept) (domain.Block, error) {
	switch src.Type {
	case "cover":
		return parseCover(src.Cover), nil
	case "theory":
		return parseTheory(src.Theory), nil
	case "practice":
		return parsePractice(src.Practice, concepts)
	case "mission":
		return parseMission(src.Mission, lessonID, concepts)
	case "debrief":
		return parseDebrief(src.Debrief), nil
	}
	return nil, fmt.Errorf("type de bloc inconnu %q", src.Type)
}

func parseCover(src *CoverBlockYAML) domain.Block {
	if src == nil {
		return domain.CoverBlock{}
	}
	return domain.CoverBlock{
		Title:      src.Title,
		Subtitle:   src.Subtitle,
		MascotPose: src.MascotPose,
		MascotLine: src.MascotLine,
		Objectives: src.Objectives,
	}
}

func parseTheory(src *TheoryBlockYAML) domain.Block {
	if src == nil {
		return domain.TheoryBlock{}
	}
	slides := make([]domain.TheorySlide, 0, len(src.Slides))
	for _, s := range src.Slides {
		slides = append(slides, domain.TheorySlide{
			ID:         s.ID,
			Title:      s.Title,
			BodyMD:     s.BodyMD,
			Callout:    parseCallout(s.Callout),
			Quote:      parseQuote(s.Quote),
			Visual:     parseVisual(s.Visual),
			QuizInline: parseInlineQuiz(s.QuizInline),
		})
	}
	return domain.TheoryBlock{Slides: slides}
}

func parseCallout(src *CalloutYAML) *domain.Callout {
	if src == nil {
		return nil
	}
	return &domain.Callout{
		Tone:  domain.CalloutTone(src.Tone),
		Text:  src.Text,
		Title: src.Title,
	}
}

func parseQuote(src *QuoteYAML) *domain.Quote {
	if src == nil {
		return nil
	}
	return &domain.Quote{Text: src.Text, Author: src.Author}
}

func parseVisual(src *VisualYAML) *domain.Visual {
	if src == nil {
		return nil
	}
	return &domain.Visual{
		Kind:    domain.VisualKind(src.Kind),
		Asset:   src.Asset,
		Alt:     src.Alt,
		Caption: src.Caption,
		Payload: src.Payload,
	}
}

func parseInlineQuiz(src *InlineQuizYAML) *domain.InlineQuiz {
	if src == nil {
		return nil
	}
	return &domain.InlineQuiz{
		Question: src.Question,
		Options:  src.Options,
		Answer:   src.Answer,
	}
}

func parsePractice(src *PracticeBlockYAML, concepts map[string]domain.Concept) (domain.Block, error) {
	if src == nil {
		return domain.PracticeBlock{}, nil
	}
	exercises := make([]domain.Exercise, 0, len(src.Exercises))
	for _, e := range src.Exercises {
		ex, err := parseExercise(e, concepts)
		if err != nil {
			return nil, err
		}
		exercises = append(exercises, ex)
	}
	return domain.PracticeBlock{Exercises: exercises}, nil
}

func parseExercise(src ExerciseYAML, concepts map[string]domain.Concept) (domain.Exercise, error) {
	payload, err := parseExercisePayload(src)
	if err != nil {
		return domain.Exercise{}, fmt.Errorf("exercice %s : %w", src.ID, err)
	}
	ex := domain.Exercise{
		ID:            src.ID,
		Kind:          domain.ExerciseKind(src.Kind),
		Prompt:        src.Prompt,
		ExplanationMD: src.ExplanationMD,
		XP:            src.XP,
		Difficulty:    src.Difficulty,
		Concepts:      src.Concepts,
		Payload:       payload,
	}
	if err := ex.Validate(); err != nil {
		return domain.Exercise{}, err
	}
	return ex, nil
}

// decodePayload décode le payload dans la cible, en choisissant le
// décodeur selon la source (JSON d'abord, puis YAML).
//
// Le frontend fournit du JSON ; les tests peuvent encore utiliser du YAML.
func decodePayload(src ExerciseYAML, dst any) error {
	if len(src.PayloadJSON) > 0 {
		return json.Unmarshal(src.PayloadJSON, dst)
	}
	if src.PayloadYAML.Kind == 0 {
		return fmt.Errorf("payload absent (ni JSON ni YAML)")
	}
	return src.PayloadYAML.Decode(dst)
}

func parseExercisePayload(src ExerciseYAML) (domain.ExercisePayload, error) {
	switch domain.ExerciseKind(src.Kind) {
	case domain.ExerciseMCQ:
		var p struct {
			Options []string `yaml:"options" json:"options"`
			Correct int      `yaml:"correct" json:"correct"`
		}
		if err := decodePayload(src, &p); err != nil {
			return nil, fmt.Errorf("payload mcq : %w", err)
		}
		return domain.MCqPayload{Options: p.Options, Correct: p.Correct}, nil

	case domain.ExerciseMultiSelect:
		var p struct {
			Options []string `yaml:"options" json:"options"`
			Correct []int    `yaml:"correct" json:"correct"`
		}
		if err := decodePayload(src, &p); err != nil {
			return nil, fmt.Errorf("payload multi_select : %w", err)
		}
		return domain.MultiSelectPayload{Options: p.Options, Correct: p.Correct}, nil

	case domain.ExerciseFillBlank:
		var p struct {
			Blanks []struct {
				Correct []string `yaml:"correct" json:"correct"`
			} `yaml:"blanks" json:"blanks"`
		}
		if err := decodePayload(src, &p); err != nil {
			return nil, fmt.Errorf("payload fill_blank : %w", err)
		}
		blanks := make([]domain.Blank, 0, len(p.Blanks))
		for _, b := range p.Blanks {
			blanks = append(blanks, domain.Blank{Correct: b.Correct})
		}
		return domain.FillBlankPayload{Blanks: blanks}, nil

	case domain.ExerciseOrderSteps:
		var p struct {
			Steps []string `yaml:"steps" json:"steps"`
		}
		if err := decodePayload(src, &p); err != nil {
			return nil, fmt.Errorf("payload order_steps : %w", err)
		}
		return domain.OrderStepsPayload{Steps: p.Steps}, nil

	case domain.ExerciseMatchPairs:
		var p struct {
			Pairs []domain.MatchPair `yaml:"pairs" json:"pairs"`
		}
		if err := decodePayload(src, &p); err != nil {
			return nil, fmt.Errorf("payload match_pairs : %w", err)
		}
		return domain.MatchPairsPayload{Pairs: p.Pairs}, nil

	case domain.ExerciseFreeText:
		var p struct {
			MinWords         int      `yaml:"min_words" json:"min_words"`
			MaxWords         int      `yaml:"max_words" json:"max_words"`
			RubricMD         string   `yaml:"rubric_md" json:"rubric_md"`
			ExpectedKeywords []string `yaml:"expected_keywords" json:"expected_keywords"`
		}
		if err := decodePayload(src, &p); err != nil {
			return nil, fmt.Errorf("payload free_text : %w", err)
		}
		return domain.FreeTextPayload{
			MinWords:         p.MinWords,
			MaxWords:         p.MaxWords,
			RubricMD:         p.RubricMD,
			ExpectedKeywords: p.ExpectedKeywords,
		}, nil

	case domain.ExerciseScenario:
		var p struct {
			Steps []domain.ScenarioStep `yaml:"steps" json:"steps"`
		}
		if err := decodePayload(src, &p); err != nil {
			return nil, fmt.Errorf("payload scenario : %w", err)
		}
		return domain.ScenarioPayload{Steps: p.Steps}, nil

	case domain.ExerciseInAppMission:
		var p struct {
			MissionID string `yaml:"mission_id" json:"mission_id"`
		}
		if err := decodePayload(src, &p); err != nil {
			return nil, fmt.Errorf("payload in_app_mission : %w", err)
		}
		return domain.InAppMissionPayload{MissionID: p.MissionID}, nil

	default:
		return nil, fmt.Errorf("type d'exercice inconnu : %q", src.Kind)
	}
}

func parseMission(src *MissionBlockYAML, lessonID string, concepts map[string]domain.Concept) (domain.Block, error) {
	if src == nil {
		return domain.MissionBlock{}, nil
	}
	m := src.Mission
	conditions := make([]domain.Condition, 0, len(m.Validation.Conditions))
	for _, c := range m.Validation.Conditions {
		conditions = append(conditions, domain.Condition{
			Path:  c.Path,
			Op:    domain.Operator(c.Op),
			Value: c.Value,
		})
	}
	mission := domain.Mission{
		ID:       m.ID,
		LessonID: lessonID,
		Title:    m.Title,
		BriefMD:  m.BriefMD,
		Target:   domain.MissionTarget{Route: m.Target.Route, CTA: m.Target.CTA},
		Validation: domain.MissionValidation{
			Trigger:    m.Validation.Trigger,
			Conditions: domain.ConditionGroup{All: conditions},
		},
		OnSuccess: domain.MissionOnSuccess{
			XP:                m.OnSuccess.XP,
			MascotLine:        m.OnSuccess.MascotLine,
			UnlocksMissionIDs: m.OnSuccess.UnlocksMissionIDs,
			UnlocksAvatarIDs:  m.OnSuccess.UnlocksAvatarIDs,
			BadgeIDs:          m.OnSuccess.BadgeIDs,
		},
		OnFailure: domain.MissionOnFailure{
			FeedbackMD: m.OnFailure.FeedbackMD,
			HintMD:     m.OnFailure.HintMD,
		},
		HintAfterMinutes: m.HintAfterMinutes,
		RetryAllowed:     m.RetryAllowed,
	}
	if err := mission.Validate(); err != nil {
		return nil, err
	}
	return domain.MissionBlock{Mission: mission}, nil
}

func parseDebrief(src *DebriefBlockYAML) domain.Block {
	if src == nil {
		return domain.DebriefBlock{}
	}
	sections := make([]domain.DebriefSection, 0, len(src.Sections))
	for _, s := range src.Sections {
		sections = append(sections, domain.DebriefSection(s))
	}
	return domain.DebriefBlock{
		Sections:         sections,
		CustomMascotLine: src.CustomMascotLine,
	}
}