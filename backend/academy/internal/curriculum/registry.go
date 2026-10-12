package curriculum

import (
	"sort"

	"github.com/leadcortex/academy/internal/domain"
)

// Registry est un index immuable en lecture seule des programmes chargés.
// Il permet des lookups O(1) par ID.
type Registry struct {
	programsByID map[string]*domain.Program
	modulesByID  map[string]*domain.Module
	lessonsByID  map[string]*domain.Lesson
	conceptsByID map[string]domain.Concept
	avatarsByID  map[string]*domain.Avatar
	badgesByID   map[string]*domain.Badge

	orderedPrograms []*domain.Program
	orderedLessons  []*domain.Lesson
}

// NewRegistry construit un registre à partir de programmes, avatars et badges.
//
// Le registre copie les pointeurs — les entités restent immuables.
func NewRegistry(
	programs []*domain.Program,
	avatars []*domain.Avatar,
	badges []*domain.Badge,
) *Registry {
	r := &Registry{
		programsByID: make(map[string]*domain.Program, len(programs)),
		modulesByID:  map[string]*domain.Module{},
		lessonsByID:  map[string]*domain.Lesson{},
		conceptsByID: map[string]domain.Concept{},
		avatarsByID:  make(map[string]*domain.Avatar, len(avatars)),
		badgesByID:   make(map[string]*domain.Badge, len(badges)),
	}

	for _, p := range programs {
		r.programsByID[p.ID] = p
		r.orderedPrograms = append(r.orderedPrograms, p)

		for mi := range p.Modules {
			m := &p.Modules[mi]
			r.modulesByID[m.ID] = m
			for li := range m.Lessons {
				l := &m.Lessons[li]
				r.lessonsByID[l.ID] = l
				r.orderedLessons = append(r.orderedLessons, l)
			}
		}
	}

	for _, a := range avatars {
		r.avatarsByID[a.ID] = a
	}
	for _, b := range badges {
		r.badgesByID[b.ID] = b
	}

	// Tri stable par (Order) puis par ID.
	sort.SliceStable(r.orderedPrograms, func(i, j int) bool {
		if r.orderedPrograms[i].Order != r.orderedPrograms[j].Order {
			return r.orderedPrograms[i].Order < r.orderedPrograms[j].Order
		}
		return r.orderedPrograms[i].ID < r.orderedPrograms[j].ID
	})

	return r
}

/* ─── Lookups ────────────────────────────────────────────────────────── */

func (r *Registry) Program(id string) (*domain.Program, bool) {
	p, ok := r.programsByID[id]
	return p, ok
}

func (r *Registry) Module(id string) (*domain.Module, bool) {
	m, ok := r.modulesByID[id]
	return m, ok
}

func (r *Registry) Lesson(id string) (*domain.Lesson, bool) {
	l, ok := r.lessonsByID[id]
	return l, ok
}

func (r *Registry) Concept(id string) (domain.Concept, bool) {
	c, ok := r.conceptsByID[id]
	return c, ok
}

func (r *Registry) Avatar(id string) (*domain.Avatar, bool) {
	a, ok := r.avatarsByID[id]
	return a, ok
}

func (r *Registry) Badge(id string) (*domain.Badge, bool) {
	b, ok := r.badgesByID[id]
	return b, ok
}

/* ─── Listes ─────────────────────────────────────────────────────────── */

func (r *Registry) AllPrograms() []*domain.Program { return r.orderedPrograms }

func (r *Registry) AllLessons() []*domain.Lesson { return r.orderedLessons }

func (r *Registry) AllAvatars() []*domain.Avatar {
	out := make([]*domain.Avatar, 0, len(r.avatarsByID))
	for _, a := range r.avatarsByID {
		out = append(out, a)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out
}

func (r *Registry) AllBadges() []*domain.Badge {
	out := make([]*domain.Badge, 0, len(r.badgesByID))
	for _, b := range r.badgesByID {
		out = append(out, b)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out
}

/* ─── Statistiques ───────────────────────────────────────────────────── */

// Stats résume le contenu du registre.
type Stats struct {
	Programs int
	Modules  int
	Lessons  int
	Concepts int
	Avatars  int
	Badges   int
}

func (r *Registry) Stats() Stats {
	return Stats{
		Programs: len(r.programsByID),
		Modules:  len(r.modulesByID),
		Lessons:  len(r.lessonsByID),
		Concepts: len(r.conceptsByID),
		Avatars:  len(r.avatarsByID),
		Badges:   len(r.badgesByID),
	}
}