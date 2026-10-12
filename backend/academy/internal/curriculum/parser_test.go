package curriculum

import (
	"testing"

	"gopkg.in/yaml.v3"

	"github.com/leadcortex/academy/internal/domain"
)

func TestParse_BlockDispatch(t *testing.T) {
	raw := `
type: cover
title: Test
objectives: [A, B]
`
	var b BlockYAML
	if err := yaml.Unmarshal([]byte(raw), &b); err != nil {
		t.Fatalf("unmarshal : %v", err)
	}
	if b.Type != "cover" {
		t.Errorf("type : attendu cover, obtenu %q", b.Type)
	}
	if b.Cover == nil {
		t.Fatal("Cover nil")
	}
	if b.Cover.Title != "Test" {
		t.Errorf("titre : attendu Test, obtenu %q", b.Cover.Title)
	}
}

func TestParse_UnknownBlockType(t *testing.T) {
	raw := `
type: unknown-type
foo: bar
`
	var b BlockYAML
	err := yaml.Unmarshal([]byte(raw), &b)
	if err == nil {
		t.Fatal("attendu une erreur pour un type inconnu")
	}
}

func TestParse_MissionConditions(t *testing.T) {
	raw := `
id: m1
title: Test
brief_md: Brief
target:
  route: /app/people
  cta: Ouvrir
validation:
  trigger: lead.created
  conditions:
    - path: lead.score
      op: ">="
      value: 7
on_success:
  xp: 50
on_failure:
  feedback_md: Raté
`
	var m MissionYAML
	if err := yaml.Unmarshal([]byte(raw), &m); err != nil {
		t.Fatalf("unmarshal mission : %v", err)
	}
	if len(m.Validation.Conditions) != 1 {
		t.Fatalf("conditions : attendues 1, obtenues %d", len(m.Validation.Conditions))
	}
	c := m.Validation.Conditions[0]
	if c.Path != "lead.score" {
		t.Errorf("path : attendu lead.score, obtenu %q", c.Path)
	}
	if c.Op != ">=" {
		t.Errorf("op : attendu >=, obtenu %q", c.Op)
	}
	// Le décodage YAML produit un int.
	v, ok := c.Value.(int)
	if !ok {
		t.Errorf("value : attendu int, obtenu %T", c.Value)
	}
	if v != 7 {
		t.Errorf("value : attendu 7, obtenu %d", v)
	}
}

func TestParseFullProgram(t *testing.T) {
	raw := `
schema_version: "1.0"
id: p-test
order: 1
title: Test Program
difficulty: 1
concepts:
  - id: c1
    label: Concept 1
modules:
  - id: m1
    order: 1
    title: Module 1
    lessons:
      - id: l1
        order: 1
        title: Leçon 1
        duration_min: 5
        difficulty: 1
        xp_total: 50
        concepts: [c1]
        blocks:
          - type: cover
            title: Cover
            objectives: [A]
          - type: mission
            mission:
              id: mission-1
              title: Mission
              brief_md: Brief
              target:
                route: /app/test
                cta: Go
              validation:
                conditions:
                  - path: x
                    op: ">"
                    value: 0
              on_success:
                xp: 10
              on_failure:
                feedback_md: Failed
`
	var src ProgramYAML
	if err := yaml.Unmarshal([]byte(raw), &src); err != nil {
		t.Fatalf("unmarshal : %v", err)
	}
	p, err := Parse(src)
	if err != nil {
		t.Fatalf("parse : %v", err)
	}
	if p.ID != "p-test" {
		t.Errorf("id : attendu p-test, obtenu %q", p.ID)
	}
	if len(p.Modules) != 1 {
		t.Fatalf("modules : attendu 1, obtenu %d", len(p.Modules))
	}
	l := p.Modules[0].Lessons[0]
	if l.ID != "l1" {
		t.Errorf("leçon : attendu l1, obtenu %q", l.ID)
	}
	if l.Blocks[0].BlockType() != domain.BlockTypeCover {
		t.Errorf("premier bloc : attendu cover, obtenu %v", l.Blocks[0].BlockType())
	}
	if l.Blocks[1].BlockType() != domain.BlockTypeMission {
		t.Errorf("second bloc : attendu mission, obtenu %v", l.Blocks[1].BlockType())
	}
}