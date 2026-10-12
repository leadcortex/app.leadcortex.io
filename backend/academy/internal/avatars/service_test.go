package avatars

import (
	"strings"
	"testing"

	"github.com/leadcortex/academy/internal/domain"
)

/* ─── Service : EvaluateAll ───────────────────────────────────────────── */

func TestService_EvaluateAll_NothingUnlockable(t *testing.T) {
	s := NewService(nil)
	l := newLearner()

	unlocked, err := s.EvaluateAll(l, fixedTime())
	if err != nil {
		t.Fatalf("EvaluateAll : %v", err)
	}
	if len(unlocked) != 0 {
		t.Errorf("attendu 0, obtenu %d", len(unlocked))
	}
}

func TestService_EvaluateAll_SomeUnlockable(t *testing.T) {
	s := NewService(nil)
	l := newLearner()
	l.StreakDays = 10 // débloque fox (streak 7)
	for i := 0; i < 5; i++ {
		l.LessonProgress[lessonID(i)] = domain.LessonProgress{
			LessonID: lessonID(i),
			Status:   domain.LessonStatusCompleted,
		}
	} // débloque aussi panda (5 leçons)

	unlocked, err := s.EvaluateAll(l, fixedTime())
	if err != nil {
		t.Fatalf("EvaluateAll : %v", err)
	}
	ids := map[string]bool{}
	for _, a := range unlocked {
		ids[a.ID] = true
	}
	if !ids["fox"] {
		t.Error("fox attendu (streak 10 >= 7)")
	}
	if !ids["panda"] {
		t.Error("panda attendu (5 leçons)")
	}
	if ids["eagle"] {
		t.Error("eagle ne devrait pas être débloqué (pas de programme terminé)")
	}
}

func TestService_EvaluateAll_SkipsAlreadyUnlocked(t *testing.T) {
	s := NewService(nil)
	l := newLearner()
	l.StreakDays = 10
	l.UnlockAvatar("fox") // déjà débloqué

	unlocked, err := s.EvaluateAll(l, fixedTime())
	if err != nil {
		t.Fatalf("EvaluateAll : %v", err)
	}
	for _, a := range unlocked {
		if a.ID == "fox" {
			t.Error("fox ne devrait pas être dans les nouveaux déblocages")
		}
	}
}

func TestService_EvaluateAll_NilLearner(t *testing.T) {
	s := NewService(nil)
	_, err := s.EvaluateAll(nil, fixedTime())
	if err == nil {
		t.Fatal("attendu une erreur pour learner nil")
	}
}

/* ─── Service : ApplyAndUnlock ────────────────────────────────────────── */

func TestService_ApplyAndUnlock(t *testing.T) {
	s := NewService(nil)
	l := newLearner()
	l.StreakDays = 10

	added, err := s.ApplyAndUnlock(l, fixedTime())
	if err != nil {
		t.Fatalf("ApplyAndUnlock : %v", err)
	}
	if len(added) == 0 {
		t.Fatal("attendu au moins un avatar ajouté")
	}
	if !containsID(l.UnlockedAvatarIDs, "fox") {
		t.Error("fox devrait être dans UnlockedAvatarIDs")
	}

	// Second appel : idempotent.
	added2, _ := s.ApplyAndUnlock(l, fixedTime())
	if len(added2) != 0 {
		t.Errorf("second appel : attendu 0, obtenu %d", len(added2))
	}
}

/* ─── Service : Snapshot ──────────────────────────────────────────────── */

func TestService_Snapshot_EmptyLearner(t *testing.T) {
	s := NewService(nil)
	l := newLearner()

	snap := s.Snapshot(l)
	if snap.Total != 12 {
		t.Errorf("Total : attendu 12, obtenu %d", snap.Total)
	}
	if snap.UnlockedCount != 0 {
		t.Errorf("UnlockedCount : attendu 0, obtenu %d", snap.UnlockedCount)
	}
	if len(snap.Avatars) != 12 {
		t.Errorf("Avatars : attendu 12, obtenu %d", len(snap.Avatars))
	}
}

