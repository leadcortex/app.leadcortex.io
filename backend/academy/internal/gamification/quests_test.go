package gamification

import (
	"errors"
	"testing"
	"time"
)

/* ─── Génération déterministe ─────────────────────────────────────────── */

func TestGenerateDailyQuests_Deterministic(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	q1 := GenerateDailyQuests(now)
	q2 := GenerateDailyQuests(now)

	if len(q1) != DailyQuestCount {
		t.Fatalf("attendu %d quêtes, obtenu %d", DailyQuestCount, len(q1))
	}
	for i := range q1 {
		if q1[i].ID != q2[i].ID {
			t.Errorf("IDs divergent à l'index %d : %s != %s", i, q1[i].ID, q2[i].ID)
		}
		if q1[i].Kind != q2[i].Kind {
			t.Errorf("Kind divergent à l'index %d", i)
		}
		if q1[i].Target != q2[i].Target {
			t.Errorf("Target divergent à l'index %d : %d != %d", i, q1[i].Target, q2[i].Target)
		}
	}
}

func TestGenerateDailyQuests_DifferentDays(t *testing.T) {
	d1 := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	d2 := time.Date(2026, 1, 16, 10, 0, 0, 0, time.UTC)

	q1 := GenerateDailyQuests(d1)
	q2 := GenerateDailyQuests(d2)

	if q1[0].ID == q2[0].ID {
		t.Error("des jours différents devraient produire des IDs différents")
	}
	if q1[0].Date == q2[0].Date {
		t.Error("les dates doivent différer")
	}
}

func TestGenerateDailyQuests_UniqueKinds(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	qs := GenerateDailyQuests(now)

	seen := map[QuestKind]bool{}
	for _, q := range qs {
		if seen[q.Kind] {
			t.Errorf("kind dupliqué : %s", q.Kind)
		}
		seen[q.Kind] = true
	}
}

func TestGenerateDailyQuests_TargetsInBounds(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	qs := GenerateDailyQuests(now)

	// Vérifie que chaque target respecte les bornes du template.
	for _, q := range qs {
		var tpl *QuestTemplate
		for i := range QuestCatalog {
			if QuestCatalog[i].Kind == q.Kind {
				tpl = &QuestCatalog[i]
				break
			}
		}
		if tpl == nil {
			continue
		}
		if q.Target < tpl.TargetMin || q.Target > tpl.TargetMax {
			t.Errorf("kind=%s : target %d hors [%d, %d]",
				q.Kind, q.Target, tpl.TargetMin, tpl.TargetMax)
		}
	}
}

/* ─── ProgressRatio / IsComplete / CanClaim ──────────────────────────── */

func TestQuestProgressRatio(t *testing.T) {
	q := Quest{Target: 10, Progress: 5}
	if r := q.ProgressRatio(); r < 0.49 || r > 0.51 {
		t.Errorf("attendu ~0.5, obtenu %f", r)
	}

	q.Progress = 20
	if r := q.ProgressRatio(); r != 1 {
		t.Errorf("dépassement : attendu 1, obtenu %f", r)
	}

	q.Progress = -5
	if r := q.ProgressRatio(); r != 0 {
		t.Errorf("négatif : attendu 0, obtenu %f", r)
	}

	q = Quest{Target: 0, Progress: 5}
	if r := q.ProgressRatio(); r != 0 {
		t.Errorf("target 0 : attendu 0, obtenu %f", r)
	}
}

func TestQuestIsCompleteAndCanClaim(t *testing.T) {
	complete := Quest{Status: QuestStatusComplete}
	if !complete.IsComplete() || !complete.CanClaim() {
		t.Error("une quête complete doit être claimable")
	}

	active := Quest{Status: QuestStatusActive}
	if active.IsComplete() || active.CanClaim() {
		t.Error("une quête active ne doit pas être claimable")
	}

	claimed := Quest{Status: QuestStatusClaimed}
	if claimed.IsComplete() || claimed.CanClaim() {
		t.Error("une quête claimed ne doit plus être claimable")
	}
}

/* ─── ApplyQuestUpdate ───────────────────────────────────────────────── */

func TestApplyQuestUpdate_PartialProgress(t *testing.T) {
	quests := []Quest{
		{ID: "q1", Kind: QuestXP, Target: 50, Progress: 10, Status: QuestStatusActive, Reward: 15},
		{ID: "q2", Kind: QuestLessons, Target: 2, Progress: 0, Status: QuestStatusActive, Reward: 20},
	}
	updated, completed := ApplyQuestUpdate(quests, QuestUpdate{Kind: QuestXP, Amount: 30})

	if len(completed) != 0 {
		t.Errorf("attendu 0 completed, obtenu %v", completed)
	}
	if updated[0].Progress != 40 {
		t.Errorf("q1.Progress : attendu 40, obtenu %d", updated[0].Progress)
	}
	if updated[0].Status != QuestStatusActive {
		t.Errorf("q1.Status : attendu active, obtenu %s", updated[0].Status)
	}
	// q2 (autre Kind) ne doit pas être affecté.
	if updated[1].Progress != 0 {
		t.Errorf("q2.Progress : attendu 0, obtenu %d", updated[1].Progress)
	}

	// L'entrée d'origine ne doit pas être mutée.
	if quests[0].Progress != 10 {
		t.Error("la slice d'origine a été mutée")
	}
}

