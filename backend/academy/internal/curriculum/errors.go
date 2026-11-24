// backend/academy/internal/curriculum/errors.go

package curriculum

import (
	"errors"
	"fmt"
)

var (
	ErrInvalidSchema = errors.New("curriculum: schéma YAML invalide")

	ErrInvalidReference = errors.New("curriculum: référence invalide")

	ErrDuplicateID = errors.New("curriculum: identifiant dupliqué")

	ErrCyclicDependency = errors.New("curriculum: dépendance cyclique")

	ErrMissingContent = errors.New("curriculum: contenu manquant")
)

type FileError struct {
	Path   string
	Line   int
	Err    error
	Detail string
}

func (e *FileError) Error() string {
	loc := e.Path
	if e.Line > 0 {
		loc = fmt.Sprintf("%s:%d", e.Path, e.Line)
	}
	if e.Detail != "" {
		return fmt.Sprintf("%s : %s (%v)", loc, e.Detail, e.Err)
	}
	return fmt.Sprintf("%s : %v", loc, e.Err)
}

func (e *FileError) Unwrap() error { return e.Err }

func NewFileError(path string, line int, err error, detail string) *FileError {
	return &FileError{Path: path, Line: line, Err: err, Detail: detail}
}

type ValidationIssue struct {
	Severity Severity
	Entity string
	EntityID string
	Path string
	Message string
	Cause error
}

func (i ValidationIssue) String() string {
	loc := i.Path
	if loc == "" {
		loc = fmt.Sprintf("%s(%s)", i.Entity, i.EntityID)
	}
	return fmt.Sprintf("[%s] %s : %s", i.Severity, loc, i.Message)
}

func (i ValidationIssue) Error() string { return i.String() }

func (i ValidationIssue) Unwrap() error { return i.Cause }

type Severity string

const (
	SeverityError Severity = "error"
	SeverityWarning Severity = "warning"
)