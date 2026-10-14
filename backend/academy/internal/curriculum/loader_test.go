package curriculum

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoad_SampleFoundations(t *testing.T) {
	contentDir := t.TempDir()
	for _, file := range []struct {
		source string
		target string
	}{
		{source: filepath.Join("testdata", "programs", "01-foundations.yaml"), target: filepath.Join("programs", "01-foundations.yaml")},
		{source: filepath.Join("..", "..", "content", "avatars", "all-avatars.yaml"), target: filepath.Join("avatars", "all-avatars.yaml")},
		{source: filepath.Join("..", "..", "content", "badges", "standard-badges.yaml"), target: filepath.Join("badges", "standard-badges.yaml")},
	} {
		data, err := os.ReadFile(file.source)
		if err != nil {
			t.Fatalf("lecture de %s : %v", file.source, err)
		}
		target := filepath.Join(contentDir, file.target)
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			t.Fatalf("création du répertoire %s : %v", filepath.Dir(target), err)
		}
		if err := os.WriteFile(target, data, 0o600); err != nil {
			t.Fatalf("écriture de %s : %v", target, err)
		}
	}

	res, err := Load(contentDir)
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
	if len(l.Blocks) != 5 {
		t.Errorf("blocs : attendu 5, obtenu %d", len(l.Blocks))
	}
}

func TestLoad_AcademyContent(t *testing.T) {
	res, err := Load(filepath.Join("..", "..", "content"))
	if err != nil {
		t.Fatalf("Load curriculum Academy : %v", err)
	}
	if res.Registry == nil {
		t.Fatalf("registre Academy nil, issues : %v", res.Issues)
	}
	stats := res.Registry.Stats()
	if stats.Programs != 5 || stats.Lessons != 40 {
		t.Errorf("curriculum incomplet : %d programmes, %d leçons", stats.Programs, stats.Lessons)
	}
	if stats.Avatars != 12 || stats.Badges != 19 {
		t.Errorf("catalogues incomplets : %d avatars, %d badges", stats.Avatars, stats.Badges)
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
