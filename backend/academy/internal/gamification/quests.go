// backend/academy/internal/gamification/quests.go

package gamification

import (
	"fmt"
	"hash/fnv"
	"time"
)

type QuestKind string

const (
	QuestXP QuestKind = "xp"
	QuestLessons QuestKind = "lessons"
	QuestExercises QuestKind = "exercises"
	QuestSrs QuestKind = "srs"
	QuestMissions QuestKind = "missions"
	QuestStreak QuestKind = "streak"
)

type QuestStatus string

const (
	QuestStatusActive   QuestStatus = "active"
	QuestStatusComplete QuestStatus = "complete"
	QuestStatusClaimed  QuestStatus = "claimed"
)

type QuestTemplate struct {
	Kind        QuestKind `json:"kind"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	TargetMin int `json:"target_min"`
	TargetMax int `json:"target_max"`
	Reward int `json:"reward"`
}

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

type Quest struct {
	ID          string      `json:"id"`
	Date        string      `json:"date"`
	Kind        QuestKind   `json:"kind"`
	Title       string      `json:"title"`
	Description string      `json:"description"`
	Target      int         `json:"target"`
	Progress    int         `json:"progress"`
	Reward      int         `json:"reward"`
	Status      QuestStatus `json:"status"`
}

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

func (q Quest) IsComplete() bool {
	return q.Status == QuestStatusComplete
}

func (q Quest) CanClaim() bool {
	return q.Status == QuestStatusComplete
}

const DailyQuestCount = 3

func GenerateDailyQuests(now time.Time) []Quest {
	dateKey := now.UTC().Format("2006-01-02")

	h := fnv.New64a()
	_, _ = h.Write([]byte(dateKey))
	seed := h.Sum64()

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


type QuestUpdate struct {
	Kind   QuestKind `json:"kind"`
	Amount int       `json:"amount"`
}

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

func CompletedCount(quests []Quest) int {
	n := 0
	for _, q := range quests {
		if q.Status == QuestStatusComplete || q.Status == QuestStatusClaimed {
			n++
		}
	}
	return n
}

func TotalRewardPending(quests []Quest) int {
	n := 0
	for _, q := range quests {
		if q.Status == QuestStatusComplete {
			n += q.Reward
		}
	}
	return n
}

type QuestStatusForLearner struct {
	Date      string  `json:"date"`
	Quests    []Quest `json:"quests"`
	Completed int     `json:"completed"`
	Total     int     `json:"total"`
	RewardDue int     `json:"reward_due"`
}

func SummarizeQuests(quests []Quest, now time.Time) QuestStatusForLearner {
	return QuestStatusForLearner{
		Date:      now.UTC().Format("2006-01-02"),
		Quests:    quests,
		Completed: CompletedCount(quests),
		Total:     len(quests),
		RewardDue: TotalRewardPending(quests),
	}
}


func pickTemplates(seed uint64, n int) []QuestTemplate {
	if n > len(QuestCatalog) {
		n = len(QuestCatalog)
	}
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

func drawTarget(seed uint64, salt uint64, minV, maxV int) int {
	if maxV <= minV {
		return minV
	}
	rng := xorshift(seed + salt*0x9E3779B97F4A7C15)
	span := uint64(maxV - minV + 1)
	return minV + int(rng%span)
}

func xorshift(x uint64) uint64 {
	if x == 0 {
		x = 0x9E3779B97F4A7C15
	}
	x ^= x << 13
	x ^= x >> 7
	x ^= x << 17
	return x
}
