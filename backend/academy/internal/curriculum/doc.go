// Package curriculum charge, valide et indexe les programmes pédagogiques
// décrits en YAML.
//
// # Pipeline
//
//	content/programs/*.yaml
//	       │
//	       ▼ (loader.LoadAll)
//	   []ProgramYAML       ← représentation brute, proche du YAML
//	       │
//	       ▼ (parser.Parse)
//	   []domain.Program    ← types du domaine, validés unitairement
//	       │
//	       ▼ (validator.ValidateAll)
//	   cross-validation    ← références, unicité, cycles
//	       │
//	       ▼ (registry.New + register)
//	   *Registry           ← index prêt à l'emploi (lookup par ID)
//
// Le Registry expose :
//   - Program(id), Module(id), Lesson(id)
//   - Concept(id), Avatar(id), Badge(id)
//   - AllPrograms(), AllLessons()…
//   - Resolver() pour les prérequis transitifs
//
// # Schéma YAML
//
// Un fichier YAML = un programme complet (avec ses modules et leçons
// imbriqués). Voir testdata/programs/01-foundations.yaml pour un exemple
// exhaustif.
//
// # Invariants vérifiés
//
//   - Unicité des IDs dans chaque collection
//   - Cohérence des références (prerequisiteLessonIDs pointe vers une
//     leçon existante, unlockAvatarIDs vers un avatar connu…)
//   - Absence de cycles dans les prérequis
//   - Présence d'au moins un bloc mission par leçon (règle pédagogique)
//   - Tous les concepts référencés sont déclarés dans le programme
package curriculum