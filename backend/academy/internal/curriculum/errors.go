package curriculum

import (
	"errors"
	"fmt"
)

// Errors sentinel du package curriculum.
var (
	// ErrInvalidSchema : un fichier YAML ne respecte pas le schéma attendu.
	ErrInvalidSchema = errors.New("curriculum: schéma YAML invalide")

	// ErrInvalidReference : une référence pointe vers une entité inexistante.
	ErrInvalidReference = errors.New("curriculum: référence invalide")

	// ErrDuplicateID : un ID est déclaré plusieurs fois.
	ErrDuplicateID = errors.New("curriculum: identifiant dupliqué")

	// ErrCyclicDependency : un cycle de prérequis a été détecté.
	ErrCyclicDependency = errors.New("curriculum: dépendance cyclique")

	// ErrMissingContent : le répertoire de contenu est vide ou introuvable.
	ErrMissingContent = errors.New("curriculum: contenu manquant")
)

// FileError attache un chemin de fichier et éventuellement une ligne YAML
// à une erreur, pour un diagnostic précis.
type FileError struct {
	Path   string // chemin relatif du fichier
	Line   int    // 1-based, 0 = inconnu
	Err    error  // erreur sous-jacente
	Detail string // contexte additionnel (nom du champ, valeur, etc.)
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

// NewFileError — helper de construction.
func NewFileError(path string, line int, err error, detail string) *FileError {
	return &FileError{Path: path, Line: line, Err: err, Detail: detail}
}

// ValidationIssue est une erreur de validation rattachée à une entité
// identifiée du curriculum.
type ValidationIssue struct {
	// Severity — error bloque le chargement, warning le laisse passer.
	Severity Severity
	// Entity — type d'entité ("Program", "Lesson", "Mission"…).
	Entity string
	// EntityID — identifiant de l'entité concernée.
	EntityID string
	// Path — chemin YAML ou chemin logique (ex. "programs/p1/modules/2/lessons/0/blocks/3").
	Path string
	// Message — description lisible du problème.
	Message string
	// Cause — erreur sous-jacente éventuelle.
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

// Severity classe la criticité d'un problème de validation.
type Severity string

const (
	// SeverityError : bloque le chargement du programme.
	SeverityError Severity = "error"
	// SeverityWarning : signalé mais n'empêche pas le chargement.
	SeverityWarning Severity = "warning"
)