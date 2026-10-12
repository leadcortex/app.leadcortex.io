package domain

import "time"

// Lesson est l'unité d'apprentissage atomique.
//
// Une leçon est composée de blocs (cover, theory, practice, mission,
// debrief) qui s'affichent séquentiellement. Elle appartient à un module.
type Lesson struct {
	// ID — identifiant stable, ex. "p1-m2-l1-icp-basics".
	ID string

	// ModuleID — ID du module parent.
	ModuleID string

	// Order — ordre dans le module (1-based).
	Order int

	// Slug — identifiant court lisible, ex. "icp-basics".
	Slug string

	// Title — titre lisible.
	Title string

	// Subtitle — sous-titre affiché sur la carte.
	Subtitle string

	// DurationMin — durée estimée en minutes.
	DurationMin int

	// Difficulty — niveau 1-5.
	Difficulty int

	// XPTotal — XP totale distribuable (théorie + pratique + mission).
	XPTotal int

	// Concepts — notions enseignées (référence vers Concept.ID).
	Concepts []string

	// Skills — compétences transverses (ex. "stratégie", "recherche").
	Skills []string

	// Blocks — blocs ordonnés qui composent la leçon.
	Blocks []Block

	// Prerequisites — conditions pour débloquer cette leçon.
	Prerequisites LessonPrerequisites

	// Unlocks — ce que cette leçon débloque quand elle est terminée.
	Unlocks LessonUnlocks

	// Rewards — récompenses accordées à la complétion.
	Rewards LessonRewards

	// SrsTemplates — cartes de révision à instancier à la complétion.
	SrsTemplates []SrsCardTemplate
}

// LessonPrerequisites définit quand une leçon devient accessible.
type LessonPrerequisites struct {
	// PreviousLessonIDs — ces leçons doivent être terminées.
	PreviousLessonIDs []string

	// RequiredConceptIDs — ces concepts doivent être maîtrisés.
	RequiredConceptIDs []string
}

// LessonUnlocks liste ce qu'une leçon débloque à sa complétion.
type LessonUnlocks struct {
	// LessonIDs — leçons débloquées.
	LessonIDs []string
	// AvatarIDs — avatars débloqués.
	AvatarIDs []string
	// BadgeIDs — badges débloqués.
	BadgeIDs []string
}

// LessonRewards décrit les récompenses à la complétion.
type LessonRewards struct {
	// XP — XP bonus accordée à la complétion (en plus de l'XP des exercices).
	XP int
	// HeartsRefund — vies rendues.
	HeartsRefund int
}

// Validate vérifie les invariants.
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

// FindBlock retourne le premier bloc du type demandé, ou nil.
func (l Lesson) FindBlock(t BlockType) Block {
	for _, b := range l.Blocks {
		if b.BlockType() == t {
			return b
		}
	}
	return nil
}

// BlockIndex retourne l'index du premier bloc du type demandé, ou -1.
func (l Lesson) BlockIndex(t BlockType) int {
	for i, b := range l.Blocks {
		if b.BlockType() == t {
			return i
		}
	}
	return -1
}

// TotalXP renvoie l'XP totale disponible dans cette leçon (exercices +
// mission + rewards).
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

// ─── État d'un bloc pour un apprenant ───────────────────────────────────

// BlockState est l'état d'avancement d'un bloc pour un apprenant donné.
// Il est stocké dans LessonProgress.BlockStates, indexé par position du bloc.
type BlockState struct {
	// Viewed — le bloc a été affiché au moins une fois.
	Viewed bool

	// SlidesViewed — nombre de slides du bloc vus (theory uniquement).
	SlidesViewed int

	// ExercisesAnswered — nombre d'exercices répondus (practice uniquement).
	ExercisesAnswered int

	// MissionSucceeded — mission réussie (mission uniquement).
	MissionSucceeded bool

	// LastUpdatedAt — dernière modification (utile pour l'UI).
	LastUpdatedAt time.Time
}

// IsCompleteFor indique si le bloc est complété selon son type.
// Un bloc de type cover est complété dès qu'il est vu.
// Un bloc theory est complété quand tous les slides sont vus.
// Etc.
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

// ProgressRatioFor renvoie le ratio d'avancement (0-1) du bloc selon
// son type.
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

// ─── Progression d'une leçon pour un apprenant ──────────────────────────

// LessonProgress est l'état d'une leçon pour un apprenant.
type LessonProgress struct {
	LessonID string

	// Status — état courant.
	Status LessonStatus

	// StartedAt — début de la leçon (zéro si jamais commencée).
	StartedAt time.Time

	// CompletedAt — complétion (zéro si non terminée).
	CompletedAt time.Time

	// LastActivityAt — dernière interaction avec cette leçon.
	LastActivityAt time.Time

	// CurrentBlockIndex — bloc actuellement affiché (0-based).
	// Égal à -1 si la leçon n'a pas commencé.
	CurrentBlockIndex int

	// BlockStates — état de chaque bloc, indexé par position dans la leçon.
	// La longueur est maintenue cohérente avec len(lesson.Blocks).
	BlockStates []BlockState

	// Scores — score par exercice (clé = ExerciseID, valeur 0-100).
	Scores map[string]int

	// AttemptsByExercise — nombre de tentatives par exercice.
	AttemptsByExercise map[string]int

	// XPEarned — XP effectivement gagnée sur cette leçon.
	XPEarned int
}

// NewLessonProgress crée un état initial (locked) pour une leçon.
// La slice BlockStates est pré-allouée pour refléter tous les blocs.
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

// Validate vérifie les invariants du LessonProgress.
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

// IsCompleted indique si la leçon est terminée (completed ou mastered).
func (p LessonProgress) IsCompleted() bool {
	return p.Status == LessonStatusCompleted || p.Status == LessonStatusMastered
}

// OverallProgressRatio renvoie le ratio global (0-1) de la leçon,
// en tenant compte de l'importance inégale de chaque bloc.
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

// AllBlocksCompleted indique si tous les blocs de la leçon sont terminés.
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

// LessonStatus décrit l'état d'avancement d'une leçon.
type LessonStatus string

const (
	// LessonStatusLocked — la leçon n'est pas encore accessible.
	LessonStatusLocked LessonStatus = "locked"
	// LessonStatusAvailable — la leçon peut être commencée.
	LessonStatusAvailable LessonStatus = "available"
	// LessonStatusInProgress — la leçon a été commencée.
	LessonStatusInProgress LessonStatus = "in_progress"
	// LessonStatusCompleted — la leçon est terminée.
	LessonStatusCompleted LessonStatus = "completed"
	// LessonStatusMastered — la leçon est terminée ET tous ses concepts sont maîtrisés.
	LessonStatusMastered LessonStatus = "mastered"
)