func TestService_Snapshot_WithUnlocks(t *testing.T) {
	s := NewService(nil)
	l := newLearner()
	l.UnlockAvatar("eagle")
	l.UnlockAvatar("panda")
	l.EquippedAvatarID = "panda"

	snap := s.Snapshot(l)
	if snap.UnlockedCount != 2 {
		t.Errorf("UnlockedCount : attendu 2, obtenu %d", snap.UnlockedCount)
	}
	if snap.EquippedID != "panda" {
		t.Errorf("EquippedID : attendu panda, obtenu %s", snap.EquippedID)
	}

	// Vérifier les flags individuels.
	var pandaRender *Render
	for i := range snap.Avatars {
		if snap.Avatars[i].AvatarID == "panda" {
			pandaRender = &snap.Avatars[i]
			break
		}
	}
	if pandaRender == nil {
		t.Fatal("panda absent du snapshot")
	}
	if !pandaRender.Unlocked {
		t.Error("panda : Unlocked devrait être true")
	}
	if !pandaRender.Equipped {
		t.Error("panda : Equipped devrait être true")
	}
}

/* ─── Service : signaux dérivés ───────────────────────────────────────── */

func TestService_BuildContext_Level20(t *testing.T) {
	s := NewService(nil)
	l := newLearner()
	l.Level = 20

	ctx := s.buildContext(l, fixedTime())
	if v, ok := ctx.Values["level-20"]; !ok || v != true {
		t.Errorf("level-20 devrait être true, obtenu %v", v)
	}
	if _, ok := ctx.Values["level-50"]; ok {
		t.Error("level-50 ne devrait pas être positionné à niveau 20")
	}
}

func TestService_BuildContext_Level50(t *testing.T) {
	s := NewService(nil)
	l := newLearner()
	l.Level = 55

	ctx := s.buildContext(l, fixedTime())
	if v, ok := ctx.Values["level-20"]; !ok || v != true {
		t.Errorf("level-20 devrait être true, obtenu %v", v)
	}
	if v, ok := ctx.Values["level-50"]; !ok || v != true {
		t.Errorf("level-50 devrait être true, obtenu %v", v)
	}
}

func TestService_UnlocksLevel20Avatar(t *testing.T) {
	s := NewService(nil)
	l := newLearner()
	l.Level = 20

	unlocked, err := s.EvaluateAll(l, fixedTime())
	if err != nil {
		t.Fatalf("EvaluateAll : %v", err)
	}
	found := false
	for _, a := range unlocked {
		if a.ID == "cat" {
			found = true
		}
	}
	if !found {
		t.Error("cat devrait être débloqué au niveau 20")
	}
}

func TestService_UnlocksExercises100Avatar(t *testing.T) {
	s := NewService(nil)
	l := newLearner()
	// Simuler 100 exercices réussis en farcissant les scores.
	lp := domain.LessonProgress{
		LessonID: "l1",
		Status:   domain.LessonStatusInProgress,
		Scores:   map[string]int{},
	}
	for i := 0; i < 100; i++ {
		lp.Scores["ex"+string(rune(i))] = 100
	}
	l.LessonProgress["l1"] = lp

	unlocked, err := s.EvaluateAll(l, fixedTime())
	if err != nil {
		t.Fatalf("EvaluateAll : %v", err)
	}
	found := false
	for _, a := range unlocked {
		if a.ID == "turtle" {
			found = true
		}
	}
	if !found {
		t.Error("turtle devrait être débloqué avec 100 exercices réussis")
	}
}

/* ─── Pipeline : AssetURL ─────────────────────────────────────────────── */

func TestAssetURL_ValidPose(t *testing.T) {
	url, err := AssetURL("eagle", "happy")
	if err != nil {
		t.Fatalf("AssetURL : %v", err)
	}
	if !strings.Contains(url, "Eagle.svg") {
		t.Errorf("chemin : attendu Eagle.svg, obtenu %s", url)
	}
	if !strings.HasSuffix(url, "#happy") {
		t.Errorf("ancre : attendu #happy, obtenu %s", url)
	}
}

func TestAssetURL_FallbackToDefault(t *testing.T) {
	url, err := AssetURL("eagle", "unknown-pose")
	if err != nil {
		t.Fatalf("AssetURL : %v", err)
	}
	if !strings.HasSuffix(url, "#neutral") {
		t.Errorf("fallback : attendu #neutral, obtenu %s", url)
	}
}

func TestAssetURL_UnknownAvatar(t *testing.T) {
	_, err := AssetURL("unknown", "neutral")
	if err == nil {
		t.Fatal("attendu une erreur pour avatar inconnu")
	}
}

/* ─── Pipeline : styles ───────────────────────────────────────────────── */

func TestStyleForAvatar_Classic(t *testing.T) {
	style, err := StyleForAvatar("eagle")
	if err != nil {
		t.Fatalf("StyleForAvatar : %v", err)
	}
	if style.HasGlow {
		t.Error("classic : HasGlow devrait être false")
	}
	if style.HasStar {
		t.Error("classic : HasStar devrait être false")
	}
}

