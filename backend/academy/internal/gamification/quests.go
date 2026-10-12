package gamification

import (
	"fmt"
	"hash/fnv"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

// QuestKind énumère les familles de quêtes quotidiennes.
type QuestKind string

const (
	// QuestXP — gagner N XP aujourd'hui.
	QuestXP QuestKind = "xp"
	// QuestLessons — terminer N leçons.
	QuestLessons QuestKind = "lessons"
	// QuestExercises — répondre correctement à N exercices.
	QuestExercises QuestKind = "exercises"
	// QuestSrs — réviser N cartes SRS.
	QuestSrs QuestKind = "srs"
	// QuestMissions — réussir N missions in-app.
	QuestMissions QuestKind = "missions"
	// QuestStreak — maintenir le streak (toujours complétable).
	QuestStreak QuestKind = "streak"
)

// QuestStatus décrit l'état d'une quête.
type QuestStatus string

const (
	QuestStatusActive   QuestStatus = "active"
	QuestStatusComplete QuestStatus = "complete"
	QuestStatusClaimed  QuestStatus = "claimed"
)

// QuestTemplate décrit le modèle d'une quête, avant instanciation
// quotidienne.
type QuestTemplate struct {
	Kind        QuestKind `json:"kind"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	// TargetMin, TargetMax — bornes du tirage aléatoire déterministe.
	TargetMin int `json:"target_min"`
	TargetMax int `json:"target_max"`
	// Reward — XP accordée à la complétion.
	Reward int `json:"reward"`
}

// QuestCatalog — les modèles de quêtes disponibles.
//
// À chaque jour, on tire 3 quêtes différentes parmi ce catalogue,
// de façon déterministe (voir GenerateDailyQuests).
var QuestCatalog = []QuestTemplate{
	{
		Kind:        QuestXP,
		Title:       "Gagner de l'XP",
		Description: "Accumule de l'XP en complétant du contenu.",
		TargetMin:   30,
		TargetMax:   80,
		Reward:      15,
	},
	{
		Kind:        QuestLessons,
		Title:       "Terminer des leçons",
		Description: "Complète des leçons pour avancer dans le parcours.",
		TargetMin:   1,
		TargetMax:   2,
		Reward:      20,
	},
	{
		Kind:        QuestExercises,
		Title:       "Réussir des exercices",
		Description: "Réponds correctement à des exercices pratiques.",
		TargetMin:   3,
		TargetMax:   6,
		Reward:      15,
	},
	{
		Kind:        QuestSrs,
		Title:       "Réviser le SRS",
		Description: "Révise tes cartes pour ancrer tes acquis.",
		TargetMin:   5,
		TargetMax:   12,
		Reward:      10,
	},
	{
		Kind:        QuestMissions,
		Title:       "Missions in-app",
		Description: "Exécute des missions directement dans LeadCortex.",
		TargetMin:   1,
		TargetMax:   2,
		Reward:      25,
	},
	{
		Kind:        QuestStreak,
		Title:       "Garder le rythme",
		Description: "Reste actif aujourd'hui pour maintenir ton streak.",
		TargetMin:   1,
		TargetMax:   1,
		Reward:      10,
	},
}

// Quest est une quête quotidienne instanciée pour un jour donné.
type Quest struct {
	ID          string      `json:"id"`
	Date        string      `json:"date"` // YYYY-MM-DD
	Kind        QuestKind   `json:"kind"`
	Title       string      `json:"title"`
	Description string      `json:"description"`
	Target      int         `json:"target"`
	Progress    int         `json:"progress"`
	Reward      int         `json:"reward"`
	Status      QuestStatus `json:"status"`
}

// ProgressRatio — ratio 0-1 pour l'affichage.
func (q Quest) ProgressRatio() float64 {
	if q.Target <= 0 {
		return 0
	}
	r := float64(q.Progress) / float64(q.Target)
	if r > 1 {
		return 1
	}
	if r < 0 {
		return 0
	}
	return r
}

// IsComplete — la quête a atteint son objectif mais n'est pas réclamée.
func (q Quest) IsComplete() bool {
	return q.Status == QuestStatusComplete
}

// CanClaim — la quête peut être réclamée.
func (q Quest) CanClaim() bool {
	return q.Status == QuestStatusComplete
}

// DailyQuestCount — nombre de quêtes générées par jour.
const DailyQuestCount = 3

// GenerateDailyQuests génère DailyQuestCount quêtes pour la journée
// contenant `now`.
//
// La génération est déterministe : deux appels avec la même date (jour
// civil, UTC) produisent les mêmes quêtes. Cela évite d'avoir à
// persister le tirage tant que l'appelant reste cohérent sur la journée.
func GenerateDailyQuests(now time.Time) []Quest {
	dateKey := now.UTC().Format("2006-01-02")

	// Graine dérivée de la date.
	h := fnv.New64a()
	_, _ = h.Write([]byte(dateKey))
	seed := h.Sum64()

	// Tirage sans remise de DailyQuestCount templates.
	picked := pickTemplates(seed, DailyQuestCount)

	out := make([]Quest, 0, len(picked))
	for i, tpl := range picked {
		target := drawTarget(seed, uint64(i), tpl.TargetMin, tpl.TargetMax)
		out = append(out, Quest{
			ID:          fmt.Sprintf("q-%s-%d", dateKey, i),
			Date:        dateKey,
			Kind:        tpl.Kind,
			Title:       tpl.Title,
			Description: tpl.Description,
			Target:      target,
			Progress:    0,
			Reward:      tpl.Reward,
			Status:      QuestStatusActive,
		})
	}
	return out
}

// ─── Progression ────────────────────────────────────────────────────────

// QuestUpdate décrit un incrément de progression sur une famille donnée.
type QuestUpdate struct {
	Kind   QuestKind `json:"kind"`
	Amount int       `json:"amount"`
}

// ApplyQuestUpdate applique un incrément à toutes les quêtes actives du
// type correspondant. Renvoie les quêtes mises à jour (copie) et la liste
// des IDs qui viennent de passer à `complete`.
func ApplyQuestUpdate(quests []Quest, u QuestUpdate) ([]Quest, []string) {
	if u.Amount <= 0 {
		return quests, nil
	}
	out := make([]Quest, len(quests))
	copy(out, quests)

	var newlyCompleted []string
	for i := range out {
		q := &out[i]
		if q.Kind != u.Kind || q.Status != QuestStatusActive {
			continue
		}
		q.Progress += u.Amount
		if q.Progress >= q.Target {
			q.Progress = q.Target
			q.Status = QuestStatusComplete
			newlyCompleted = append(newlyCompleted, q.ID)
		}
	}
	return out, newlyCompleted
}

// ClaimQuest marque une quête comme réclamée et renvoie l'XP gagnée.
//
// Erreurs possibles : ErrQuestNotFound, ErrQuestAlreadyClaimed,
// ErrQuestNotComplete.
func ClaimQuest(quests []Quest, questID string) ([]Quest, int, error) {
	out := make([]Quest, len(quests))
	copy(out, quests)

	for i := range out {
		if out[i].ID != questID {
			continue
		}
		switch out[i].Status {
		case QuestStatusClaimed:
			return quests, 0, ErrQuestAlreadyClaimed
		case QuestStatusActive:
			return quests, 0, ErrQuestNotComplete
		}
		out[i].Status = QuestStatusClaimed
		return out, out[i].Reward, nil
	}
	return quests, 0, ErrQuestNotFound
}

// CompletedCount — nombre de quêtes complétées (réclamées ou non).
func CompletedCount(quests []Quest) int {
	n := 0
	for _, q := range quests {
		if q.Status == QuestStatusComplete || q.Status == QuestStatusClaimed {
			n++
		}
	}
	return n
}

// TotalRewardPending — XP encore à réclamer.
func TotalRewardPending(quests []Quest) int {
	n := 0
	for _, q := range quests {
		if q.Status == QuestStatusComplete {
			n += q.Reward
		}
	}
	return n
}

// QuestStatusForLearner construit un résumé des quêtes pour l'UI.
type QuestStatusForLearner struct {
	Date       string `json:"date"`
	Quests     []Quest `json:"quests"`
	Completed  int     `json:"completed"`
	Total      int     `json:"total"`
	RewardDue  int     `json:"reward_due"`
}

// SummarizeQuests — résumé prêt pour l'UI.
func SummarizeQuests(quests []Quest, now time.Time) QuestStatusForLearner {
	return QuestStatusForLearner{
		Date:      now.UTC().Format("2006-01-02"),
		Quests:    quests,
		Completed: CompletedCount(quests),
		Total:     len(quests),
		RewardDue: TotalRewardPending(quests),
	}
}

/* ─── Helpers déterministes ───────────────────────────────────────────── */

// pickTemplates sélectionne `n` templates distincts parmi QuestCatalog,
// de façon déterministe à partir de `seed`.
func pickTemplates(seed uint64, n int) []QuestTemplate {
	if n > len(QuestCatalog) {
		n = len(QuestCatalog)
	}
	// Fisher-Yates déterministe sur une copie d'index.
	idx := make([]int, len(QuestCatalog))
	for i := range idx {
		idx[i] = i
	}
	rng := seed
	for i := len(idx) - 1; i > 0; i-- {
		rng = xorshift(rng)
		j := int(rng % uint64(i+1))
		idx[i], idx[j] = idx[j], idx[i]
	}
	out := make([]QuestTemplate, 0, n)
	for i := 0; i < n; i++ {
		out = append(out, QuestCatalog[idx[i]])
	}
	return out
}

// drawTarget — tirage borné déterministe entre min et max (inclus).
func drawTarget(seed uint64, salt uint64, minV, maxV int) int {
	if maxV <= minV {
		return minV
	}
	rng := xorshift(seed + salt*0x9E3779B97F4A7C15)
	span := uint64(maxV - minV + 1)
	return minV + int(rng%span)
}

// xorshift — générateur pseudo-aléatoire minimaliste et déterministe.
func xorshift(x uint64) uint64 {
	if x == 0 {
		x = 0x9E3779B97F4A7C15
	}
	x ^= x << 13
	x ^= x >> 7
	x ^= x << 17
	return x
}