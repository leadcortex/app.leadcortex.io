package curriculum

import (
	"fmt"

	"gopkg.in/yaml.v3"
)

// ─── Racine ─────────────────────────────────────────────────────────────

// ProgramYAML est la représentation brute d'un programme YAML.
// Cette struct reflète le schéma public ; elle est convertie en
// domain.Program par le parser.
type ProgramYAML struct {
	SchemaVersion string       `yaml:"schema_version"`
	ID            string       `yaml:"id"`
	Order         int          `yaml:"order"`
	Title         string       `yaml:"title"`
	Subtitle      string       `yaml:"subtitle"`
	Description   string       `yaml:"description"`
	Icon          string       `yaml:"icon"`
	Color         string       `yaml:"color"`
	Difficulty    int          `yaml:"difficulty"`
	Language      string       `yaml:"language"`
	Authors       []string     `yaml:"authors"`

	Prerequisites ProgramPrereqYAML `yaml:"prerequisites"`
	Concepts      []ConceptYAML     `yaml:"concepts"`
	Modules       []ModuleYAML      `yaml:"modules"`
	Avatars       []AvatarYAML      `yaml:"avatars"`
	Badges        []BadgeYAML       `yaml:"badges"`
}

// ProgramPrereqYAML — prérequis d'un programme.
type ProgramPrereqYAML struct {
	PreviousProgramIDs []string `yaml:"previous_program_ids"`
	MinLevel           int      `yaml:"min_level"`
	MinXP              int      `yaml:"min_xp"`
}

// ConceptYAML — déclaration d'un concept.
type ConceptYAML struct {
	ID          string `yaml:"id"`
	Label       string `yaml:"label"`
	Description string `yaml:"description"`
}

// ─── Module ─────────────────────────────────────────────────────────────

type ModuleYAML struct {
	ID            string            `yaml:"id"`
	Order         int               `yaml:"order"`
	Title         string            `yaml:"title"`
	Description   string            `yaml:"description"`
	Prerequisites ModulePrereqYAML  `yaml:"prerequisites"`
	Lessons       []LessonYAML      `yaml:"lessons"`
}

type ModulePrereqYAML struct {
	PreviousModuleIDs  []string `yaml:"previous_module_ids"`
	RequiredConceptIDs []string `yaml:"required_concept_ids"`
}

// ─── Leçon ──────────────────────────────────────────────────────────────

type LessonYAML struct {
	ID          string   `yaml:"id"`
	Order       int      `yaml:"order"`
	Slug        string   `yaml:"slug"`
	Title       string   `yaml:"title"`
	Subtitle    string   `yaml:"subtitle"`
	DurationMin int      `yaml:"duration_min"`
	Difficulty  int      `yaml:"difficulty"`
	XPTotal     int      `yaml:"xp_total"`
	Concepts    []string `yaml:"concepts"`
	Skills      []string `yaml:"skills"`

	Prerequisites LessonPrereqYAML `yaml:"prerequisites"`
	Unlocks       LessonUnlocksYAML `yaml:"unlocks"`
	Rewards       LessonRewardsYAML `yaml:"rewards"`
	Blocks        []BlockYAML      `yaml:"blocks"`
	SrsTemplates  []SrsTemplateYAML `yaml:"srs_templates"`
}

type LessonPrereqYAML struct {
	PreviousLessonIDs  []string `yaml:"previous_lesson_ids"`
	RequiredConceptIDs []string `yaml:"required_concept_ids"`
}

type LessonUnlocksYAML struct {
	LessonIDs []string `yaml:"lesson_ids"`
	AvatarIDs []string `yaml:"avatar_ids"`
	BadgeIDs  []string `yaml:"badge_ids"`
}

type LessonRewardsYAML struct {
	XP           int `yaml:"xp"`
	HeartsRefund int `yaml:"hearts_refund"`
}

type SrsTemplateYAML struct {
	Concept string `yaml:"concept"`
	Front   string `yaml:"front"`
	Back    string `yaml:"back"`
}

// ─── Bloc polymorphe ────────────────────────────────────────────────────

// BlockYAML est un bloc polymorphe discriminé par `type`.
// Un seul des champs Cover/Theory/Practice/Mission/Debrief est non-nil.
type BlockYAML struct {
	Type     string
	Cover    *CoverBlockYAML
	Theory   *TheoryBlockYAML
	Practice *PracticeBlockYAML
	Mission  *MissionBlockYAML
	Debrief  *DebriefBlockYAML
}

// UnmarshalYAML implémente la logique de dispatch sur `type`.
func (b *BlockYAML) UnmarshalYAML(node *yaml.Node) error {
	var head struct {
		Type string `yaml:"type"`
	}
	if err := node.Decode(&head); err != nil {
		return fmt.Errorf("block : champ 'type' manquant ou invalide : %w", err)
	}
	b.Type = head.Type

	switch head.Type {
	case "cover":
		var v CoverBlockYAML
		if err := node.Decode(&v); err != nil {
			return fmt.Errorf("block cover : %w", err)
		}
		b.Cover = &v
	case "theory":
		var v TheoryBlockYAML
		if err := node.Decode(&v); err != nil {
			return fmt.Errorf("block theory : %w", err)
		}
		b.Theory = &v
	case "practice":
		var v PracticeBlockYAML
		if err := node.Decode(&v); err != nil {
			return fmt.Errorf("block practice : %w", err)
		}
		b.Practice = &v
	case "mission":
		var v MissionBlockYAML
		if err := node.Decode(&v); err != nil {
			return fmt.Errorf("block mission : %w", err)
		}
		b.Mission = &v
	case "debrief":
		var v DebriefBlockYAML
		if err := node.Decode(&v); err != nil {
			return fmt.Errorf("block debrief : %w", err)
		}
		b.Debrief = &v
	default:
		return fmt.Errorf("block : type inconnu %q (attendu : cover|theory|practice|mission|debrief)", head.Type)
	}
	return nil
}

