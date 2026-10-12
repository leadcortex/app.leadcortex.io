package avatars

import (
	"testing"

	"github.com/leadcortex/academy/internal/domain"
)

func TestCatalog_HasTwelveAvatars(t *testing.T) {
	if Count() != 12 {
		t.Errorf("attendu 12 avatars, obtenu %d", Count())
	}
}

func TestCatalog_SixPerTier(t *testing.T) {
	classic := ByTier(domain.AvatarTierClassic)
	collector := ByTier(domain.AvatarTierCollector)

	if len(classic) != 6 {
		t.Errorf("classic : attendu 6, obtenu %d", len(classic))
	}
	if len(collector) != 6 {
		t.Errorf("collector : attendu 6, obtenu %d", len(collector))
	}
}

func TestCatalog_AllValid(t *testing.T) {
	for _, a := range All() {
		if err := a.Validate(); err != nil {
			t.Errorf("avatar %s invalide : %v", a.ID, err)
		}
	}
}

func TestCatalog_UniqueIDs(t *testing.T) {
	seen := map[string]bool{}
	for _, a := range All() {
		if seen[a.ID] {
			t.Errorf("ID dupliqué : %s", a.ID)
		}
		seen[a.ID] = true
	}
}

func TestCatalog_Find(t *testing.T) {
	a, ok := Find("eagle")
	if !ok {
		t.Fatal("eagle introuvable")
	}
	if a.Name != "Aigle" {
		t.Errorf("nom : attendu Aigle, obtenu %s", a.Name)
	}
	if a.Tier != domain.AvatarTierClassic {
		t.Errorf("tier : attendu classic, obtenu %s", a.Tier)
	}
}

func TestCatalog_FindUnknown(t *testing.T) {
	_, ok := Find("unknown-avatar")
	if ok {
		t.Error("avatar inconnu : Find devrait retourner false")
	}
}

func TestCatalog_MustFindPanics(t *testing.T) {
	defer func() {
		if r := recover(); r == nil {
			t.Error("MustFind devrait paniquer pour un ID inconnu")
		}
	}()
	_ = MustFind("unknown-avatar")
}

func TestCatalog_DefensiveCopy(t *testing.T) {
	a := All()
	b := All()
	if len(a) == 0 || len(b) == 0 {
		t.Fatal("catalogue vide")
	}
	// Modifier a ne doit pas affecter b.
	a[0].Name = "MODIFIED"
	if b[0].Name == "MODIFIED" {
		t.Error("All() ne retourne pas une copie défensive")
	}
}

func TestCatalog_DefensivePosesCopy(t *testing.T) {
	a1, _ := Find("eagle")
	a2, _ := Find("eagle")
	if len(a1.Poses) == 0 || len(a2.Poses) == 0 {
		t.Fatal("eagle sans poses")
	}
	a1.Poses[0].Label = "MODIFIED"
	// Re-fetch : la pose ne doit pas avoir changé.
	a3, _ := Find("eagle")
	if a3.Poses[0].Label == "MODIFIED" {
		t.Error("Find ne retourne pas une copie défensive des poses")
	}
}

func TestCatalog_DolphinIsFounding(t *testing.T) {
	a, ok := Find("dolphin")
	if !ok {
		t.Fatal("dolphin introuvable")
	}
	if a.Unlock.Kind != domain.AvatarUnlockFounding {
		t.Errorf("dolphin : kind attendu founding, obtenu %s", a.Unlock.Kind)
	}
	if a.Tier != domain.AvatarTierCollector {
		t.Errorf("dolphin : tier attendu collector, obtenu %s", a.Tier)
	}
}

func TestCatalog_DefaultPoseExists(t *testing.T) {
	for _, a := range All() {
		found := false
		for _, p := range a.Poses {
			if p.Key == a.DefaultPose {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("avatar %s : DefaultPose %q absente des poses", a.ID, a.DefaultPose)
		}
	}
}

func TestCatalog_ExactlyOneDefaultPose(t *testing.T) {
	for _, a := range All() {
		n := 0
		for _, p := range a.Poses {
			if p.IsDefault {
				n++
			}
		}
		if n != 1 {
			t.Errorf("avatar %s : attendu exactement 1 pose par défaut, obtenu %d", a.ID, n)
		}
	}
}