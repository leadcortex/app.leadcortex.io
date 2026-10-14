package avatars

import (
	"sync"

	"github.com/leadcortex/academy/internal/domain"
)

// posesStandard — poses disponibles pour la majorité des avatars.
// L'ordre importe : la première pose par défaut est "neutral".
var posesStandard = []domain.AvatarPose{
	{Key: "neutral", Label: "Neutre", IsDefault: true},
	{Key: "happy", Label: "Content", IsDefault: false},
	{Key: "curious", Label: "Curieux", IsDefault: false},
	{Key: "thinking", Label: "Pensif", IsDefault: false},
	{Key: "celebrating", Label: "Célébration", IsDefault: false},
}

// posesFounding — poses spéciales du Founding Dolphin.
var posesFounding = []domain.AvatarPose{
	{Key: "neutral", Label: "Neutre", IsDefault: true},
	{Key: "happy", Label: "Content", IsDefault: false},
	{Key: "celebrating", Label: "Célébration", IsDefault: false},
	{Key: "sparkling", Label: "Étincelant", IsDefault: false},
}

// catalogEntries — les 12 avatars, dans leur ordre canonique.
//
// L'ordre est important pour l'affichage : tiers croissants puis
// progression croissante à l'intérieur d'un tier.
var catalogEntries = []domain.Avatar{
	// ─── CLASSIC (6) ───────────────────────────────────────────────────
	{
		ID:          "eagle",
		Name:        "Aigle",
		Tier:        domain.AvatarTierClassic,
		Description: "Symbole de vision et de hauteur de vue. Repère ses cibles de loin.",
		SVGPath:     "/images/SVG-avatar/classic/Eagle.svg",
		DefaultPose: "neutral",
		Poses:       posesStandard,
		Unlock: domain.AvatarUnlock{
			Kind:        domain.AvatarUnlockProgram,
			Value:       "p1-foundations",
			Description: "Terminer le programme Foundations.",
		},
	},
	{
		ID:          "fox",
		Name:        "Renard",
		Tier:        domain.AvatarTierClassic,
		Description: "Malin et agile. Ne rate jamais un signal d'achat.",
		SVGPath:     "/images/SVG-avatar/classic/Fox.svg",
		DefaultPose: "neutral",
		Poses:       posesStandard,
		Unlock: domain.AvatarUnlock{
			Kind:        domain.AvatarUnlockStreak,
			Value:       "7",
			Description: "Maintenir une série de 7 jours consécutifs.",
		},
	},
	{
		ID:          "panda",
		Name:        "Panda",
		Tier:        domain.AvatarTierClassic,
		Description: "Posé et concentré. Avance à son rythme, sans jamais s'arrêter.",
		SVGPath:     "/images/SVG-avatar/classic/panda.svg",
		DefaultPose: "neutral",
		Poses:       posesStandard,
		Unlock: domain.AvatarUnlock{
			Kind:        domain.AvatarUnlockLessons,
			Value:       "5",
			Description: "Terminer 5 leçons.",
		},
	},
	{
		ID:          "red-panda",
		Name:        "Panda roux",
		Tier:        domain.AvatarTierClassic,
		Description: "Curieux et joueur. Toujours en quête d'une nouvelle découverte.",
		SVGPath:     "/images/SVG-avatar/classic/Red-panda.svg",
		DefaultPose: "neutral",
		Poses:       posesStandard,
		Unlock: domain.AvatarUnlock{
			Kind:        domain.AvatarUnlockLessons,
			Value:       "25",
			Description: "Terminer 25 leçons.",
		},
	},
	{
		ID:          "tiger",
		Name:        "Tigre",
		Tier:        domain.AvatarTierClassic,
		Description: "Puissant et discipliné. Chasse sans relâche.",
		SVGPath:     "/images/SVG-avatar/classic/Tiger.svg",
		DefaultPose: "neutral",
		Poses:       posesStandard,
		Unlock: domain.AvatarUnlock{
			Kind:        domain.AvatarUnlockStreak,
			Value:       "30",
			Description: "Maintenir une série de 30 jours consécutifs.",
		},
	},
	{
		ID:          "wolf",
		Name:        "Loup",
		Tier:        domain.AvatarTierClassic,
		Description: "Fidèle et stratégique. Il avance avec sa meute.",
		SVGPath:     "/images/SVG-avatar/classic/Wolf.svg",
		DefaultPose: "neutral",
		Poses:       posesStandard,
		Unlock: domain.AvatarUnlock{
			Kind:        domain.AvatarUnlockLessons,
			Value:       "50",
			Description: "Terminer 50 leçons.",
		},
	},

	// ─── COLLECTOR (6) ─────────────────────────────────────────────────
	{
		ID:          "owl",
		Name:        "Chouette",
		Tier:        domain.AvatarTierCollector,
		Description: "Gardienne du savoir. Chaque mission réussie affine son jugement.",
		SVGPath:     "/images/SVG-avatar/collector/Astral-owl.svg",
		DefaultPose: "neutral",
		Poses:       posesStandard,
		Unlock: domain.AvatarUnlock{
			Kind:        domain.AvatarUnlockMissionCount,
			Value:       "10",
			Description: "Réussir 10 missions in-app.",
		},
	},
	{
		ID:          "otter",
		Name:        "Loutre",
		Tier:        domain.AvatarTierCollector,
		Description: "Toujours connectée. Le lien humain est sa force.",
		SVGPath:     "/images/SVG-avatar/collector/Otter.svg",
		DefaultPose: "neutral",
		Poses:       posesStandard,
		Unlock: domain.AvatarUnlock{
			Kind:        domain.AvatarUnlockStreak,
			Value:       "100",
			Description: "Maintenir une série de 100 jours consécutifs.",
		},
	},
	{
		ID:          "cat",
		Name:        "Chat lunaire",
		Tier:        domain.AvatarTierCollector,
		Description: "Compagnon nocturne des stratèges. Marche entre deux mondes.",
		SVGPath:     "/images/SVG-avatar/collector/Lunar-cat.svg",
		DefaultPose: "neutral",
		Poses:       posesStandard,
		Unlock: domain.AvatarUnlock{
			Kind:        domain.AvatarUnlockSecret,
			Value:       "level-20",
			Description: "Atteindre le niveau 20.",
		},
	},
	{
		ID:          "turtle",
		Name:        "Tortue",
		Tier:        domain.AvatarTierCollector,
		Description: "Rien ne l'arrête, tout simplement. La constance incarnée.",
		SVGPath:     "/images/SVG-avatar/collector/Mosaic-turtle.svg",
		DefaultPose: "neutral",
		Poses:       posesStandard,
		Unlock: domain.AvatarUnlock{
			Kind:        domain.AvatarUnlockSecret,
			Value:       "exercises-100",
			Description: "Réussir 100 exercices.",
		},
	},
	{
		ID:          "lion",
		Name:        "Lion",
		Tier:        domain.AvatarTierCollector,
		Description: "Roi de la savane commerciale. Il reste à sa place jusqu'à la victoire.",
		SVGPath:     "/images/SVG-avatar/collector/Solar-lion.svg",
		DefaultPose: "neutral",
		Poses:       posesStandard,
		Unlock: domain.AvatarUnlock{
			Kind:        domain.AvatarUnlockSecret,
			Value:       "level-50",
			Description: "Atteindre le niveau 50.",
		},
	},
	{
		ID:          "dolphin",
		Name:        "Dauphin fondateur",
		Tier:        domain.AvatarTierCollector,
		Description: "L'aboutissement du parcours. Réservé aux pionniers de l'academy.",
		SVGPath:     "/images/SVG-avatar/collector/Founding-dolphin.svg",
		DefaultPose: "neutral",
		Poses:       posesFounding,
		Unlock: domain.AvatarUnlock{
			Kind:        domain.AvatarUnlockFounding,
			Value:       "founding",
			Description: "Compléter l'intégralité de l'academy.",
		},
	},
}