func TestStyleForAvatar_Collector(t *testing.T) {
	style, err := StyleForAvatar("owl")
	if err != nil {
		t.Fatalf("StyleForAvatar : %v", err)
	}
	if !style.HasGlow {
		t.Error("collector : HasGlow devrait être true")
	}
}

func TestStyleForAvatar_Dolphin(t *testing.T) {
	style, err := StyleForAvatar("dolphin")
	if err != nil {
		t.Fatalf("StyleForAvatar : %v", err)
	}
	if !style.HasStar {
		t.Error("dolphin : HasStar devrait être true (founding)")
	}
	if !style.HasGlow {
		t.Error("dolphin : HasGlow devrait être true (collector)")
	}
}

/* ─── Pipeline : BuildRender ──────────────────────────────────────────── */

func TestBuildRender_Unlocked(t *testing.T) {
	l := newLearner()
	l.UnlockAvatar("eagle")
	l.EquippedAvatarID = "eagle"

	r, err := BuildRender("eagle", "happy", l)
	if err != nil {
		t.Fatalf("BuildRender : %v", err)
	}
	if r.AvatarID != "eagle" {
		t.Errorf("AvatarID : attendu eagle, obtenu %s", r.AvatarID)
	}
	if !r.Unlocked {
		t.Error("Unlocked devrait être true")
	}
	if !r.Equipped {
		t.Error("Equipped devrait être true")
	}
	if r.PoseKey != "happy" {
		t.Errorf("PoseKey : attendu happy, obtenu %s", r.PoseKey)
	}
}

func TestBuildRender_NotUnlocked(t *testing.T) {
	l := newLearner()

	r, _ := BuildRender("eagle", "", l)
	if r.Unlocked {
		t.Error("eagle : Unlocked devrait être false")
	}
	if r.PoseKey != "neutral" {
		t.Errorf("PoseKey : attendu neutral (défaut), obtenu %s", r.PoseKey)
	}
}

func TestBuildRender_UnknownAvatar(t *testing.T) {
	_, err := BuildRender("unknown", "neutral", newLearner())
	if err == nil {
		t.Fatal("attendu une erreur pour avatar inconnu")
	}
}

/* ─── Pipeline : BuildCatalog ─────────────────────────────────────────── */

func TestBuildCatalog_Returns12(t *testing.T) {
	l := newLearner()
	r := BuildCatalog(l)
	if len(r) != 12 {
		t.Errorf("attendu 12, obtenu %d", len(r))
	}
}

/* ─── Poses ───────────────────────────────────────────────────────────── */

func TestPosesFor(t *testing.T) {
	poses, err := PosesFor("eagle")
	if err != nil {
		t.Fatalf("PosesFor : %v", err)
	}
	if len(poses) == 0 {
		t.Error("attendu au moins une pose")
	}
	if poses[0].Key != "neutral" {
		t.Errorf("première pose : attendu neutral, obtenu %s", poses[0].Key)
	}
}

func TestPosesFor_Unknown(t *testing.T) {
	_, err := PosesFor("unknown")
	if err == nil {
		t.Fatal("attendu une erreur pour avatar inconnu")
	}
}

func TestHasPose(t *testing.T) {
	if !HasPose("eagle", "happy") {
		t.Error("eagle : happy devrait exister")
	}
	if HasPose("eagle", "unknown") {
		t.Error("eagle : unknown ne devrait pas exister")
	}
	if HasPose("unknown", "neutral") {
		t.Error("avatar inconnu : attendu false")
	}
}

func TestResolvePose(t *testing.T) {
	// Pose existante.
	if got := ResolvePose("eagle", "happy"); got != "happy" {
		t.Errorf("attendu happy, obtenu %s", got)
	}
	// Pose inconnue → défaut.
	if got := ResolvePose("eagle", "unknown"); got != "neutral" {
		t.Errorf("attendu neutral, obtenu %s", got)
	}
	// Pose vide → défaut.
	if got := ResolvePose("eagle", ""); got != "neutral" {
		t.Errorf("attendu neutral, obtenu %s", got)
	}
	// Avatar inconnu → "neutral".
	if got := ResolvePose("unknown", "happy"); got != "neutral" {
		t.Errorf("attendu neutral, obtenu %s", got)
	}
}

func TestIsFoundingAvatar(t *testing.T) {
	if !IsFoundingAvatar("dolphin") {
		t.Error("dolphin devrait être founding")
	}
	if IsFoundingAvatar("eagle") {
		t.Error("eagle ne devrait pas être founding")
	}
	if IsFoundingAvatar("unknown") {
		t.Error("avatar inconnu : attendu false")
	}
}