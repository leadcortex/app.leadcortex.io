// Package version expose les métadonnées de build.
// Renseignées via -ldflags au moment de la compilation (voir Makefile).
package version

import "runtime"

// Ces variables sont surchargées au build :
//   go build -ldflags="-X '.../version.Version=1.2.3' ..."
var (
	Version   = "dev"
	Commit    = "none"
	BuildDate = "unknown"
)

// Info regroupe les métadonnées utiles au runtime.
type Info struct {
	Version   string `json:"version"`
	Commit    string `json:"commit"`
	BuildDate string `json:"build_date"`
	GoVersion string `json:"go_version"`
}

// Current renvoie l'instantané des métadonnées du binaire en cours.
func Current() Info {
	return Info{
		Version:   Version,
		Commit:    Commit,
		BuildDate: BuildDate,
		GoVersion: runtime.Version(),
	}
}