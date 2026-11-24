// backend/academy/internal/gamification/xp_test.go

package gamification

import (
	"testing"

	"github.com/leadcortex/academy/internal/domain"
)

func TestRewardsForLevel_KnownLevel(t *testing.T) {
	r := RewardsForLevel(5)
	if len(r) == 0 {
		t.Fatal("niveau 5 : attendu au moins une récompense")
	}
	hasBadge := false
	for _, x := range r {
		if x.Kind == RewardBadge && x.Value == "level-5" {
			hasBadge = true
		}
	}
	if !hasBadge {
		t.Error("niveau 5 : badge level-5 attendu")
	}
}

func TestRewardsForLevel_UnknownLevel(t *testing.T) {
	if r := RewardsForLevel(4); r != nil {
		t.Errorf("niveau 4 : attendu nil, obtenu %v", r)
	}
	if r := RewardsForLevel(1); r != nil {
		t.Errorf("niveau 1 : attendu nil, obtenu %v", r)
	}
}

func TestRewardsForLevel_DefensiveCopy(t *testing.T) {
	a := RewardsForLevel(5)
	b := RewardsForLevel(5)
	if len(a) == 0 || len(b) == 0 {
		t.Fatal("niveau 5 : slice vide inattendu")
	}
	a[0] = Reward{Kind: RewardTitle, Value: "MODIFIED"}
	if b[0].Value == "MODIFIED" {
		t.Error("RewardsForLevel ne retourne pas une copie défensive")
	}
}

func TestRewardsForLevelRange(t *testing.T) {
	r := RewardsForLevelRange(4, 6)
	has5 := false
	for _, x := range r {
		if x.Kind == RewardBadge && x.Value == "level-5" {
			has5 = true
		}
	}
	if !has5 {
		t.Error("attendu : badge level-5 présent")
	}
}

func TestRewardsForLevelRange_Noop(t *testing.T) {
	if r := RewardsForLevelRange(5, 5); r != nil {
		t.Errorf("même niveau : attendu nil, obtenu %v", r)
	}
	if r := RewardsForLevelRange(5, 3); r != nil {
		t.Errorf("plage inversée : attendu nil, obtenu %v", r)
	}
}

func TestRewardsForLevelRange_MultipleHops(t *testing.T) {
	r := RewardsForLevelRange(1, 10)
	if len(r) == 0 {
		t.Fatal("attendu : plusieurs récompenses")
	}
	found := map[string]bool{}
	for _, x := range r {
		found[x.Value] = true
	}
	if !found["level-10"] {
		t.Error("badge level-10 manquant")
	}
	if !found["Chasseur"] {
		t.Error("titre Chasseur manquant")
	}
}

func TestXPProgressFor_Beginner(t *testing.T) {
	p := XPProgressFor(0)
	if p.CurrentLevel != 1 {
		t.Errorf("niveau : attendu 1, obtenu %d", p.CurrentLevel)
	}
	if p.LevelFloorXP != 0 {
		t.Errorf("floor : attendu 0, obtenu %d", p.LevelFloorXP)
	}
	if p.NextLevelXP != domain.XPForLevel(2) {
		t.Errorf("next : attendu %d, obtenu %d", domain.XPForLevel(2), p.NextLevelXP)
	}
	if p.XPIntoLevel != 0 {
		t.Errorf("xp into : attendu 0, obtenu %d", p.XPIntoLevel)
	}
}

func TestXPProgressFor_MidLevel(t *testing.T) {
	p := XPProgressFor(150)
	if p.CurrentLevel != 2 {
		t.Errorf("niveau : attendu 2, obtenu %d", p.CurrentLevel)
	}
	if p.XPIntoLevel != 50 {
		t.Errorf("xp into : attendu 50, obtenu %d", p.XPIntoLevel)
	}
	if p.RatioIntoLevel <= 0 || p.RatioIntoLevel >= 1 {
		t.Errorf("ratio attendu entre 0 et 1 exclusif, obtenu %f", p.RatioIntoLevel)
	}
	if p.IsMaxLevel {
		t.Error("IsMaxLevel ne devrait pas être vrai")
	}
}