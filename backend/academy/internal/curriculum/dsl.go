package curriculum

import (
	"encoding/json"
	"fmt"

	"gopkg.in/yaml.v3"
)

// ─── Racine ─────────────────────────────────────────────────────────────

// ProgramYAML est la représentation brute d'un programme.
// Les structs de ce fichier portent à la fois des tags YAML et JSON :
// le loader choisit le décodeur selon l'extension du fichier.
type ProgramYAML struct {
	SchemaVersion string   `yaml:"schema_version" json:"schema_version"`
	ID            string   `yaml:"id" json:"id"`
	Order         int      `yaml:"order" json:"order"`
	Title         string   `yaml:"title" json:"title"`
	Subtitle      string   `yaml:"subtitle" json:"subtitle"`
	Description   string   `yaml:"description" json:"description"`
	Icon          string   `yaml:"icon" json:"icon"`
	Color         string   `yaml:"color" json:"color"`
	Difficulty    int      `yaml:"difficulty" json:"difficulty"`
	Language      string   `yaml:"language" json:"language"`
	Authors       []string `yaml:"authors" json:"authors"`

	Prerequisites ProgramPrereqYAML `yaml:"prerequisites" json:"prerequisites"`
	Concepts      []ConceptYAML     `yaml:"concepts" json:"concepts"`
	Modules       []ModuleYAML      `yaml:"modules" json:"modules"`
	Avatars       []AvatarYAML      `yaml:"avatars" json:"avatars,omitempty"`
	Badges        []BadgeYAML       `yaml:"badges" json:"badges,omitempty"`
}

// ProgramPrereqYAML — prérequis d'un programme.
type ProgramPrereqYAML struct {
	PreviousProgramIDs []string `yaml:"previous_program_ids" json:"previous_program_ids"`
	MinLevel           int      `yaml:"min_level" json:"min_level"`
	MinXP              int      `yaml:"min_xp" json:"min_xp"`
}

// ConceptYAML — déclaration d'un concept.
type ConceptYAML struct {
	ID          string `yaml:"id" json:"id"`
	Label       string `yaml:"label" json:"label"`
	Description string `yaml:"description" json:"description"`
}

// ─── Module ─────────────────────────────────────────────────────────────

type ModuleYAML struct {
	ID            string           `yaml:"id" json:"id"`
	Order         int              `yaml:"order" json:"order"`
	Chapter       int              `yaml:"chapter" json:"chapter"`
	Title         string           `yaml:"title" json:"title"`
	Description   string           `yaml:"description" json:"description"`
	Prerequisites ModulePrereqYAML `yaml:"prerequisites" json:"prerequisites"`
	Lessons       []LessonYAML     `yaml:"lessons" json:"lessons"`
}

type ModulePrereqYAML struct {
	PreviousModuleIDs  []string `yaml:"previous_module_ids" json:"previous_module_ids"`
	RequiredConceptIDs []string `yaml:"required_concept_ids" json:"required_concept_ids"`
}

// ─── Leçon ──────────────────────────────────────────────────────────────

type LessonYAML struct {
	ID          string   `yaml:"id" json:"id"`
	Order       int      `yaml:"order" json:"order"`
	Slug        string   `yaml:"slug" json:"slug"`
	Title       string   `yaml:"title" json:"title"`
	Subtitle    string   `yaml:"subtitle" json:"subtitle"`
	DurationMin int      `yaml:"duration_min" json:"duration_min"`
	Difficulty  int      `yaml:"difficulty" json:"difficulty"`
	XPTotal     int      `yaml:"xp_total" json:"xp_total"`
	Concepts    []string `yaml:"concepts" json:"concepts"`
	Skills      []string `yaml:"skills" json:"skills"`

	Prerequisites LessonPrereqYAML  `yaml:"prerequisites" json:"prerequisites"`
	Unlocks       LessonUnlocksYAML `yaml:"unlocks" json:"unlocks"`
	Rewards       LessonRewardsYAML `yaml:"rewards" json:"rewards"`
	Blocks        []BlockYAML       `yaml:"blocks" json:"blocks"`
	SrsTemplates  []SrsTemplateYAML `yaml:"srs_templates" json:"srs_templates"`
}

type LessonPrereqYAML struct {
	PreviousLessonIDs  []string `yaml:"previous_lesson_ids" json:"previous_lesson_ids"`
	RequiredConceptIDs []string `yaml:"required_concept_ids" json:"required_concept_ids"`
}

type LessonUnlocksYAML struct {
	LessonIDs []string `yaml:"lesson_ids" json:"lesson_ids"`
	AvatarIDs []string `yaml:"avatar_ids" json:"avatar_ids"`
	BadgeIDs  []string `yaml:"badge_ids" json:"badge_ids"`
}

