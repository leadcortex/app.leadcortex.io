package curriculum

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"

	"github.com/leadcortex/academy/internal/domain"
)

// LoadResult regroupe tout ce qu'un chargement produit.
type LoadResult struct {
	Registry *Registry
	Issues   []ValidationIssue
	Resolver *Resolver
}

// Load charge tous les programmes d'un répertoire (récursivement).
//
// Formats acceptés : .json, .yaml, .yml. Le décodeur est choisi selon
// l'extension du fichier. Les trois dossiers scrutés sont :
//
//	<contentDir>/programs/
//	<contentDir>/avatars/
//	<contentDir>/badges/
//
// Les erreurs bloquantes empêchent le retour d'un Registry non-nil.
// Les warnings sont renvoyés dans Result.Issues.
func Load(contentDir string) (*LoadResult, error) {
	if contentDir == "" {
		return nil, NewFileError("", 0, ErrMissingContent, "contentDir vide")
	}
	info, err := os.Stat(contentDir)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return nil, NewFileError(contentDir, 0, ErrMissingContent, "répertoire introuvable")
		}
		return nil, fmt.Errorf("stat %s : %w", contentDir, err)
	}
	if !info.IsDir() {
		return nil, NewFileError(contentDir, 0, ErrMissingContent, "n'est pas un répertoire")
	}

	programFiles, err := findContentFiles(filepath.Join(contentDir, "programs"))
	if err != nil {
		return nil, err
	}
	avatarFiles, err := findContentFiles(filepath.Join(contentDir, "avatars"))
	if err != nil {
		return nil, err
	}
	badgeFiles, err := findContentFiles(filepath.Join(contentDir, "badges"))
	if err != nil {
		return nil, err
	}
	if len(programFiles) == 0 {
		return nil, NewFileError(contentDir, 0, ErrMissingContent, "aucun programme trouvé")
	}

	var programs []*domain.Program
	var allIssues []ValidationIssue

	for _, path := range programFiles {
		p, issues, err := loadProgramFile(path)
		if err != nil {
			return nil, err
		}
		allIssues = append(allIssues, issues...)
		if p != nil {
			programs = append(programs, p)
		}
	}

	avatars, issues, err := loadAvatars(avatarFiles)
	if err != nil {
		return nil, err
	}
	allIssues = append(allIssues, issues...)

	badges, issues, err := loadBadges(badgeFiles)
	if err != nil {
		return nil, err
	}
	allIssues = append(allIssues, issues...)

	crossIssues := ValidateAll(programs, avatars, badges)
	allIssues = append(allIssues, crossIssues...)

	if HasErrors(allIssues) {
		return &LoadResult{Registry: nil, Issues: allIssues}, nil
	}

	reg := NewRegistry(programs, avatars, badges)
	resolver := NewResolver(reg)

	cycleIssues := resolver.CheckNoCycles()
	allIssues = append(allIssues, cycleIssues...)

	if HasErrors(allIssues) {
		return &LoadResult{Registry: nil, Issues: allIssues}, nil
	}

	return &LoadResult{Registry: reg, Issues: allIssues, Resolver: resolver}, nil
}

/* ─── Chargement par type ────────────────────────────────────────────── */

// isJSONFile — vrai si le chemin se termine par .json.
func isJSONFile(path string) bool {
	return strings.EqualFold(filepath.Ext(path), ".json")
}

// loadProgramFile décode un programme depuis un fichier, en choisissant
// le décodeur selon l'extension.
func loadProgramFile(path string) (*domain.Program, []ValidationIssue, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, nil, NewFileError(path, 0, ErrInvalidSchema, err.Error())
	}

	var src ProgramYAML
	if isJSONFile(path) {
		if err := json.Unmarshal(data, &src); err != nil {
			return nil, nil, NewFileError(path, 0, ErrInvalidSchema, err.Error())
		}
	} else {
		if err := yaml.Unmarshal(data, &src); err != nil {
			return nil, nil, NewFileError(path, 0, ErrInvalidSchema, err.Error())
		}
	}

	if src.SchemaVersion == "" {
		src.SchemaVersion = "1.0"
	}
	if src.SchemaVersion != "1.0" {
		return nil, nil, NewFileError(path, 0, ErrInvalidSchema,
			fmt.Sprintf("schema_version non supportée : %q", src.SchemaVersion))
	}

	program, err := Parse(src)
	if err != nil {
		return nil, nil, NewFileError(path, 0, ErrInvalidSchema, err.Error())
	}

	return program, nil, nil
}

