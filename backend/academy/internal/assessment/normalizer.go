// backend/academy/internal/assessment/normalizer.go

package assessment

import (
	"strings"
	"unicode"

	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

func NormalizeText(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ToLower(s)
	s = removeAccents(s)
	s = collapseSpaces(s)
	s = trimTrailingPunctuation(s)
	return s
}

func removeAccents(s string) string {
	t := transform.Chain(norm.NFD, transform.RemoveFunc(isCombiningMark), norm.NFC)
	out, _, err := transform.String(t, s)
	if err != nil {
		return s
	}
	return out
}

func isCombiningMark(r rune) bool {
	return unicode.Is(unicode.Mn, r)
}

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

func trimTrailingPunctuation(s string) string {
	return strings.TrimRight(s, ".!?;:…")
}

func EqualNormalized(a, b string) bool {
	return NormalizeText(a) == NormalizeText(b)
}

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

func CountWords(s string) int {
	fields := strings.Fields(s)
	return len(fields)
}

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