func TestApplyQuestUpdate_Completes(t *testing.T) {
	quests := []Quest{
		{ID: "q1", Kind: QuestXP, Target: 50, Progress: 45, Status: QuestStatusActive, Reward: 15},
	}
	updated, completed := ApplyQuestUpdate(quests, QuestUpdate{Kind: QuestXP, Amount: 10})

	if len(completed) != 1 || completed[0] != "q1" {
		t.Errorf("attendu [q1], obtenu %v", completed)
	}
	if updated[0].Status != QuestStatusComplete {
		t.Errorf("Status : attendu complete, obtenu %s", updated[0].Status)
	}
	// Le progress est borné au target.
	if updated[0].Progress != 50 {
		t.Errorf("Progress : attendu 50, obtenu %d", updated[0].Progress)
	}
}

func TestApplyQuestUpdate_ZeroAmount(t *testing.T) {
	quests := []Quest{{ID: "q1", Kind: QuestXP, Target: 50, Progress: 10}}
	updated, completed := ApplyQuestUpdate(quests, QuestUpdate{Kind: QuestXP, Amount: 0})
	if len(completed) != 0 {
		t.Errorf("attendu 0, obtenu %v", completed)
	}
	if updated[0].Progress != 10 {
		t.Error("aucun changement attendu")
	}
}

func TestApplyQuestUpdate_SkipsNonActive(t *testing.T) {
	quests := []Quest{
		{ID: "q1", Kind: QuestXP, Target: 50, Progress: 50, Status: QuestStatusComplete},
		{ID: "q2", Kind: QuestXP, Target: 50, Progress: 50, Status: QuestStatusClaimed},
	}
	updated, completed := ApplyQuestUpdate(quests, QuestUpdate{Kind: QuestXP, Amount: 10})
	if len(completed) != 0 {
		t.Errorf("attendu 0, obtenu %v", completed)
	}
	if updated[0].Progress != 50 || updated[1].Progress != 50 {
		t.Error("les quêtes non-active ne doivent pas progresser")
	}
}

/* ─── ClaimQuest ─────────────────────────────────────────────────────── */

func TestClaimQuest_Success(t *testing.T) {
	quests := []Quest{
		{ID: "q1", Status: QuestStatusComplete, Reward: 25},
		{ID: "q2", Status: QuestStatusActive, Reward: 20},
	}
	updated, reward, err := ClaimQuest(quests, "q1")
	if err != nil {
		t.Fatalf("ClaimQuest : %v", err)
	}
	if reward != 25 {
		t.Errorf("reward : attendu 25, obtenu %d", reward)
	}
	if updated[0].Status != QuestStatusClaimed {
		t.Errorf("status : attendu claimed, obtenu %s", updated[0].Status)
	}
	// q2 non touché.
	if updated[1].Status != QuestStatusActive {
		t.Error("q2 ne devait pas être modifié")
	}
}

func TestClaimQuest_NotComplete(t *testing.T) {
	quests := []Quest{{ID: "q1", Status: QuestStatusActive, Reward: 25}}
	_, _, err := ClaimQuest(quests, "q1")
	if !errors.Is(err, ErrQuestNotComplete) {
		t.Errorf("attendu ErrQuestNotComplete, obtenu %v", err)
	}
}

func TestClaimQuest_AlreadyClaimed(t *testing.T) {
	quests := []Quest{{ID: "q1", Status: QuestStatusClaimed, Reward: 25}}
	_, _, err := ClaimQuest(quests, "q1")
	if !errors.Is(err, ErrQuestAlreadyClaimed) {
		t.Errorf("attendu ErrQuestAlreadyClaimed, obtenu %v", err)
	}
}

func TestClaimQuest_NotFound(t *testing.T) {
	quests := []Quest{{ID: "q1", Status: QuestStatusComplete, Reward: 25}}
	_, _, err := ClaimQuest(quests, "unknown")
	if !errors.Is(err, ErrQuestNotFound) {
		t.Errorf("attendu ErrQuestNotFound, obtenu %v", err)
	}
}

/* ─── Agrégats ───────────────────────────────────────────────────────── */

func TestCompletedCount(t *testing.T) {
	quests := []Quest{
		{Status: QuestStatusActive},
		{Status: QuestStatusComplete},
		{Status: QuestStatusClaimed},
	}
	if n := CompletedCount(quests); n != 2 {
		t.Errorf("attendu 2, obtenu %d", n)
	}
}

func TestTotalRewardPending(t *testing.T) {
	quests := []Quest{
		{Status: QuestStatusActive, Reward: 10},
		{Status: QuestStatusComplete, Reward: 20},
		{Status: QuestStatusComplete, Reward: 30},
		{Status: QuestStatusClaimed, Reward: 40},
	}
	if n := TotalRewardPending(quests); n != 50 {
		t.Errorf("attendu 50, obtenu %d", n)
	}
}

func TestSummarizeQuests(t *testing.T) {
	now := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	quests := GenerateDailyQuests(now)
	// Marque une quête comme complète.
	quests[0].Status = QuestStatusComplete

	s := SummarizeQuests(quests, now)
	if s.Date != "2026-01-15" {
		t.Errorf("Date : attendu 2026-01-15, obtenu %s", s.Date)
	}
	if s.Total != DailyQuestCount {
		t.Errorf("Total : attendu %d, obtenu %d", DailyQuestCount, s.Total)
	}
	if s.Completed != 1 {
		t.Errorf("Completed : attendu 1, obtenu %d", s.Completed)
	}
	if s.RewardDue != quests[0].Reward {
		t.Errorf("RewardDue : attendu %d, obtenu %d", quests[0].Reward, s.RewardDue)
	}
}