// Package srs implémente le moteur de spaced repetition de l'academy.
//
// # Rôle
//
// Le SRS (Spaced Repetition System) détermine *quand* un apprenant doit
// réviser *quel* concept. Il s'appuie sur l'algorithme SM-2 (SuperMemo 2)
// adapté.
//
// Ce package est PUR : il ne connaît ni le Learner, ni le curriculum, ni
// la progression. Il opère uniquement sur des domain.SrsCard.
//
// # Architecture
//
//	Lesson.SrsTemplates (YAML)
//	         │
//	         ▼ (instantiator)
//	   []domain.SrsCard   ← une carte par template, liée à un Learner
//	         │
//	         ▼ (queue)
//	   DueQueue           ← cartes à réviser aujourd'hui
//	         │
//	         ▼ (ReviewCard / sm2)
//	   UpdatedCard        ← nouvelle planification
//
// # Algorithme SM-2
//
// L'algorithme original (SuperMemo 2) :
//
//	Input: quality q (0-5), repetition number n, ease factor EF, interval I
//	Output: updated n, EF, I
//
//	si q >= 3 (réponse correcte) :
//	    si n = 0 → I ← 1
//	    si n = 1 → I ← 6
//	    sinon   → I ← ceil(I × EF)
//	    EF ← EF + (0.1 - (5-q) × (0.08 + (5-q) × 0.02))
//	    si EF < 1.3 → EF ← 1.3
//	    n ← n + 1
//	sinon (réponse incorrecte) :
//	    n ← 0
//	    I ← 1
//
// Adaptation LeadCortex :
//   - Premier intervalle court (1 jour) pour ancrer la mémoire.
//   - Ease factor borné [1.3, 2.8] au lieu de 1.3 sans plafond.
//   - Grade 3+ = succès ; grade 0-2 = échec (reset).
//   - Les cartes d'un même concept sont planifiées indépendamment.
//
// # Grades SM-2
//
//	0 = blackout total (impossible de se rappeler)
//	1 = incorrect, mais le souvenir revient
//	2 = incorrect, mais facile à retrouver
//	3 = correct avec difficulté
//	4 = correct après hésitation
//	5 = correct, parfait
//
// # Grades LeadCortex
//
// L'UI React n'expose que 4 boutons :
//
//	"Encore" → grade 0
//	"Difficile" → grade 3
//	"Bien" → grade 4
//	"Facile" → grade 5
//
// La conversion est faite par `GradeFromButton`.
package srs