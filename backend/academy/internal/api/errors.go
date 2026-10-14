package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/leadcortex/academy/internal/adaptivity"
	"github.com/leadcortex/academy/internal/assessment"
	"github.com/leadcortex/academy/internal/avatars"
	"github.com/leadcortex/academy/internal/domain"
	"github.com/leadcortex/academy/internal/gamification"
	"github.com/leadcortex/academy/internal/missions"
	"github.com/leadcortex/academy/internal/progress"
	"github.com/leadcortex/academy/internal/repository"
	"github.com/leadcortex/academy/internal/srs"
)

// apiError est le format standard d'une erreur HTTP renvoyée par l'API.
//
// Toutes les erreurs — succès ou échec — sont sérialisées en JSON avec
// le même schéma, pour que le client React ait un traitement uniforme.
type apiError struct {
	// Error — code machine stable, snake_case, ex. "not_found".
	Error string `json:"error"`

	// Message — description lisible par un humain.
	Message string `json:"message"`

	// Code — code HTTP (redondant avec le status, mais pratique côté
	// client pour éviter de dépendre du status).
	Code int `json:"code"`

	// Fields — optionnel : erreurs par champ, pour les formulaires.
	Fields map[string]string `json:"fields,omitempty"`
}

// Codes machine stables — utilisés par le client pour distinguer les
// cas et afficher le bon message.
const (
	CodeBadRequest    = "bad_request"
	CodeUnauthorized  = "unauthorized"
	CodeForbidden     = "forbidden"
	CodeNotFound      = "not_found"
	CodeConflict      = "conflict"
	CodeUnprocessable = "unprocessable_entity"
	CodeInternalError = "internal_error"
	CodeUnavailable   = "service_unavailable"
)

/* ─── Helpers d'écriture ──────────────────────────────────────────────── */

// WriteError écrit la réponse HTTP correspondant à `err`.
//
// La classification utilise errors.Is / errors.As sur les sentinelles
// des packages internes. Toute erreur non reconnue devient une 500.
func WriteError(w http.ResponseWriter, err error) {
	status, code, message := classify(err)
	writeJSON(w, status, apiError{
		Error:   code,
		Message: message,
		Code:    status,
	})
}

// WriteBadRequest écrit une 400 avec un message personnalisé.
func WriteBadRequest(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusBadRequest, apiError{
		Error:   CodeBadRequest,
		Message: message,
		Code:    http.StatusBadRequest,
	})
}

// WriteValidation écrit une 400 avec des erreurs par champ.
func WriteValidation(w http.ResponseWriter, fields map[string]string) {
	writeJSON(w, http.StatusBadRequest, apiError{
		Error:   CodeBadRequest,
		Message: "validation échouée",
		Code:    http.StatusBadRequest,
		Fields:  fields,
	})
}

// WriteUnauthorized écrit une 401.
func WriteUnauthorized(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusUnauthorized, apiError{
		Error:   CodeUnauthorized,
		Message: message,
		Code:    http.StatusUnauthorized,
	})
}

// WriteForbidden écrit une 403.
func WriteForbidden(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusForbidden, apiError{
		Error:   CodeForbidden,
		Message: message,
		Code:    http.StatusForbidden,
	})
}

// WriteNotFound écrit une 404.
func WriteNotFound(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusNotFound, apiError{
		Error:   CodeNotFound,
		Message: message,
		Code:    http.StatusNotFound,
	})
}

// WriteConflict écrit une 409.
func WriteConflict(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusConflict, apiError{
		Error:   CodeConflict,
		Message: message,
		Code:    http.StatusConflict,
	})
}

// WriteUnprocessable écrit une 422.
func WriteUnprocessable(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusUnprocessableEntity, apiError{
		Error:   CodeUnprocessable,
		Message: message,
		Code:    http.StatusUnprocessableEntity,
	})
}