func loadAvatars(paths []string) ([]*domain.Avatar, []ValidationIssue, error) {
	var out []*domain.Avatar
	for _, path := range paths {
		data, err := os.ReadFile(path)
		if err != nil {
			return nil, nil, NewFileError(path, 0, ErrInvalidSchema, err.Error())
		}
		var list []AvatarYAML
		if isJSONFile(path) {
			if err := json.Unmarshal(data, &list); err != nil {
				// Fallback : un seul avatar par fichier.
				var single AvatarYAML
				if err2 := json.Unmarshal(data, &single); err2 != nil {
					return nil, nil, NewFileError(path, 0, ErrInvalidSchema, err.Error())
				}
				list = []AvatarYAML{single}
			}
		} else {
			if err := yaml.Unmarshal(data, &list); err != nil {
				var single AvatarYAML
				if err2 := yaml.Unmarshal(data, &single); err2 != nil {
					return nil, nil, NewFileError(path, 0, ErrInvalidSchema, err.Error())
				}
				list = []AvatarYAML{single}
			}
		}
		for i, a := range list {
			avatar := parseAvatar(a)
			if err := avatar.Validate(); err != nil {
				return nil, nil, NewFileError(path, 0, ErrInvalidSchema,
					fmt.Sprintf("avatar[%d] : %v", i, err))
			}
			out = append(out, avatar)
		}
	}
	return out, nil, nil
}

func loadBadges(paths []string) ([]*domain.Badge, []ValidationIssue, error) {
	var out []*domain.Badge
	for _, path := range paths {
		data, err := os.ReadFile(path)
		if err != nil {
			return nil, nil, NewFileError(path, 0, ErrInvalidSchema, err.Error())
		}
		var list []BadgeYAML
		if isJSONFile(path) {
			if err := json.Unmarshal(data, &list); err != nil {
				var single BadgeYAML
				if err2 := json.Unmarshal(data, &single); err2 != nil {
					return nil, nil, NewFileError(path, 0, ErrInvalidSchema, err.Error())
				}
				list = []BadgeYAML{single}
			}
		} else {
			if err := yaml.Unmarshal(data, &list); err != nil {
				var single BadgeYAML
				if err2 := yaml.Unmarshal(data, &single); err2 != nil {
					return nil, nil, NewFileError(path, 0, ErrInvalidSchema, err.Error())
				}
				list = []BadgeYAML{single}
			}
		}
		for i, b := range list {
			badge := parseBadge(b)
			if err := badge.Validate(); err != nil {
				return nil, nil, NewFileError(path, 0, ErrInvalidSchema,
					fmt.Sprintf("badge[%d] : %v", i, err))
			}
			out = append(out, badge)
		}
	}
	return out, nil, nil
}

func parseAvatar(a AvatarYAML) *domain.Avatar {
	poses := make([]domain.AvatarPose, 0, len(a.Poses))
	for _, p := range a.Poses {
		poses = append(poses, domain.AvatarPose{
			Key:       p.Key,
			Label:     p.Label,
			IsDefault: p.IsDefault,
		})
	}
	return &domain.Avatar{
		ID:          a.ID,
		Name:        a.Name,
		Tier:        domain.AvatarTier(a.Tier),
		Description: a.Description,
		SVGPath:     a.SVGPath,
		DefaultPose: a.DefaultPose,
		Poses:       poses,
		Unlock: domain.AvatarUnlock{
			Kind:        domain.AvatarUnlockKind(a.Unlock.Kind),
			Value:       a.Unlock.Value,
			Description: a.Unlock.Description,
		},
	}
}

func parseBadge(b BadgeYAML) *domain.Badge {
	conditions := make([]domain.Condition, 0, len(b.Conditions))
	for _, c := range b.Conditions {
		conditions = append(conditions, domain.Condition{
			Path:  c.Path,
			Op:    domain.Operator(c.Op),
			Value: c.Value,
		})
	}
	return &domain.Badge{
		ID:          b.ID,
		Name:        b.Name,
		Description: b.Description,
		Icon:        b.Icon,
		Color:       b.Color,
		Category:    domain.BadgeCategory(b.Category),
		Rarity:      domain.BadgeRarity(b.Rarity),
		Condition:   domain.ConditionGroup{All: conditions},
	}
}

/* ─── Utilitaires ────────────────────────────────────────────────────── */

// findContentFiles renvoie tous les fichiers .json/.yaml/.yml d'un
// répertoire. Si le répertoire n'existe pas, renvoie une liste vide
// (tolérance).
func findContentFiles(dir string) ([]string, error) {
	var out []string
	err := filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			if errors.Is(err, fs.ErrNotExist) {
				return nil // répertoire absent : on tolère
			}
			return err
		}
		if d.IsDir() {
			return nil
		}
		ext := strings.ToLower(filepath.Ext(path))
		if ext == ".yaml" || ext == ".yml" || ext == ".json" {
			out = append(out, path)
		}
		return nil
	})
	if err != nil && !errors.Is(err, fs.ErrNotExist) {
		return nil, err
	}
	return out, nil
}