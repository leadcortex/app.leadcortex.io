package curriculum

import (
	"path/filepath"
	"testing"
)

func TestLoad_SampleFoundations(t *testing.T) {
	dir := filepath.Join("testdata", "programs")

	res, err := Load(filepath.Dir(dir))
	if err != nil {
		t.Fatalf("Load : %v", err)
	}
	if res.Registry == nil {
		t.Fatalf("registre nil, issues : %v", res.Issues)
	}

	stats := res.Registry.Stats()
	if stats.Programs < 1 {
		t.Errorf("attendu au moins 1 programme, obtenu %d", stats.Programs)
	}
	if stats.Lessons < 1 {
		t.Errorf("attendu au moins 1 leçon, obtenue %d", stats.Lessons)
	}

	// Lookup direct.
	p, ok := res.Registry.Program("p1-foundations")
	if !ok {
		t.Fatal("programme p1-foundations introuvable")
	}
	if p.Title != "Foundations" {
		t.Errorf("titre : attendu %q, obtenu %q", "Foundations", p.Title)
	}

	l, ok := res.Registry.Lesson("p1-m1-l1-why-prospection")
	if !ok {
		t.Fatal("leçon p1-m1-l1-why-prospection introuvable")
	}
	if l.DurationMin != 6 {
		t.Errorf("durée : attendue 6, obtenue %d", l.DurationMin)
	}
	if len(l.Blocks) != 4 {
		t.Errorf("blocs : attendu 4, obtenu %d", len(l.Blocks))
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