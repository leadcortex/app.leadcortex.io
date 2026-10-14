//academy\src\components\academy\academy-shell.tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  Gem,
  GraduationCap,
  Lock,
  RotateCcw,
  Settings,
  Sparkles,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  AVATARS,
  CLASSIC_AVATAR_IDS,
  COLLECTOR_AVATAR_IDS,
  DEFAULT_AVATAR_IDS,
  LIMITED_AVATAR_IDS,
  Avatar,
} from "./illustrations";
import { AcademyMobileSheet, useIsMobileAcademy } from "./academy-mobile-sheet";
import { programs, type Lesson } from "../../../../model";
import { LessonPlayer } from "./lesson-player";

/* ==========================================================================
   Types
   ========================================================================== */

export type ChestReward =
  | { kind: "skin"; avatarId: string; rarity: "classic" | "collector" | "limited" }
  | { kind: "gems"; amount: number };

export type SettingsTab = "companions" | "progress" | "params";

type AcademyState = {
  programIndex: number;
  setProgramIndex: (i: number) => void;
  avatar: string;
  setAvatar: (id: string) => void;
  practiced: string[];
  xp: number;
  gems: number;
  unlockedAvatars: string[];
  finish: (lesson: Lesson, xp: number) => void;
  openChest: () => ChestReward;
  resetProgress: () => void;
};

/* ==========================================================================
   Provider
   ========================================================================== */

const AcademyContext = createContext<AcademyState | null>(null);

const CHEST_SKIN_CHANCE = 0.15;
const CHEST_LIMITED_RATIO = 0.05;
const CHEST_COLLECTOR_RATIO = 0.2;
const CHEST_GEMS_MIN = 20;
const CHEST_GEMS_MAX = 80;

