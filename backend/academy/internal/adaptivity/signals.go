package adaptivity

import (
	"fmt"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

// SignalKind identifie la famille d'un signal d'apprentissage.
type SignalKind string

const (
	// SignalWeakConcept — un concept dont la maîtrise est basse.
	SignalWeakConcept SignalKind = "weak_concept"

	// SignalLowScores — un concept dont les scores récents sont bas.
	SignalLowScores SignalKind = "low_scores"

	// SignalLapsedCards — des cartes SRS échouées récemment.
	SignalLapsedCards SignalKind = "lapsed_cards"

	// SignalOverdueReviews — des cartes SRS très en retard.
	SignalOverdueReviews SignalKind = "overdue_reviews"

	// SignalStreakBroken — le streak vient d'être cassé ou est à 0.
	SignalStreakBroken SignalKind = "streak_broken"

	// SignalBlockedLesson — leçon bloquée par un prérequis non satisfait.
	SignalBlockedLesson SignalKind = "blocked_lesson"

	// SignalStalled — aucune activité récente (< seuil).
	SignalStalled SignalKind = "stalled"
)

// Signal décrit une lacune ou un point d'attention pour un apprenant.
type Signal struct {
	// Kind — famille du signal.
	Kind SignalKind `json:"kind"`

	// TargetID — identifiant de l'entité concernée (concept, leçon…).
	// Vide si le signal est global.
	TargetID string `json:"target_id,omitempty"`

	// Severity — intensité du signal, 0 (faible) à 1 (critique).
	Severity float64 `json:"severity"`

	// Reason — texte court prêt à afficher.
	Reason string `json:"reason"`

	// Meta — données brutes (compteurs, dates, etc.) pour debug ou UI.
	Meta map[string]any `json:"meta,omitempty"`
}

// SignalOptions regroupe les paramètres optionnels de la détection.
type SignalOptions struct {
	// Registry — curriculum (utilisé pour SignalBlockedLesson).
	Registry *curriculum.Registry

	// SrsCards — cartes SRS du Learner. Peut être nil.
	SrsCards []domain.SrsCard

	// Now — instant d'évaluation. Si zéro, l'appelant DOIT le fournir.
	// Aucun fallback sur time.Now() pour rester déterministe.
	Now time.Time

	// StallThresholdDays — nombre de jours d'inactivité avant de
	// signaler un blocage. 0 = seuil par défaut (3 jours).
	StallThresholdDays int

	// WeakThreshold — niveau de maîtrise sous lequel un concept est
	// considéré faible. 0 = MasteryOK (60).
	WeakThreshold domain.MasteryLevel

	// LowScoreThreshold — score moyen sous lequel un concept est
	// considéré à risque. 0 = 60.
	LowScoreThreshold float64

	// OverdueDays — nombre de jours en retard pour qualifier une
	// révision d'"overdue". 0 = 3 jours.
	OverdueDays int
}

// DefaultSignalOptions renvoie les seuils par défaut.
func DefaultSignalOptions(now time.Time) SignalOptions {
	return SignalOptions{
		Now:                now,
		StallThresholdDays: 3,
		WeakThreshold:      domain.MasteryOK,
		LowScoreThreshold:  60,
		OverdueDays:        3,
	}
}

// DetectSignals analyse un Learner et retourne la liste des signaux
// triés par sévérité décroissante.
//
// La fonction est PURE : elle ne mute ni le Learner ni le registry.
func DetectSignals(learner *domain.Learner, opts SignalOptions) []Signal {
	if learner == nil {
		return nil
	}

	// Normalise les options.
	opts = normalizeSignalOptions(opts)

	var signals []Signal

	// ─── 1. Concepts faibles / scores bas ────────────────────────────
	for cid, mastery := range learner.ConceptMastery {
		if mastery.Attempts == 0 {
			continue
		}

		// Faible maîtrise.
		if mastery.Level < opts.WeakThreshold {
			sev := severityFromMastery(mastery.Level, opts.WeakThreshold)
			signals = append(signals, Signal{
				Kind:     SignalWeakConcept,
				TargetID: cid,
				Severity: sev,
				Reason: fmt.Sprintf("Concept fragile : %d/%d",
					int(mastery.Level), int(domain.MasteryMastered)),
				Meta: map[string]any{
					"level":    int(mastery.Level),
					"attempts": mastery.Attempts,
					"correct":  mastery.Correct,
				},
			})
			continue
		}

		// Scores bas malgré une maîtrise correcte.
		acc := mastery.Accuracy() * 100
		if acc > 0 && acc < opts.LowScoreThreshold {
			signals = append(signals, Signal{
				Kind:     SignalLowScores,
				TargetID: cid,
				Severity: 0.4,
				Reason:   "Scores récents sous la moyenne",
				Meta: map[string]any{
					"accuracy": acc,
					"attempts": mastery.Attempts,
				},
			})
		}
	}

	// ─── 2. Cartes SRS ───────────────────────────────────────────────
	if len(opts.SrsCards) > 0 {
		var lapsedByConcept = map[string]int{}
		var overdueByConcept = map[string]int{}
		overdueThreshold := opts.Now.AddDate(0, 0, -opts.OverdueDays)

		for _, c := range opts.SrsCards {
			if c.Lapses > 0 {
				lapsedByConcept[c.ConceptID]++
			}
			if !c.DueAt.IsZero() && c.DueAt.Before(overdueThreshold) {
				overdueByConcept[c.ConceptID]++
			}
		}

		for cid, n := range lapsedByConcept {
			signals = append(signals, Signal{
				Kind:     SignalLapsedCards,
				TargetID: cid,
				Severity: clamp01(float64(n) * 0.2),
				Reason:   fmt.Sprintf("%d carte(s) SRS échouée(s)", n),
				Meta:     map[string]any{"count": n},
			})
		}
		for cid, n := range overdueByConcept {
			signals = append(signals, Signal{
				Kind:     SignalOverdueReviews,
				TargetID: cid,
				Severity: clamp01(float64(n) * 0.15),
				Reason:   fmt.Sprintf("%d révision(s) en retard", n),
				Meta:     map[string]any{"count": n},
			})
		}
	}

	// ─── 3. Inactivité / streak cassé ────────────────────────────────
	if learner.StreakDays == 0 && !learner.LastActivityAt.IsZero() {
		daysSince := int(opts.Now.Sub(learner.LastActivityAt).Hours() / 24)
		if daysSince >= opts.StallThresholdDays {
			signals = append(signals, Signal{
				Kind:     SignalStreakBroken,
				Severity: clamp01(float64(daysSince) / 14), // sature à 14 jours
				Reason:   fmt.Sprintf("Aucune activité depuis %d jour(s)", daysSince),
				Meta:     map[string]any{"days_since": daysSince},
			})
		}
	}

	// ─── 4. Leçons bloquées ──────────────────────────────────────────
	if opts.Registry != nil {
		for _, lesson := range opts.Registry.AllLessons() {
			lp, ok := learner.LessonProgress[lesson.ID]
			if ok && lp.Status != domain.LessonStatusLocked {
				continue
			}
			// Vérifier si la leçon est "presque" débloquée : un seul
			// prérequis manquant.
			missing := countMissingPrereqs(learner, lesson)
			if missing == 1 {
				signals = append(signals, Signal{
					Kind:     SignalBlockedLesson,
					TargetID: lesson.ID,
					Severity: 0.3,
					Reason:   "Une seule leçon vous sépare de la suite",
					Meta:     map[string]any{"missing_prereqs": missing},
				})
			}
		}
	}

	// ─── 5. Tri par sévérité décroissante ────────────────────────────
	sortSignalsBySeverity(signals)
	return signals
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

func normalizeSignalOptions(o SignalOptions) SignalOptions {
	if o.StallThresholdDays <= 0 {
		o.StallThresholdDays = 3
	}
	if o.WeakThreshold <= 0 {
		o.WeakThreshold = domain.MasteryOK
	}
	if o.LowScoreThreshold <= 0 {
		o.LowScoreThreshold = 60
	}
	if o.OverdueDays <= 0 {
		o.OverdueDays = 3
	}
	return o
}

func severityFromMastery(level, threshold domain.MasteryLevel) float64 {
	if threshold <= 0 {
		return 1
	}
	ratio := float64(level) / float64(threshold)
	if ratio < 0 {
		ratio = 0
	}
	if ratio > 1 {
		ratio = 1
	}
	return 1 - ratio
}

// countMissingPrereqs compte les leçons prérequises non satisfaites pour
// une leçon donnée.
func countMissingPrereqs(l *domain.Learner, lesson *domain.Lesson) int {
	n := 0
	for _, pid := range lesson.Prerequisites.PreviousLessonIDs {
		lp, ok := l.LessonProgress[pid]
		if !ok || !lp.IsCompleted() {
			n++
		}
	}
	for _, cid := range lesson.Prerequisites.RequiredConceptIDs {
		m, ok := l.ConceptMastery[cid]
		if !ok || !m.IsMastered() {
			n++
		}
	}
	return n
}

func sortSignalsBySeverity(s []Signal) {
	// Tri stable par sévérité décroissante.
	// On évite sort.Slice pour garder l'ordre d'insertion à sévérité
	// égale (déterministe sur les maps grâce au tri).
	for i := 1; i < len(s); i++ {
		for j := i; j > 0 && s[j-1].Severity < s[j].Severity; j-- {
			s[j-1], s[j] = s[j], s[j-1]
		}
	}
}

func clamp01(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 1 {
		return 1
	}
	return v
}