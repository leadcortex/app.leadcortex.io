package curriculum

import (
	"os"
	"path/filepath"
	"testing"
)

// TestLoad_RealContent charge le contenu réel du dépôt (5 programmes JSON).
//
// Ce test est skippé si le dossier content/ n'est pas encore peuplé
// (utile en CI sur un checkout partiel).
func TestLoad_RealContent(t *testing.T) {
	contentDir := filepath.Join("..", "..", "content")
	if _, err := os.Stat(contentDir); err != nil {
		t.Skipf("content dir absent (%s) : %v", contentDir, err)
	}

	res, err := Load(contentDir)
	if err != nil {
		t.Fatalf("Load : %v", err)
	}
	if res.Registry == nil {
		t.Fatalf("registre nil, issues : %v", res.Issues)
	}

	stats := res.Registry.Stats()
	if stats.Programs != 5 {
		t.Errorf("programmes : attendu 5, obtenu %d", stats.Programs)
	}
	if stats.Lessons < 40 {
		t.Errorf("leçons : attendu >= 40, obtenu %d", stats.Lessons)
	}
	if stats.Avatars != 12 {
		t.Errorf("avatars : attendu 12, obtenu %d", stats.Avatars)
	}
	if stats.Badges != 19 {
		t.Errorf("badges : attendu 19, obtenu %d", stats.Badges)
	}

	// Lookup direct d'un programme connu.
	p, ok := res.Registry.Program("p1-foundations")
	if !ok {
		t.Fatal("programme p1-foundations introuvable")
	}
	if p.Title != "Fondations" {
		t.Errorf("titre : attendu %q, obtenu %q", "Fondations", p.Title)
	}

	// Lookup direct d'une leçon connue (avec blocs).
	l, ok := res.Registry.Lesson("p1-m1-l1-why-prospection")
	if !ok {
		t.Fatal("leçon p1-m1-l1-why-prospection introuvable")
	}
	if l.DurationMin != 7 {
		t.Errorf("durée : attendue 7, obtenue %d", l.DurationMin)
	}
	if len(l.Blocks) == 0 {
		t.Errorf("blocs : attendu > 0, obtenu %d", len(l.Blocks))
	}
}

// TestLoad_ChapterOnModules vérifie que le champ chapter du JSON est
// bien propagé jusqu'à domain.Module.
func TestLoad_ChapterOnModules(t *testing.T) {
	contentDir := filepath.Join("..", "..", "content")
	if _, err := os.Stat(contentDir); err != nil {
		t.Skipf("content dir absent (%s) : %v", contentDir, err)
	}
	res, err := Load(contentDir)
	if err != nil {
		t.Fatalf("Load : %v", err)
	}
	if res.Registry == nil {
		t.Fatalf("registre nil, issues : %v", res.Issues)
	}

	m5, ok := res.Registry.Module("p1-m5")
	if !ok {
		t.Fatal("module p1-m5 introuvable")
	}
	if m5.Chapter != 2 {
		t.Errorf("p1-m5.Chapter : attendu 2, obtenu %d", m5.Chapter)
	}

	m1, ok := res.Registry.Module("p1-m1")
	if !ok {
		t.Fatal("module p1-m1 introuvable")
	}
	if m1.EffectiveChapter() != 1 {
		t.Errorf("p1-m1.EffectiveChapter() : attendu 1, obtenu %d", m1.EffectiveChapter())
	}
}

func TestLoad_EmptyDir(t *testing.T) {
	tmp := t.TempDir()
	_, err := Load(tmp)
	if err == nil {
		t.Fatalf("attendu une erreur pour un répertoire vide, obtenu nil")
	}
}

func TestLoad_MissingDir(t *testing.T) {
	_, err := Load("/chemin/qui/n/existe/pas")
	if err == nil {
		t.Fatalf("attendu une erreur pour un répertoire inexistant")
	}
}