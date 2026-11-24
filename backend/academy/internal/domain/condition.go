// backend/academy/internal/domain/condition.go

package domain

import (
	"fmt"
	"strings"
)

type Operator string

const (
	OpEqual            Operator = "=="
	OpNotEqual         Operator = "!="
	OpGreaterThan      Operator = ">"
	OpGreaterThanEqual Operator = ">="
	OpLessThan         Operator = "<"
	OpLessThanEqual    Operator = "<="

	OpContains Operator = "contains"
	OpNotContains Operator = "not_contains"
	OpStartsWith Operator = "starts_with"
	OpEndsWith Operator = "ends_with"
	OpMatches Operator = "matches"

	OpIsEmpty Operator = "is_empty"
	OpIsNotEmpty Operator = "is_not_empty"

	OpLengthGTE Operator = "length_gte"
	OpLengthLTE Operator = "length_lte"
)

var AllOperators = []Operator{
	OpEqual, OpNotEqual, OpGreaterThan, OpGreaterThanEqual,
	OpLessThan, OpLessThanEqual, OpContains, OpNotContains,
	OpStartsWith, OpEndsWith, OpMatches, OpIsEmpty, OpIsNotEmpty,
	OpLengthGTE, OpLengthLTE,
}

func (o Operator) IsKnown() bool {
	for _, k := range AllOperators {
		if k == o {
			return true
		}
	}
	return false
}

type Condition struct {
	Path string

	Op Operator

	Value any
}

func (c Condition) Validate() error {
	if strings.TrimSpace(c.Path) == "" {
		return NewValidationError("Condition", "path", "obligatoire")
	}
	if !c.Op.IsKnown() {
		return NewValidationError("Condition", "op", fmt.Sprintf("opérateur inconnu : %q", c.Op))
	}
	switch c.Op {
	case OpIsEmpty, OpIsNotEmpty:
	default:
		if c.Value == nil {
			return NewValidationError("Condition", "value",
				fmt.Sprintf("obligatoire pour l'opérateur %q", c.Op))
		}
	}
	return nil
}

type ConditionGroup struct {
	All []Condition
	Any []Condition
	Not []Condition
}

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

func (g ConditionGroup) IsEmpty() bool {
	return len(g.All) == 0 && len(g.Any) == 0 && len(g.Not) == 0
}