type LessonRewardsYAML struct {
	XP           int `yaml:"xp" json:"xp"`
	HeartsRefund int `yaml:"hearts_refund" json:"hearts_refund"`
}

type SrsTemplateYAML struct {
	Concept string `yaml:"concept" json:"concept"`
	Front   string `yaml:"front" json:"front"`
	Back    string `yaml:"back" json:"back"`
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

// UnmarshalYAML implémente la logique de dispatch sur `type` (format YAML).
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

// UnmarshalJSON implémente la logique de dispatch sur `type` (format JSON).
// Le comportement est identique à UnmarshalYAML — juste le décodeur qui change.
func (b *BlockYAML) UnmarshalJSON(data []byte) error {
	var head struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(data, &head); err != nil {
		return fmt.Errorf("block : champ 'type' manquant ou invalide : %w", err)
	}
	b.Type = head.Type

	switch head.Type {
	case "cover":
		var v CoverBlockYAML
		if err := json.Unmarshal(data, &v); err != nil {
			return fmt.Errorf("block cover : %w", err)
		}
		b.Cover = &v
	case "theory":
		var v TheoryBlockYAML
		if err := json.Unmarshal(data, &v); err != nil {
			return fmt.Errorf("block theory : %w", err)
		}
		b.Theory = &v
	case "practice":
		var v PracticeBlockYAML
		if err := json.Unmarshal(data, &v); err != nil {
			return fmt.Errorf("block practice : %w", err)
		}
		b.Practice = &v
	case "mission":
		var v MissionBlockYAML
		if err := json.Unmarshal(data, &v); err != nil {
			return fmt.Errorf("block mission : %w", err)
		}
		b.Mission = &v
	case "debrief":
		var v DebriefBlockYAML
		if err := json.Unmarshal(data, &v); err != nil {
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
	Title      string   `yaml:"title" json:"title"`
	Subtitle   string   `yaml:"subtitle" json:"subtitle"`
	MascotPose string   `yaml:"mascot_pose" json:"mascot_pose"`
	MascotLine string   `yaml:"mascot_line" json:"mascot_line"`
	Objectives []string `yaml:"objectives" json:"objectives"`
}

// ─── Theory ─────────────────────────────────────────────────────────────

type TheoryBlockYAML struct {
	Slides []TheorySlideYAML `yaml:"slides" json:"slides"`
}

type TheorySlideYAML struct {
	ID         string          `yaml:"id" json:"id"`
	Title      string          `yaml:"title" json:"title"`
	BodyMD     string          `yaml:"body_md" json:"body_md"`
	Callout    *CalloutYAML    `yaml:"callout" json:"callout,omitempty"`
	Quote      *QuoteYAML      `yaml:"quote" json:"quote,omitempty"`
	Visual     *VisualYAML     `yaml:"visual" json:"visual,omitempty"`
	QuizInline *InlineQuizYAML `yaml:"quiz_inline" json:"quiz_inline,omitempty"`
}

type CalloutYAML struct {
	Tone  string `yaml:"tone" json:"tone"`
	Text  string `yaml:"text" json:"text"`
	Title string `yaml:"title" json:"title"`
}

type QuoteYAML struct {
	Text   string `yaml:"text" json:"text"`
	Author string `yaml:"author" json:"author"`
}

type VisualYAML struct {
	Kind    string         `yaml:"kind" json:"kind"`
	Asset   string         `yaml:"asset" json:"asset"`
	Alt     string         `yaml:"alt" json:"alt"`
	Caption string         `yaml:"caption" json:"caption"`
	Payload map[string]any `yaml:"payload" json:"payload,omitempty"`
}

type InlineQuizYAML struct {
	Question string   `yaml:"question" json:"question"`
	Options  []string `yaml:"options" json:"options"`
	Answer   int      `yaml:"answer" json:"answer"`
}

// ─── Practice ───────────────────────────────────────────────────────────

type PracticeBlockYAML struct {
	Exercises []ExerciseYAML `yaml:"exercises" json:"exercises"`
}

// ExerciseYAML est polymorphe sur `kind`.
//
// Le payload arrive dans DEUX champs distincts selon le décodeur :
//   - PayloadYAML : rempli par yaml.Unmarshal (yaml.Node)
//   - PayloadJSON : rempli par json.Unmarshal (json.RawMessage)
//
// Le parser choisit celui qui est non-vide. Les tags `json:"-"` et
// `yaml:"-"` évitent que l'autre décodeur ne tente de remplir le mauvais
// champ.
type ExerciseYAML struct {
	ID            string          `yaml:"id" json:"id"`
	Kind          string          `yaml:"kind" json:"kind"`
	Prompt        string          `yaml:"prompt" json:"prompt"`
	ExplanationMD string          `yaml:"explanation_md" json:"explanation_md"`
	XP            int             `yaml:"xp" json:"xp"`
	Difficulty    int             `yaml:"difficulty" json:"difficulty"`
	Concepts      []string        `yaml:"concepts" json:"concepts"`
	PayloadYAML   yaml.Node       `yaml:"payload" json:"-"`
	PayloadJSON   json.RawMessage `yaml:"-" json:"payload"`
}

// ─── Mission ────────────────────────────────────────────────────────────

type MissionBlockYAML struct {
	Mission MissionYAML `yaml:"mission" json:"mission"`
}

type MissionYAML struct {
	ID               string             `yaml:"id" json:"id"`
	Title            string             `yaml:"title" json:"title"`
	BriefMD          string             `yaml:"brief_md" json:"brief_md"`
	Target           MissionTargetYAML  `yaml:"target" json:"target"`
	Validation       MissionValidYAML   `yaml:"validation" json:"validation"`
	OnSuccess        MissionSuccessYAML `yaml:"on_success" json:"on_success"`
	OnFailure        MissionFailureYAML `yaml:"on_failure" json:"on_failure"`
	HintAfterMinutes int                `yaml:"hint_after_minutes" json:"hint_after_minutes"`
	RetryAllowed     bool               `yaml:"retry_allowed" json:"retry_allowed"`
}

type MissionTargetYAML struct {
	Route string `yaml:"route" json:"route"`
	CTA   string `yaml:"cta" json:"cta"`
}

type MissionValidYAML struct {
	Trigger    string          `yaml:"trigger" json:"trigger"`
	Conditions []ConditionYAML `yaml:"conditions" json:"conditions"`
}

type ConditionYAML struct {
	Path  string `yaml:"path" json:"path"`
	Op    string `yaml:"op" json:"op"`
	Value any    `yaml:"value" json:"value"`
}

type MissionSuccessYAML struct {
	XP                int      `yaml:"xp" json:"xp"`
	MascotLine        string   `yaml:"mascot_line" json:"mascot_line"`
	UnlocksMissionIDs []string `yaml:"unlocks_mission_ids" json:"unlocks_mission_ids"`
	UnlocksAvatarIDs  []string `yaml:"unlocks_avatar_ids" json:"unlocks_avatar_ids"`
	BadgeIDs          []string `yaml:"badge_ids" json:"badge_ids"`
}

type MissionFailureYAML struct {
	FeedbackMD string `yaml:"feedback_md" json:"feedback_md"`
	HintMD     string `yaml:"hint_md" json:"hint_md"`
}

// ─── Debrief ────────────────────────────────────────────────────────────

type DebriefBlockYAML struct {
	Sections         []string `yaml:"sections" json:"sections"`
	CustomMascotLine string   `yaml:"custom_mascot_line" json:"custom_mascot_line"`
}

// ─── Avatar / Badge (déclarations inline) ───────────────────────────────

type AvatarYAML struct {
	ID          string           `yaml:"id" json:"id"`
	Name        string           `yaml:"name" json:"name"`
	Tier        string           `yaml:"tier" json:"tier"`
	Description string           `yaml:"description" json:"description"`
	SVGPath     string           `yaml:"svg_path" json:"svg_path"`
	DefaultPose string           `yaml:"default_pose" json:"default_pose"`
	Poses       []AvatarPoseYAML `yaml:"poses" json:"poses"`
	Unlock      AvatarUnlockYAML `yaml:"unlock" json:"unlock"`
}

type AvatarPoseYAML struct {
	Key       string `yaml:"key" json:"key"`
	Label     string `yaml:"label" json:"label"`
	IsDefault bool   `yaml:"is_default" json:"is_default"`
}

type AvatarUnlockYAML struct {
	Kind        string `yaml:"kind" json:"kind"`
	Value       string `yaml:"value" json:"value"`
	Description string `yaml:"description" json:"description"`
}

type BadgeYAML struct {
	ID          string          `yaml:"id" json:"id"`
	Name        string          `yaml:"name" json:"name"`
	Description string          `yaml:"description" json:"description"`
	Icon        string          `yaml:"icon" json:"icon"`
	Color       string          `yaml:"color" json:"color"`
	Category    string          `yaml:"category" json:"category"`
	Rarity      string          `yaml:"rarity" json:"rarity"`
	Conditions  []ConditionYAML `yaml:"conditions" json:"conditions"`
}