// WriteInternal écrit une 500 en masquant les détails techniques.
// Le message technique est destiné au log, pas à la réponse.
func WriteInternal(w http.ResponseWriter, logMessage string) {
	msg := "une erreur interne est survenue"
	if logMessage != "" {
		msg = logMessage // dev : on remonte le vrai message
	}
	writeJSON(w, http.StatusInternalServerError, apiError{
		Error:   CodeInternalError,
		Message: msg,
		Code:    http.StatusInternalServerError,
	})
}

// WriteUnavailable écrit une 503.
func WriteUnavailable(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusServiceUnavailable, apiError{
		Error:   CodeUnavailable,
		Message: message,
		Code:    http.StatusServiceUnavailable,
	})
}

// WriteJSON sérialise une valeur en JSON et écrit le statut.
// Utilitaire public pour les handlers.
func WriteJSON(w http.ResponseWriter, status int, v any) {
	writeJSON(w, status, v)
}

/* ─── Classification ─────────────────────────────────────────────────── */

// classify traduit une erreur interne en (status, code machine, message).
//
// L'ordre des tests est important : les erreurs les plus spécifiques
// d'abord, puis les sentinelles génériques.
func classify(err error) (int, string, string) {
	if err == nil {
		return http.StatusOK, "", ""
	}

	// ── Repository ────────────────────────────────────────────────────
	switch {
	case errors.Is(err, repository.ErrNotFound):
		return http.StatusNotFound, CodeNotFound, "ressource introuvable"
	case errors.Is(err, repository.ErrInvalidArgument):
		return http.StatusBadRequest, CodeBadRequest, "argument invalide"
	case errors.Is(err, repository.ErrConflict):
		return http.StatusConflict, CodeConflict, "conflit de ressource"
	case errors.Is(err, repository.ErrClosed):
		return http.StatusServiceUnavailable, CodeUnavailable, "service indisponible"
	case errors.Is(err, repository.ErrNotImplemented):
		return http.StatusNotImplemented, CodeInternalError, "non implémenté"
	}

	// ── Domain ────────────────────────────────────────────────────────
	var ve *domain.ValidationError
	if errors.As(err, &ve) {
		return http.StatusBadRequest, CodeBadRequest, ve.Error()
	}
	switch {
	case errors.Is(err, domain.ErrNotFound):
		return http.StatusNotFound, CodeNotFound, "entité introuvable"
	case errors.Is(err, domain.ErrInvalid):
		return http.StatusBadRequest, CodeBadRequest, "entité invalide"
	case errors.Is(err, domain.ErrConflict):
		return http.StatusConflict, CodeConflict, "conflit d'entité"
	case errors.Is(err, domain.ErrPrerequisiteNotMet):
		return http.StatusForbidden, CodeForbidden, "prérequis non satisfait"
	case errors.Is(err, domain.ErrLocked):
		return http.StatusForbidden, CodeForbidden, "ressource verrouillée"
	case errors.Is(err, domain.ErrAlreadyCompleted):
		return http.StatusConflict, CodeConflict, "déjà effectué"
	}

	// ── Progress ──────────────────────────────────────────────────────
	switch {
	case errors.Is(err, progress.ErrLessonNotInRegistry):
		return http.StatusNotFound, CodeNotFound, "leçon introuvable"
	case errors.Is(err, progress.ErrLessonNotStarted):
		return http.StatusBadRequest, CodeBadRequest, "leçon non démarrée"
	case errors.Is(err, progress.ErrBlockOutOfOrder):
		return http.StatusBadRequest, CodeBadRequest, "bloc hors séquence"
	case errors.Is(err, progress.ErrInvalidEvent):
		return http.StatusBadRequest, CodeBadRequest, "événement invalide"
	}
	var ue *progress.UnlockError
	if errors.As(err, &ue) {
		return http.StatusForbidden, CodeForbidden, ue.Error()
	}
	var te *progress.TransitionError
	if errors.As(err, &te) {
		return http.StatusConflict, CodeConflict, te.Error()
	}

	// ── Assessment ────────────────────────────────────────────────────
	switch {
	case errors.Is(err, assessment.ErrInvalidAnswer):
		return http.StatusBadRequest, CodeBadRequest, "réponse invalide"
	case errors.Is(err, assessment.ErrNotEvaluable):
		return http.StatusUnprocessableEntity, CodeUnprocessable, "exercice non évaluable"
	case errors.Is(err, assessment.ErrUnsupportedKind):
		return http.StatusUnprocessableEntity, CodeUnprocessable, "type d'exercice non supporté"
	case errors.Is(err, assessment.ErrMissingPayload):
		return http.StatusInternalServerError, CodeInternalError, "payload manquant"
	}

	// ── Quêtes ────────────────────────────────────────────────────────
	switch {
	case errors.Is(err, gamification.ErrQuestNotFound):
		return http.StatusNotFound, CodeNotFound, "quête introuvable"
	case errors.Is(err, gamification.ErrQuestNotComplete):
		return http.StatusBadRequest, CodeBadRequest, "quête non terminée"
	case errors.Is(err, gamification.ErrQuestAlreadyClaimed):
		return http.StatusConflict, CodeConflict, "quête déjà réclamée"
	}

	// ── SRS ───────────────────────────────────────────────────────────
	switch {
	case errors.Is(err, srs.ErrCardNotFound):
		return http.StatusNotFound, CodeNotFound, "carte introuvable"
	case errors.Is(err, srs.ErrCardNotDue):
		return http.StatusBadRequest, CodeBadRequest, "carte non due"
	case errors.Is(err, srs.ErrInvalidQuality):
		return http.StatusBadRequest, CodeBadRequest, "qualité invalide"
	case errors.Is(err, srs.ErrInvalidCard):
		return http.StatusBadRequest, CodeBadRequest, "carte invalide"
	case errors.Is(err, srs.ErrEmptyTemplates):
		return http.StatusBadRequest, CodeBadRequest, "aucun template SRS"
	}

	// ── Missions ──────────────────────────────────────────────────────
	switch {
	case errors.Is(err, missions.ErrUnknownMission):
		return http.StatusNotFound, CodeNotFound, "mission introuvable"
	case errors.Is(err, missions.ErrNilLearner):
		return http.StatusBadRequest, CodeBadRequest, "apprenant requis"
	case errors.Is(err, missions.ErrInvalidEvent):
		return http.StatusBadRequest, CodeBadRequest, "événement invalide"
	case errors.Is(err, missions.ErrUnknownEvent):
		return http.StatusBadRequest, CodeBadRequest, "type d'événement inconnu"
	}

	// ── Avatars ───────────────────────────────────────────────────────
	switch {
	case errors.Is(err, avatars.ErrUnknownAvatar):
		return http.StatusNotFound, CodeNotFound, "avatar introuvable"
	case errors.Is(err, avatars.ErrUnknownPose):
		return http.StatusBadRequest, CodeBadRequest, "pose inconnue"
	case errors.Is(err, avatars.ErrInvalidContext):
		return http.StatusBadRequest, CodeBadRequest, "contexte invalide"
	}

	// ── Adaptivity ────────────────────────────────────────────────────
	switch {
	case errors.Is(err, adaptivity.ErrInvalidMode):
		return http.StatusBadRequest, CodeBadRequest, "mode de plan invalide"
	case errors.Is(err, adaptivity.ErrNilLearner):
		return http.StatusBadRequest, CodeBadRequest, "apprenant requis"
	case errors.Is(err, adaptivity.ErrNilRegistry):
		return http.StatusInternalServerError, CodeInternalError, "registre manquant"
	}

	// ── Fallback ──────────────────────────────────────────────────────
	return http.StatusInternalServerError, CodeInternalError, "une erreur interne est survenue"
}

/* ─── Sérialisation ──────────────────────────────────────────────────── */

// writeJSON est la primitive commune. Ne pas appeler directement depuis
// les handlers : préférer WriteJSON ou WriteError.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if v == nil {
		return
	}
	_ = json.NewEncoder(w).Encode(v)
}
