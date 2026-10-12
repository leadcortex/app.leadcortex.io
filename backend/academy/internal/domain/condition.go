package domain

import (
	"fmt"
	"strings"
)

// Operator est un opérateur de comparaison utilisé dans les conditions
// de validation des missions et des badges.
type Operator string

const (
	OpEqual            Operator = "=="
	OpNotEqual         Operator = "!="
	OpGreaterThan      Operator = ">"
	OpGreaterThanEqual Operator = ">="
	OpLessThan         Operator = "<"
	OpLessThanEqual    Operator = "<="

	// OpContains — "valeur dans listOuString".
	OpContains Operator = "contains"
	// OpNotContains — négation de contains.
	OpNotContains Operator = "not_contains"
	// OpStartsWith — commence par.
	OpStartsWith Operator = "starts_with"
	// OpEndsWith — se termine par.
	OpEndsWith Operator = "ends_with"
	// OpMatches — expression régulière (bornée en longueur, voir Evaluate).
	OpMatches Operator = "matches"

	// OpIsEmpty — nil, chaîne vide, slice vide, map vide.
	OpIsEmpty Operator = "is_empty"
	// OpIsNotEmpty — négation de is_empty.
	OpIsNotEmpty Operator = "is_not_empty"

	// OpLengthGTE — longueur de string/slice/map >= valeur.
	OpLengthGTE Operator = "length_gte"
	// OpLengthLTE — longueur <= valeur.
	OpLengthLTE Operator = "length_lte"
)

// AllOperators liste tous les opérateurs supportés. Utilisé par la
// validation YAML (Partie 3) pour rejeter les opérateurs inconnus.
var AllOperators = []Operator{
	OpEqual, OpNotEqual, OpGreaterThan, OpGreaterThanEqual,
	OpLessThan, OpLessThanEqual, OpContains, OpNotContains,
	OpStartsWith, OpEndsWith, OpMatches, OpIsEmpty, OpIsNotEmpty,
	OpLengthGTE, OpLengthLTE,
}

// IsKnown indique si l'opérateur est reconnu.
func (o Operator) IsKnown() bool {
	for _, k := range AllOperators {
		if k == o {
			return true
		}
	}
	return false
}

// Condition est une assertion sur un chemin de données. Utilisée pour
// valider qu'une mission est réussie, ou qu'un badge est débloqué.
//
// Exemples :
//
//	{Path: "lead.score",   Op: OpGreaterThanEqual, Value: 7}
//	{Path: "email.subject", Op: OpIsNotEmpty}
//	{Path: "sequence.steps", Op: OpLengthGTE, Value: 3}
type Condition struct {
	// Path — chemin pointé vers une valeur dans l'événement ou l'état.
	// Ex. "lead.score", "email.body", "mission.attempts".
	Path string

	// Op — opérateur de comparaison.
	Op Operator

	// Value — valeur à comparer (typée). Ignorée pour OpIsEmpty/OpIsNotEmpty.
	Value any
}

// Validate vérifie les invariants de base d'une condition.
func (c Condition) Validate() error {
	if strings.TrimSpace(c.Path) == "" {
		return NewValidationError("Condition", "path", "obligatoire")
	}
	if !c.Op.IsKnown() {
		return NewValidationError("Condition", "op", fmt.Sprintf("opérateur inconnu : %q", c.Op))
	}
	// Pour les opérateurs binaires "valeur requise", on exige une value non nil.
	switch c.Op {
	case OpIsEmpty, OpIsNotEmpty:
		// Value ignorée.
	default:
		if c.Value == nil {
			return NewValidationError("Condition", "value",
				fmt.Sprintf("obligatoire pour l'opérateur %q", c.Op))
		}
	}
	return nil
}

// ConditionGroup permet de combiner des conditions avec ET / OU / NON.
// Un groupe vide est équivalent à "vrai" (aucune contrainte).
type ConditionGroup struct {
	// All — toutes les conditions doivent être vraies (ET logique).
	All []Condition
	// Any — au moins une condition doit être vraie (OU logique).
	Any []Condition
	// Not — aucune des conditions ne doit être vraie.
	Not []Condition
}

// Validate vérifie toutes les conditions du groupe.
func (g ConditionGroup) Validate() error {
	for i, c := range g.All {
		if err := c.Validate(); err != nil {
			return fmt.Errorf("all[%d]: %w", i, err)
		}
	}
	for i, c := range g.Any {
		if err := c.Validate(); err != nil {
			return fmt.Errorf("any[%d]: %w", i, err)
		}
	}
	for i, c := range g.Not {
		if err := c.Validate(); err != nil {
			return fmt.Errorf("not[%d]: %w", i, err)
		}
	}
	return nil
}

// IsEmpty renvoie vrai si le groupe ne contient aucune condition.
func (g ConditionGroup) IsEmpty() bool {
	return len(g.All) == 0 && len(g.Any) == 0 && len(g.Not) == 0
}