export function AcademyProvider({ children }: { children: ReactNode }) {
  const [programIndex, setProgramIndex] = useState(0);
  const [avatar, setAvatar] = useState<string>("fox");
  const [practiced, setPracticed] = useState<string[]>([]);
  const [xp, setXp] = useState(0);
  const [gems, setGems] = useState(0);
  const [unlockedAvatars, setUnlockedAvatars] = useState<string[]>(DEFAULT_AVATAR_IDS);

  function finish(lesson: Lesson, earned: number) {
    if (!practiced.includes(lesson.id)) {
      setPracticed((p) => [...p, lesson.id]);
      setXp((p) => p + earned);
    }
  }

  function openChest(): ChestReward {
    const lockedClassic = CLASSIC_AVATAR_IDS.filter((id) => !unlockedAvatars.includes(id));
    const lockedCollector = COLLECTOR_AVATAR_IDS.filter((id) => !unlockedAvatars.includes(id));
    const lockedLimited = LIMITED_AVATAR_IDS.filter((id) => !unlockedAvatars.includes(id));

    const hasSkin =
      lockedClassic.length > 0 || lockedCollector.length > 0 || lockedLimited.length > 0;

    const roll = Math.random();

    if (roll < CHEST_SKIN_CHANCE && hasSkin) {
      // Tirage parmi les catégories disponibles (limited > collector > classic)
      const subRoll = Math.random();

      let pool: string[] | null = null;
      let rarity: "classic" | "collector" | "limited" = "classic";

      if (subRoll < CHEST_LIMITED_RATIO && lockedLimited.length > 0) {
        pool = lockedLimited;
        rarity = "limited";
      } else if (
        subRoll < CHEST_LIMITED_RATIO + CHEST_COLLECTOR_RATIO &&
        lockedCollector.length > 0
      ) {
        pool = lockedCollector;
        rarity = "collector";
      } else if (lockedClassic.length > 0) {
        pool = lockedClassic;
        rarity = "classic";
      } else if (lockedCollector.length > 0) {
        pool = lockedCollector;
        rarity = "collector";
      } else if (lockedLimited.length > 0) {
        pool = lockedLimited;
        rarity = "limited";
      }

      if (pool) {
        const pick = pool[Math.floor(Math.random() * pool.length)]!;
        setUnlockedAvatars((prev) => [...prev, pick]);
        return { kind: "skin", avatarId: pick, rarity };
      }
    }

    const amount =
      CHEST_GEMS_MIN + Math.floor(Math.random() * (CHEST_GEMS_MAX - CHEST_GEMS_MIN + 1));
    setGems((n) => n + amount);
    return { kind: "gems", amount };
  }

  function resetProgress() {
    setPracticed([]);
    setXp(0);
    setGems(0);
    setUnlockedAvatars(DEFAULT_AVATAR_IDS);
    setAvatar("fox");
    setProgramIndex(0);
  }

  const value = useMemo<AcademyState>(
    () => ({
      programIndex,
      setProgramIndex,
      avatar,
      setAvatar,
      practiced,
      xp,
      gems,
      unlockedAvatars,
      finish,
      openChest,
      resetProgress,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programIndex, avatar, practiced, xp, gems, unlockedAvatars],
  );

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
}

export function useAcademy() {
  const state = useContext(AcademyContext);
  if (!state) throw new Error('AcademyProvider is required');
  return state;
}

/* ==========================================================================
   AcademyShell
   ========================================================================== */

export function AcademyShell({ children }: { children: ReactNode }) {
  const { xp, gems } = useAcademy();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const openTab = (tab: SettingsTab) => {
    setMenuOpen(false);
    setSettingsTab(tab);
  };

  return (
    <div className="academy">
      <div className="academy-head">
        <div className="academy-breadcrumb">
          <GraduationCap className="academy-crumb-icon" aria-hidden="true" />
          <span>Académie</span>
          <span className="academy-crumb-sep" aria-hidden="true">
            /
          </span>
          <strong>Mon parcours</strong>
        </div>

        <div className="academy-head-stats">
          <span className="academy-xp-pill" title="XP de cette session">
            <span className="academy-xp-num">{xp}</span>
            <span className="academy-xp-lbl">XP</span>
          </span>
          <span className="academy-gems-pill" title="Gemmes gagnées">
            <Gem className="academy-gems-icon" fill="currentColor" />
            <span className="academy-gems-num">{gems}</span>
          </span>

          <div className="academy-settings-menu" ref={menuRef}>
            <button
              type="button"
              className="academy-settings-btn"
              aria-label="Paramètres de l’Académie"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Settings className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="academy-settings-dropdown" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="academy-settings-item"
                  onClick={() => openTab('companions')}
                >
                  <UserRound className="w-4 h-4" />
                  <span>Mes compagnons</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="academy-settings-item"
                  onClick={() => openTab('progress')}
                >
                  <Trophy className="w-4 h-4" />
                  <span>Ma progression</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="academy-settings-item"
                  onClick={() => openTab('params')}
                >
                  <Settings className="w-4 h-4" />
                  <span>Paramètres</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="academy-content">{children}</div>

      {settingsTab && (
        <AcademySettingsModal
          tab={settingsTab}
          onTabChange={setSettingsTab}
          onClose={() => setSettingsTab(null)}
        />
      )}
    </div>
  );
}

/* ==========================================================================
   Modale / Sheet de paramètres unifiée
   ========================================================================== */

function AcademySettingsModal({
  tab,
  onTabChange,
  onClose,
}: {
  tab: SettingsTab;
  onTabChange: (t: SettingsTab) => void;
  onClose: () => void;
}) {
  const state = useAcademy();
  const isMobile = useIsMobileAcademy();
  const [confirmReset, setConfirmReset] = useState(false);
  const [revision, setRevision] = useState<Lesson | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !revision) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, revision]);

  const sortedAvatars = useMemo(() => {
    const unlocked = AVATARS.filter((a) => state.unlockedAvatars.includes(a.id));
    const locked = AVATARS.filter((a) => !state.unlockedAvatars.includes(a.id));
    return [...unlocked, ...locked];
  }, [state.unlockedAvatars]);

  const lessonsToReview = useMemo(
    () =>
      programs
        .flatMap((p) => p.modules.flatMap((m) => m.lessons))
        .filter((l) => state.practiced.includes(l.id)),
    [state.practiced],
  );

  const unlockedCount = state.unlockedAvatars.length;
  const totalCount = AVATARS.length;

  /* --- Bloc « barre d'onglets » réutilisé (desktop + sheet mobile) --- */
  const tabsBar = (
    <div className="settings-modal-tabs" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'companions'}
        className={`settings-modal-tab ${tab === 'companions' ? 'is-active' : ''}`}
        onClick={() => onTabChange('companions')}
      >
        <UserRound className="w-4 h-4" />
        Compagnons
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'progress'}
        className={`settings-modal-tab ${tab === 'progress' ? 'is-active' : ''}`}
        onClick={() => onTabChange('progress')}
      >
        <Trophy className="w-4 h-4" />
        Progression
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'params'}
        className={`settings-modal-tab ${tab === 'params' ? 'is-active' : ''}`}
        onClick={() => onTabChange('params')}
      >
        <Settings className="w-4 h-4" />
        Paramètres
      </button>
    </div>
  );

  /* --- Bloc « contenu de l'onglet actif » réutilisé --- */
  const tabContent = (
    <>
      {tab === 'companions' && (
        <div className="settings-panel">
          <div className="settings-panel-head">
            <h3>Vos compagnons</h3>
            <span className="settings-panel-count">
              {unlockedCount} / {totalCount} débloqués
            </span>
          </div>
          <p className="settings-panel-desc">
            Ouvrez des coffres pour tenter de découvrir de nouveaux compagnons. Les
            compagnons <b>collector</b> sont rares.
          </p>

          <div className="avatar-grid">
            {sortedAvatars.map((a) => {
              const isUnlocked = state.unlockedAvatars.includes(a.id);
              const isActive = state.avatar === a.id;
              const badgeLabel =
                a.rarity === 'default'
                  ? 'Défaut'
                  : a.rarity === 'collector'
                    ? 'Collector'
                    : 'Coffre';
              return (
                <article
                  key={a.id}
                  className={`avatar-card ${isUnlocked ? 'is-unlocked' : 'is-locked'} ${
                    isActive ? 'is-active' : ''
                  }`}
                >
                  <span className={`avatar-card__badge avatar-card__badge--${a.rarity}`}>
                    {badgeLabel}
                  </span>
                  <div className="avatar-card__avatar">
                    <Avatar kind={a.id} />
                    {!isUnlocked && (
                      <span className="avatar-card__lock" aria-hidden="true">
                        <Lock className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <h3>{a.label}</h3>
                  {isUnlocked ? (
                    <Button
                      variant={isActive ? 'academyOutline' : 'academy'}
                      onClick={() => state.setAvatar(a.id)}
                      disabled={isActive}
                    >
                      {isActive ? (
                        <>
                          <Check /> Équipé
                        </>
                      ) : (
                        'Choisir'
                      )}
                    </Button>
                  ) : (
                    <span className="avatar-card__hint">À débloquer</span>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'progress' && (
        <div className="settings-panel">
          <div className="settings-panel-head">
            <h3>Votre progression</h3>
          </div>
          <p className="settings-panel-desc">
            Retrouvez vos statistiques et revenez sur vos acquis.
          </p>

          <div className="settings-stats">
            <div className="settings-stat">
              <span className="settings-stat__icon settings-stat__icon--gold">
                <Zap fill="currentColor" />
              </span>
              <div className="settings-stat__body">
                <strong>{state.xp}</strong>
                <small>XP gagnés</small>
              </div>
            </div>
            <div className="settings-stat">
              <span className="settings-stat__icon settings-stat__icon--green">
                <Trophy />
              </span>
              <div className="settings-stat__body">
                <strong>{state.practiced.length}</strong>
                <small>Leçons terminées</small>
              </div>
            </div>
            <div className="settings-stat">
              <span className="settings-stat__icon settings-stat__icon--blue">
                <Gem fill="currentColor" />
              </span>
              <div className="settings-stat__body">
                <strong>{state.gems}</strong>
                <small>Gemmes</small>
              </div>
            </div>
          </div>

          <div className="settings-subhead">
            <h4>Révisions</h4>
            <span>
              {lessonsToReview.length} leçon{lessonsToReview.length > 1 ? 's' : ''}
            </span>
          </div>

          {lessonsToReview.length === 0 ? (
            <div className="settings-empty">
              <BookOpen className="w-6 h-6" />
              <p>Tout commence par une première leçon.</p>
            </div>
          ) : (
            <div className="review-list">
              {lessonsToReview.map((l) => (
                <Button
                  key={l.id}
                  variant="academyOutline"
                  className="program-option"
                  onClick={() => setRevision(l)}
                >
                  <BookOpen />
                  <span>
                    <strong>{l.title}</strong>
                    <small>{l.duration_min} min · Revoir cet entraînement</small>
                  </span>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'params' && (
        <div className="settings-panel">
          <div className="settings-panel-head">
            <h3>Paramètres</h3>
          </div>
          <p className="settings-panel-desc">
            Options générales de l’Académie. La connexion à votre compte Lead Cortex activera
            la synchronisation entre appareils.
          </p>

          <ul className="settings-list">
            <li className="settings-list__row">
              <div>
                <strong>Compagnon actif</strong>
                <span>{AVATARS.find((a) => a.id === state.avatar)?.label ?? '—'}</span>
              </div>
              <Button variant="academyOutline" onClick={() => onTabChange('companions')}>
                Changer
              </Button>
            </li>
            <li className="settings-list__row">
              <div>
                <strong>Progression de la session</strong>
                <span>
                  {state.practiced.length} leçon{state.practiced.length > 1 ? 's' : ''} ·{' '}
                  {state.xp} XP · {state.gems} gemmes
                </span>
              </div>
              {confirmReset ? (
                <div className="settings-reset-confirm">
                  <Button variant="academyOutline" onClick={() => setConfirmReset(false)}>
                    Annuler
                  </Button>
                  <Button
                    variant="academy"
                    className="settings-reset-danger"
                    onClick={() => {
                      state.resetProgress();
                      setConfirmReset(false);
                    }}
                  >
                    Confirmer
                  </Button>
                </div>
              ) : (
                <Button variant="academyOutline" onClick={() => setConfirmReset(true)}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Réinitialiser
                </Button>
              )}
            </li>
            <li className="settings-list__row">
              <div>
                <strong>Connexion au compte</strong>
                <span>Synchronisation multi-appareils à venir</span>
              </div>
              <span className="settings-badge">Bientôt</span>
            </li>
          </ul>

          <div className="settings-tip">
            <Sparkles className="w-4 h-4" />
            <span>
              Vous pourrez bientôt personnaliser le thème et la langue depuis cet espace.
            </span>
          </div>
        </div>
      )}
    </>
  );

  /* --- Rendu mobile : sheet bottom-up --- */
  if (isMobile) {
    return (
      <>
        <AcademyMobileSheet
          open
          onOpenChange={(o) => {
            if (!o && !revision) onClose();
          }}
          title="Votre espace"
        >
          {tabsBar}
          <div className="settings-modal-body settings-modal-body--sheet">{tabContent}</div>
        </AcademyMobileSheet>

        {revision && (
          <LessonPlayer
            key={revision.id}
            lesson={revision}
            avatar={state.avatar}
            onClose={() => setRevision(null)}
            onComplete={() => setRevision(null)}
          />
        )}
      </>
    );
  }

  /* --- Rendu desktop : modale classique --- */
  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <section
          className="academy-modal academy-modal--settings"
          role="dialog"
          aria-modal="true"
          aria-label="Paramètres de l’Académie"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="settings-modal-head">
            <h2>Votre espace</h2>
            <button
              type="button"
              className="settings-modal-close"
              aria-label="Fermer"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          {tabsBar}

          <div className="settings-modal-body">{tabContent}</div>
        </section>
      </div>

      {revision && (
        <LessonPlayer
          key={revision.id}
          lesson={revision}
          avatar={state.avatar}
          onClose={() => setRevision(null)}
          onComplete={() => setRevision(null)}
        />
      )}
    </>
  );
}