package adaptivity

import (
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

// ConceptStrength résume l'état d'un concept pour un Learner.
type ConceptStrength struct {
	ConceptID string             `json:"concept_id"`
	Level     domain.MasteryLevel `json:"level"`
	Accuracy  float64            `json:"accuracy"`
	Attempts  int                `json:"attempts"`
	Correct   int                `json:"correct"`
	LastSeen  time.Time          `json:"last_seen,omitempty"`
}

// IsMastered — raccourci.
func (s ConceptStrength) IsMastered() bool { return s.Level >= domain.MasteryMastered }

// IsWeak — raccourci.
func (s ConceptStrength) IsWeak(threshold domain.MasteryLevel) bool {
	return s.Level < threshold
}

// Profile est la vue consolidée d'un Learner pour la partie adaptative.
type Profile struct {
	LearnerID   string    `json:"learner_id"`
	DisplayName string    `json:"display_name"`
	GeneratedAt time.Time `json:"generated_at"`

	// ─── Niveau global ────────────────────────────────────────────────

	XP    int `json:"xp"`
	Level int `json:"level"`

	// ─── État d'engagement ────────────────────────────────────────────

	StreakDays     int  `json:"streak_days"`
	BestStreakDays int  `json:"best_streak_days"`
	ActiveToday    bool `json:"active_today"`
	Hearts         int  `json:"hearts"`

	// ─── Compétences ──────────────────────────────────────────────────

	// Strengths — concepts maîtrisés, triés par niveau décroissant.
	Strengths []ConceptStrength `json:"strengths"`

	// Weaknesses — concepts fragiles, triés par niveau croissant.
	Weaknesses []ConceptStrength `json:"weaknesses"`

	// ─── Signaux ──────────────────────────────────────────────────────

	Signals []Signal `json:"signals"`

	// ─── Décisions dérivées ───────────────────────────────────────────

	// TargetDifficulty — difficulté visée (1-5) pour les prochains
	// exercices. Voir difficulty.go.
	TargetDifficulty int `json:"target_difficulty"`

	// EstimatedFocusMinutes — durée estimée d'une session utile pour
	// progresser, en minutes.
	EstimatedFocusMinutes int `json:"estimated_focus_minutes"`

	// ProgressRatio — ratio global (0-1) de complétion du curriculum.
	// Nécessite un registry ; sinon 0.
	ProgressRatio float64 `json:"progress_ratio"`
}

// BuildProfile construit un Profile à partir d'un Learner et d'options.
func BuildProfile(learner *domain.Learner, opts SignalOptions) Profile {
	if learner == nil {
		return Profile{}
	}
	opts = normalizeSignalOptions(opts)

	p := Profile{
		LearnerID:   learner.ID,
		DisplayName: learner.DisplayName,
		GeneratedAt: opts.Now,
		XP:          learner.XP,
		Level:       learner.Level,
		StreakDays:  learner.StreakDays,
		BestStreakDays: learner.BestStreakDays,
		Hearts:      learner.Hearts,
	}
	p.ActiveToday = isActiveOn(learner, opts.Now)

	// Compétences.
	for cid, m := range learner.ConceptMastery {
		cs := ConceptStrength{
			ConceptID: cid,
			Level:     m.Level,
			Accuracy:  m.Accuracy(),
			Attempts:  m.Attempts,
			Correct:   m.Correct,
			LastSeen:  m.LastReviewed,
		}
		if cs.IsMastered() {
			p.Strengths = append(p.Strengths, cs)
		} else if m.Attempts > 0 {
			p.Weaknesses = append(p.Weaknesses, cs)
		}
	}
	sortStrengthsDesc(p.Strengths)
	sortWeaknessesAsc(p.Weaknesses)

	// Signaux.
	p.Signals = DetectSignals(learner, opts)

	// Décisions dérivées.
	p.TargetDifficulty = ComputeTargetDifficulty(learner, DifficultyOptions{
		Now: opts.Now,
	})
	p.EstimatedFocusMinutes = estimateFocusMinutes(learner, p.Weaknesses, opts)

	// Ratio global si registry fourni.
	if opts.Registry != nil {
		p.ProgressRatio = computeProgressRatio(learner, opts.Registry)
	}

	return p
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

func isActiveOn(l *domain.Learner, now time.Time) bool {
	if l.LastActivityAt.IsZero() {
		return false
	}
	ly, lm, ld := l.LastActivityAt.Date()
	ny, nm, nd := now.Date()
	return ly == ny && lm == nm && ld == nd
}

func sortStrengthsDesc(s []ConceptStrength) {
	for i := 1; i < len(s); i++ {
		for j := i; j > 0 && s[j-1].Level < s[j].Level; j-- {
			s[j-1], s[j] = s[j], s[j-1]
		}
	}
}

func sortWeaknessesAsc(s []ConceptStrength) {
	for i := 1; i < len(s); i++ {
		for j := i; j > 0 && s[j-1].Level > s[j].Level; j-- {
			s[j-1], s[j] = s[j], s[j-1]
		}
	}
}

// estimateFocusMinutes propose une durée de session utile (5-30 min)
// selon le nombre de concepts fragiles et l'état d'engagement.
func estimateFocusMinutes(
	l *domain.Learner,
	weak []ConceptStrength,
	opts SignalOptions,
) int {
	base := 10
	// Plus il y a de concepts fragiles, plus la session utile est longue
	// (mais bornée à 30 min pour éviter la fatigue).
	extra := len(weak) * 3
	if extra > 20 {
		extra = 20
	}
	// Pénalité si peu de cœurs : on raccourcit la session.
	if l.Hearts <= 1 {
		base = 5
		extra /= 2
	}
	total := base + extra
	if total < 5 {
		total = 5
	}
	if total > 30 {
		total = 30
	}
	return total
}

func computeProgressRatio(l *domain.Learner, reg interface {
	AllLessons() []*domain.Lesson
}) float64 {
	lessons := reg.AllLessons()
	if len(lessons) == 0 {
		return 0
	}
	done := 0
	for _, lesson := range lessons {
		if lp, ok := l.LessonProgress[lesson.ID]; ok && lp.IsCompleted() {
			done++
		}
	}
	return float64(done) / float64(len(lessons))
}