// ─── Cover ──────────────────────────────────────────────────────────────

type CoverBlockYAML struct {
	Title      string   `yaml:"title"`
	Subtitle   string   `yaml:"subtitle"`
	MascotPose string   `yaml:"mascot_pose"`
	MascotLine string   `yaml:"mascot_line"`
	Objectives []string `yaml:"objectives"`
}

// ─── Theory ─────────────────────────────────────────────────────────────

type TheoryBlockYAML struct {
	Slides []TheorySlideYAML `yaml:"slides"`
}

type TheorySlideYAML struct {
	ID         string          `yaml:"id"`
	Title      string          `yaml:"title"`
	BodyMD     string          `yaml:"body_md"`
	Callout    *CalloutYAML    `yaml:"callout"`
	Quote      *QuoteYAML      `yaml:"quote"`
	Visual     *VisualYAML     `yaml:"visual"`
	QuizInline *InlineQuizYAML `yaml:"quiz_inline"`
}

type CalloutYAML struct {
	Tone  string `yaml:"tone"`
	Text  string `yaml:"text"`
	Title string `yaml:"title"`
}

type QuoteYAML struct {
	Text   string `yaml:"text"`
	Author string `yaml:"author"`
}

type VisualYAML struct {
	Kind    string         `yaml:"kind"`
	Asset   string         `yaml:"asset"`
	Alt     string         `yaml:"alt"`
	Caption string         `yaml:"caption"`
	Payload map[string]any `yaml:"payload"`
}

type InlineQuizYAML struct {
	Question string   `yaml:"question"`
	Options  []string `yaml:"options"`
	Answer   int      `yaml:"answer"`
}

// ─── Practice ───────────────────────────────────────────────────────────

type PracticeBlockYAML struct {
	Exercises []ExerciseYAML `yaml:"exercises"`
}

// ExerciseYAML est polymorphe sur `kind`. Le champ Payload est décodé
// séparément selon le kind.
type ExerciseYAML struct {
	ID            string    `yaml:"id"`
	Kind          string    `yaml:"kind"`
	Prompt        string    `yaml:"prompt"`
	ExplanationMD string    `yaml:"explanation_md"`
	XP            int       `yaml:"xp"`
	Difficulty    int       `yaml:"difficulty"`
	Concepts      []string  `yaml:"concepts"`
	Payload       yaml.Node `yaml:"payload"`
}

// ─── Mission ────────────────────────────────────────────────────────────

type MissionBlockYAML struct {
	Mission MissionYAML `yaml:"mission"`
}

type MissionYAML struct {
	ID               string            `yaml:"id"`
	Title            string            `yaml:"title"`
	BriefMD          string            `yaml:"brief_md"`
	Target           MissionTargetYAML `yaml:"target"`
	Validation       MissionValidYAML  `yaml:"validation"`
	OnSuccess        MissionSuccessYAML `yaml:"on_success"`
	OnFailure        MissionFailureYAML `yaml:"on_failure"`
	HintAfterMinutes int               `yaml:"hint_after_minutes"`
	RetryAllowed     bool              `yaml:"retry_allowed"`
}

type MissionTargetYAML struct {
	Route string `yaml:"route"`
	CTA   string `yaml:"cta"`
}

type MissionValidYAML struct {
	Trigger    string          `yaml:"trigger"`
	Conditions []ConditionYAML `yaml:"conditions"`
}

type ConditionYAML struct {
	Path  string `yaml:"path"`
	Op    string `yaml:"op"`
	Value any    `yaml:"value"`
}

type MissionSuccessYAML struct {
	XP                int      `yaml:"xp"`
	MascotLine        string   `yaml:"mascot_line"`
	UnlocksMissionIDs []string `yaml:"unlocks_mission_ids"`
	UnlocksAvatarIDs  []string `yaml:"unlocks_avatar_ids"`
	BadgeIDs          []string `yaml:"badge_ids"`
}

type MissionFailureYAML struct {
	FeedbackMD string `yaml:"feedback_md"`
	HintMD     string `yaml:"hint_md"`
}

// ─── Debrief ────────────────────────────────────────────────────────────

type DebriefBlockYAML struct {
	Sections         []string `yaml:"sections"`
	CustomMascotLine string   `yaml:"custom_mascot_line"`
}

// ─── Avatar / Badge (déclarations inline) ───────────────────────────────

type AvatarYAML struct {
	ID          string         `yaml:"id"`
	Name        string         `yaml:"name"`
	Tier        string         `yaml:"tier"`
	Description string         `yaml:"description"`
	SVGPath     string         `yaml:"svg_path"`
	DefaultPose string         `yaml:"default_pose"`
	Poses       []AvatarPoseYAML `yaml:"poses"`
	Unlock      AvatarUnlockYAML `yaml:"unlock"`
}

type AvatarPoseYAML struct {
	Key       string `yaml:"key"`
	Label     string `yaml:"label"`
	IsDefault bool   `yaml:"is_default"`
}

type AvatarUnlockYAML struct {
	Kind        string `yaml:"kind"`
	Value       string `yaml:"value"`
	Description string `yaml:"description"`
}

type BadgeYAML struct {
	ID          string          `yaml:"id"`
	Name        string          `yaml:"name"`
	Description string          `yaml:"description"`
	Icon        string          `yaml:"icon"`
	Color       string          `yaml:"color"`
	Category    string          `yaml:"category"`
	Rarity      string          `yaml:"rarity"`
	Conditions  []ConditionYAML `yaml:"conditions"`
}