/* ─── Accès au catalogue ──────────────────────────────────────────────── */

var (
	catalogOnce sync.Once
	catalogByID map[string]domain.Avatar
	catalogList []domain.Avatar
)

// initCatalog initialise les index une seule fois.
func initCatalog() {
	catalogOnce.Do(func() {
		catalogByID = make(map[string]domain.Avatar, len(catalogEntries))
		catalogList = make([]domain.Avatar, 0, len(catalogEntries))
		for _, a := range catalogEntries {
			// Copie défensive des poses.
			copyPoses := make([]domain.AvatarPose, len(a.Poses))
			copy(copyPoses, a.Poses)
			entry := a
			entry.Poses = copyPoses
			catalogByID[entry.ID] = entry
			catalogList = append(catalogList, entry)
		}
	})
}

// All renvoie la liste complète des avatars, dans l'ordre canonique.
//
// La slice retournée est une copie : la modifier n'affecte pas le
// catalogue global.
func All() []domain.Avatar {
	initCatalog()
	out := make([]domain.Avatar, len(catalogList))
	for i, avatar := range catalogList {
		out[i] = cloneAvatar(avatar)
	}
	return out
}

// Find renvoie un avatar par son ID.
func Find(id string) (domain.Avatar, bool) {
	initCatalog()
	a, ok := catalogByID[id]
	if !ok {
		return domain.Avatar{}, false
	}
	return cloneAvatar(a), true
}

// MustFind est une variante de Find qui panique si l'avatar n'existe pas.
// Réservée aux usages internes où l'ID est garanti.
func MustFind(id string) domain.Avatar {
	a, ok := Find(id)
	if !ok {
		panic("avatars: avatar introuvable : " + id)
	}
	return a
}

// ByTier renvoie tous les avatars d'un tier donné.
func ByTier(tier domain.AvatarTier) []domain.Avatar {
	initCatalog()
	out := make([]domain.Avatar, 0, 6)
	for _, a := range catalogList {
		if a.Tier == tier {
			out = append(out, cloneAvatar(a))
		}
	}
	return out
}

func cloneAvatar(avatar domain.Avatar) domain.Avatar {
	avatar.Poses = append([]domain.AvatarPose(nil), avatar.Poses...)
	return avatar
}

// Count renvoie le nombre total d'avatars du catalogue.
func Count() int {
	initCatalog()
	return len(catalogList)
}
