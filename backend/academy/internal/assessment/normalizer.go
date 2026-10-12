package assessment

import (
	"strings"
	"unicode"

	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

// NormalizeText normalise une chaîne pour comparaison textuelle :
//   - minuscule
//   - trim des espaces
//   - retrait des accents (é → e, ç → c…)
//   - collapse des espaces multiples en un seul
//   - retrait de la ponctuation finale (. ! ? ; ,)
//
// Cette fonction est utilisée pour comparer les réponses FillBlank et les
// mots-clés FreeText. Elle n'est PAS appliquée aux textes affichés à l'UI.
func NormalizeText(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ToLower(s)
	s = removeAccents(s)
	s = collapseSpaces(s)
	s = trimTrailingPunctuation(s)
	return s
}

// removeAccents retire les diacritiques via NFD + filtre des marques
// combinantes. Ex. "é" → "e", "ç" → "c", "ñ" → "n".
func removeAccents(s string) string {
	t := transform.Chain(norm.NFD, transform.RemoveFunc(isCombiningMark), norm.NFC)
	out, _, err := transform.String(t, s)
	if err != nil {
		// En cas d'erreur (rare), on retourne la chaîne d'origine.
		return s
	}
	return out
}

// isCombiningMark — vrai pour les caractères Unicode de type Mn (Mark, nonspacing).
func isCombiningMark(r rune) bool {
	return unicode.Is(unicode.Mn, r)
}

// collapseSpaces réduit les séquences d'espaces (et tabs) à un seul espace.
func collapseSpaces(s string) string {
	var b strings.Builder
	b.Grow(len(s))
	prevSpace := false
	for _, r := range s {
		if r == ' ' || r == '\t' || r == '\n' || r == '\r' {
			if !prevSpace {
				b.WriteByte(' ')
			}
			prevSpace = true
			continue
		}
		b.WriteRune(r)
		prevSpace = false
	}
	return strings.TrimSpace(b.String())
}

// trimTrailingPunctuation retire la ponctuation finale redondante.
func trimTrailingPunctuation(s string) string {
	return strings.TrimRight(s, ".!?;:…")
}

// EqualNormalized compare deux chaînes après normalisation.
func EqualNormalized(a, b string) bool {
	return NormalizeText(a) == NormalizeText(b)
}

// ContainsAnyNormalized vérifie qu'une au moins des chaînes `needles`
// est contenue dans `haystack` après normalisation.
func ContainsAnyNormalized(haystack string, needles []string) bool {
	h := NormalizeText(haystack)
	for _, n := range needles {
		if n == "" {
			continue
		}
		if strings.Contains(h, NormalizeText(n)) {
			return true
		}
	}
	return false
}

// CountWords compte les mots d'une chaîne (séparés par des espaces).
// Utilisé par le scorer FreeText.
func CountWords(s string) int {
	fields := strings.Fields(s)
	return len(fields)
}

// FindKeywords recherche les mots-clés présents et absents dans un texte.
//
// Renvoie (présents, absents), dans l'ordre d'apparition des mots-clés
// dans `keywords`.
func FindKeywords(text string, keywords []string) (found, missing []string) {
	normalized := NormalizeText(text)
	for _, kw := range keywords {
		nk := NormalizeText(kw)
		if nk == "" {
			continue
		}
		if strings.Contains(normalized, nk) {
			found = append(found, kw)
		} else {
			missing = append(missing, kw)
		}
	}
	return found, missing
}