// backend/academy/internal/config/config.go

package config

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/spf13/viper"
)

type Env string

const (
	EnvDevelopment Env = "development"
	EnvStaging     Env = "staging"
	EnvProduction  Env = "production"
)

func (e Env) IsProduction() bool { return e == EnvProduction }

func (e Env) IsDevelopment() bool { return e == EnvDevelopment }

type Config struct {
	Env      Env            `mapstructure:"env"`
	HTTP     HTTPConfig     `mapstructure:"http"`
	Content  ContentConfig  `mapstructure:"content"`
	Log      LogConfig      `mapstructure:"log"`
	Security SecurityConfig `mapstructure:"security"`
}

type HTTPConfig struct {
	Addr            string        `mapstructure:"addr"`
	ReadTimeout     time.Duration `mapstructure:"read_timeout"`
	WriteTimeout    time.Duration `mapstructure:"write_timeout"`
	IdleTimeout     time.Duration `mapstructure:"idle_timeout"`
	ShutdownTimeout time.Duration `mapstructure:"shutdown_timeout"`
	CORSOrigins     []string      `mapstructure:"cors_origins"`
}

type ContentConfig struct {
	Dir           string        `mapstructure:"dir"`
	WatchInterval time.Duration `mapstructure:"watch_interval"`
	FailOnWarning bool          `mapstructure:"fail_on_warning"`
}

type LogConfig struct {
	Level  string `mapstructure:"level"`
	Format string `mapstructure:"format"`
}

type SecurityConfig struct {
	RequireAuthForMutations bool `mapstructure:"require_auth_for_mutations"`

	TrustedProxies []string `mapstructure:"trusted_proxies"`
}

func Default() Config {
	return Config{
		Env: EnvDevelopment,
		HTTP: HTTPConfig{
			Addr:            ":8080",
			ReadTimeout:     15 * time.Second,
			WriteTimeout:    30 * time.Second,
			IdleTimeout:     120 * time.Second,
			ShutdownTimeout: 10 * time.Second,
			CORSOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		},
		Content: ContentConfig{
			Dir:           "./content",
			WatchInterval: 0,
			FailOnWarning: false,
		},
		Log: LogConfig{
			Level:  "info",
			Format: "json",
		},
		Security: SecurityConfig{
			RequireAuthForMutations: false,
			TrustedProxies:          nil,
		},
	}
}

func Load(flags map[string]any) (Config, error) {
	v := viper.New()

	def := Default()
	v.SetDefault("env", string(def.Env))
	v.SetDefault("http.addr", def.HTTP.Addr)
	v.SetDefault("http.read_timeout", def.HTTP.ReadTimeout)
	v.SetDefault("http.write_timeout", def.HTTP.WriteTimeout)
	v.SetDefault("http.idle_timeout", def.HTTP.IdleTimeout)
	v.SetDefault("http.shutdown_timeout", def.HTTP.ShutdownTimeout)
	v.SetDefault("http.cors_origins", def.HTTP.CORSOrigins)
	v.SetDefault("content.dir", def.Content.Dir)
	v.SetDefault("content.watch_interval", def.Content.WatchInterval)
	v.SetDefault("content.fail_on_warning", def.Content.FailOnWarning)
	v.SetDefault("log.level", def.Log.Level)
	v.SetDefault("log.format", def.Log.Format)
	v.SetDefault("security.require_auth_for_mutations", def.Security.RequireAuthForMutations)
	v.SetDefault("security.trusted_proxies", def.Security.TrustedProxies)

	v.SetConfigName("academy")
	v.SetConfigType("yaml")
	v.AddConfigPath(".")
	v.AddConfigPath("./config")
	if err := v.ReadInConfig(); err != nil {
		var notFound viper.ConfigFileNotFoundError
		if !errors.As(err, &notFound) {
			return Config{}, fmt.Errorf("lecture academy.yaml : %w", err)
		}
	}

	v.SetEnvPrefix("ACADEMY")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	if flags != nil {
		for key, val := range flags {
			v.Set(key, val)
		}
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return Config{}, fmt.Errorf("décodage de la configuration : %w", err)
	}

	if err := cfg.validate(); err != nil {
		return Config{}, err
	}

	return cfg, nil
}

func (c Config) validate() error {
	switch c.Env {
	case EnvDevelopment, EnvStaging, EnvProduction:
	default:
		return fmt.Errorf("env invalide : %q (attendu : development|staging|production)", c.Env)
	}

	if strings.TrimSpace(c.HTTP.Addr) == "" {
		return errors.New("http.addr ne peut pas être vide")
	}
	if c.HTTP.ShutdownTimeout <= 0 {
		return errors.New("http.shutdown_timeout doit être > 0")
	}

	if strings.TrimSpace(c.Content.Dir) == "" {
		return errors.New("content.dir ne peut pas être vide")
	}
	if _, err := os.Stat(c.Content.Dir); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return fmt.Errorf("content.dir introuvable : %s", c.Content.Dir)
		}
		return fmt.Errorf("content.dir inaccessible : %w", err)
	}

	switch strings.ToLower(c.Log.Level) {
	case "debug", "info", "warn", "error":
	default:
		return fmt.Errorf("log.level invalide : %q", c.Log.Level)
	}
	switch strings.ToLower(c.Log.Format) {
	case "json", "console":
	default:
		return fmt.Errorf("log.format invalide : %q (attendu : json|console)", c.Log.Format)
	}

	if c.Env.IsProduction() {
		if c.Security.RequireAuthForMutations == false {
			return errors.New(
				"security.require_auth_for_mutations doit être true en production",
			)
		}
		if c.Log.Format != "json" {
			return errors.New("log.format doit être json en production")
		}
	}

	return nil
}

func (c Config) IsDevelopmentLike() bool {
	return c.Env.IsDevelopment() || c.Env == EnvStaging
}