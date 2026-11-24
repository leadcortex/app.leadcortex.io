// backend/academy/internal/adaptivity/errors.go

package adaptivity

import "errors"

var (
	ErrNilLearner = errors.New("adaptivity: learner nil")

	ErrNilRegistry = errors.New("adaptivity: registry nil")

	ErrInvalidMode = errors.New("adaptivity: mode de plan invalide")

	ErrNoCandidate = errors.New("adaptivity: aucune action candidate")

	ErrInvalidSignal = errors.New("adaptivity: signal invalide")
)