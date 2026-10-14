//academy\src\components\academy\learning-path.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Gem,
  LockKeyhole,
  NotebookPen,
  Sparkles,
  Star,
  Target,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '../ui/button';
import { programs, type Lesson } from '../../../../model';
import { AcademyShell, useAcademy, type ChestReward } from './academy-shell';
import { AcademyMobileSheet, useIsMobileAcademy } from './academy-mobile-sheet';
import { Avatar, Chest, Flame, getAvatarDef } from './illustrations';
import { LessonPlayer } from './lesson-player';

type ChapterNumber = 1 | 2;

type ProgramModule = (typeof programs)[number]['modules'][number];

type Chapter = {
  number: ChapterNumber;
  title: string;
  subtitle: string;
  modules: ProgramModule[];
};

const CHAPTER_META: Record<ChapterNumber, { title: string; subtitle: string }> = {
  1: {
    title: 'Fondations',
    subtitle: 'Les bases de la prospection B2B',
  },
  2: {
    title: 'Passer à l’action',
    subtitle: 'De la théorie au premier rendez-vous',
  },
};

const CHAPTER_ORDER: ChapterNumber[] = [1, 2];

/* ==========================================================================
   10 palettes de couleurs cyclées sur les modules
   - main : fond principal (contraste avec texte blanc)
   - dark : ombre portée du bas
   - soft : couleur pâle pour les accents
   ========================================================================== */

type ModulePalette = { main: string; dark: string; soft: string };

const MODULE_PALETTES: ModulePalette[] = [
  { main: '#C99A2E', dark: '#8F6B1F', soft: '#FBF1D6' }, // Honey (défaut Academy)
  { main: '#2E6EE0', dark: '#1E4A9E', soft: '#DBEAFE' }, // Ocean
  { main: '#1E9B4F', dark: '#146235', soft: '#DCFCE7' }, // Forest
  { main: '#D93838', dark: '#A02424', soft: '#FEE2E2' }, // Ember
  { main: '#0D9488', dark: '#0A6B62', soft: '#CCFBF1' }, // Lagoon
  { main: '#DB2777', dark: '#9D1656', soft: '#FCE7F3' }, // Blossom
  { main: '#7C3AED', dark: '#5B21B6', soft: '#EDE9FE' }, // Amethyst
  { main: '#EA580C', dark: '#B84307', soft: '#FFEDD5' }, // Sunset
  { main: '#4F46E5', dark: '#3730A3', soft: '#E0E7FF' }, // Twilight
  { main: '#65A30D', dark: '#4D7C0F', soft: '#ECFCCB' }, // Sage
];

function paletteFor(index: number): ModulePalette {
  return MODULE_PALETTES[index % MODULE_PALETTES.length] ?? MODULE_PALETTES[0]!;
}

/* ==========================================================================
   Ordre des avatars : renard (défaut) → classiques → collectors → limited
   ========================================================================== */

const MODULE_AVATAR_ORDER: string[] = [
  'fox', // défaut — module 1
  'eagle', // classique
  'astral-owl', // collector
  'panda', // classique
  'lunar-cat', // collector
  'tiger', // classique
  'golden-dolphin', // collector
  'wolf', // classique
  'mosaic-turtle', // collector
  'red-panda', // classique
  'solar-lion', // collector
  'founding-dolphin', // limited
];

function avatarFor(index: number): string {
  return MODULE_AVATAR_ORDER[index % MODULE_AVATAR_ORDER.length] ?? 'fox';
}

export function LearningPath() {
  const state = useAcademy();
  const isMobile = useIsMobileAcademy();
  const [chooser, setChooser] = useState(false);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [chest, setChest] = useState(false);
  const [chestReward, setChestReward] = useState<ChestReward | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [chapter2Forced, setChapter2Forced] = useState(false);

  const sectionRef = useRef<HTMLElement | null>(null);

  const program = programs[state.programIndex] ?? programs[0];

  const all = useMemo(
    () => (program ? program.modules.flatMap((m) => m.lessons) : []),
    [program],
  );
  const nextId = all.find((l) => !state.practiced.includes(l.id))?.id;
  const completed = all.filter((l) => state.practiced.includes(l.id)).length;

  /* --- Regroupement en chapitres --- */
  const chapters: Chapter[] = useMemo(() => {
    if (!program) return [];

    const groups = new Map<ChapterNumber, ProgramModule[]>();

    for (const mod of program.modules) {
      const raw = (mod as { chapter?: unknown }).chapter;
      const n: ChapterNumber = raw === 2 ? 2 : 1;
      const bucket = groups.get(n) ?? [];
      bucket.push(mod);
      groups.set(n, bucket);
    }

    const result: Chapter[] = [];
    for (const number of CHAPTER_ORDER) {
      const modules = groups.get(number);
      if (!modules || modules.length === 0) continue;
      result.push({
        number,
        title: CHAPTER_META[number].title,
        subtitle: CHAPTER_META[number].subtitle,
        modules,
      });
    }
    return result;
  }, [program]);

  /* --- Progression par chapitre --- */
  const chapterProgress = useMemo(() => {
    const map = new Map<ChapterNumber, { done: number; total: number }>();
    for (const ch of chapters) {
      const lessons = ch.modules.flatMap((m) => m.lessons);
      const done = lessons.filter((l) => state.practiced.includes(l.id)).length;
      map.set(ch.number, { done, total: lessons.length });
    }
    return map;
  }, [chapters, state.practiced]);

  /* --- Chapitre 2 masqué par défaut --- */
  const chapter2HasProgress = useMemo(() => {
    const ch2 = chapters.find((c) => c.number === 2);
    if (!ch2) return false;
    return ch2.modules.some((mod) =>
      mod.lessons.some((l) => state.practiced.includes(l.id)),
    );
  }, [chapters, state.practiced]);

  const chapter2Visible = chapter2Forced || chapter2HasProgress;

  const visibleChapters = useMemo(
    () => chapters.filter((ch) => ch.number === 1 || chapter2Visible),
    [chapters, chapter2Visible],
  );

  /* --- Liste plate des modules visibles (bannière) --- */
  const flatModules = useMemo(
    () =>
      visibleChapters.flatMap((ch) =>
        ch.modules.map((m) => ({ ...m, chapterNumber: ch.number })),
      ),
    [visibleChapters],
  );

  /* --- Map id → index global (pour palettes + avatars) --- */
  const moduleGlobalIndex = useMemo(() => {
    const map = new Map<string, number>();
    flatModules.forEach((m, i) => map.set(m.id, i));
    return map;
  }, [flatModules]);

  /* --- Suivi du module actif au scroll --- */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const update = () => {
      const bannerEl = section.querySelector<HTMLElement>('.program-banner');
      const bannerHeight = bannerEl?.getBoundingClientRect().height ?? 110;
      const threshold = bannerHeight + 12;

      const headers = section.querySelectorAll<HTMLElement>('[data-module-anchor]');
      const sectionTop = section.getBoundingClientRect().top;
      let current: string | null = null;
      for (const h of headers) {
        const rect = h.getBoundingClientRect();
        if (rect.top - sectionTop <= threshold) {
          current = h.dataset.moduleId ?? null;
        } else {
          break;
        }
      }
      if (!current && headers.length > 0) {
        current = headers[0]!.dataset.moduleId ?? null;
      }
      setActiveModuleId((prev) => (prev === current ? prev : current));
    };

    update();
    section.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      section.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [flatModules.length]);

  /* --- Module actif + palette --- */
  const activeModule = useMemo(
    () => flatModules.find((m) => m.id === activeModuleId) ?? flatModules[0] ?? null,
    [flatModules, activeModuleId],
  );
  const activeModuleIndex = activeModule
    ? flatModules.findIndex((m) => m.id === activeModule.id)
    : -1;
  const activePalette = paletteFor(Math.max(0, activeModuleIndex));

  const activeModuleProgress = activeModule
    ? {
        done: activeModule.lessons.filter((l) => state.practiced.includes(l.id)).length,
        total: activeModule.lessons.length,
      }
    : { done: 0, total: 0 };

  const handleChestOpen = () => {
    const reward = state.openChest();
    setChestReward(reward);
    setChest(true);
  };

  const closeChest = () => {
    setChest(false);
    setChestReward(null);
  };

  const revealChapter2 = () => {
    setChapter2Forced(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document
          .getElementById('academy-chapter-2')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  const rewardAvatar =
    chestReward?.kind === 'skin' ? getAvatarDef(chestReward.avatarId) : null;

  /* --- Liste des programmes --- */
  const programList = programs.map((p, i) => (
    <Button
      key={p.id}
      variant="academyOutline"
      className="program-option"
      onClick={() => {
        state.setProgramIndex(i);
        setChooser(false);
        setChapter2Forced(false);
      }}
    >
      <BookOpen />
      <span>
        <strong>{p.title}</strong>
        <small>{p.subtitle}</small>
      </span>
      {state.programIndex === i && <Check className="option-check" />}
    </Button>
  ));

  /* --- Contenu du coffre --- */
  const chestContent =
    chestReward?.kind === 'skin' && rewardAvatar ? (
      <div className="chest-reveal">
        <p className="eyebrow chest-reveal__eyebrow">Nouveau compagnon</p>
        <div className="chest-reveal__avatar-wrap">
          <Avatar kind={chestReward.avatarId} className="chest-reveal__avatar" />
        </div>
        <h2 className="chest-reveal__title">{rewardAvatar.label}</h2>
        <p className="chest-reveal__desc">{rewardAvatar.description}</p>
        <Button variant="academy" onClick={closeChest}>
          Adopter ce compagnon
        </Button>
      </div>
    ) : chestReward ? (
      <div className="chest-reveal">
        <p className="eyebrow chest-reveal__eyebrow">Butin</p>
        <div className="chest-reveal__chest-wrap">
          <Chest />
        </div>
        <h2 className="chest-reveal__title">Un trésor de gemmes</h2>
        <div className="chest-reveal__gems">
          <Gem fill="currentColor" />
          <span>+{chestReward.kind === 'gems' ? chestReward.amount : 0}</span>
        </div>
        <p className="chest-reveal__desc">
          Continuez à ouvrir des coffres pour tenter de débloquer un nouveau compagnon.
        </p>
        <Button variant="academy" onClick={closeChest}>
          Continuer
        </Button>
      </div>
    ) : null;

  if (!program) return null;

  return (
    <AcademyShell>
      <div className="page-heading">
        <div>
          <h1>Un petit pas. Un grand progrès.</h1>
        </div>
        <Button variant="academyOutline" onClick={() => setChooser(true)}>
          <BookOpen /> Les programmes <ChevronDown />
        </Button>
      </div>

      <div className="academy-columns">
        <section ref={sectionRef}>
          {/* Bannière sticky — couleur du module actif */}
          <div
            className="program-banner"
            aria-live="polite"
            style={{
              ['--academy-gold' as string]: activePalette.main,
              ['--academy-gold-dark' as string]: activePalette.dark,
              ['--academy-gold-soft' as string]: activePalette.soft,
            }}
          >
            <div className="program-banner__text">
              <span className="eyebrow">
                Module {activeModuleIndex + 1} sur {flatModules.length}
                {activeModule ? ` · Chapitre ${activeModule.chapterNumber}` : ''}
              </span>
              <h2>{activeModule?.title ?? program.title}</h2>
              <p>{activeModule?.description ?? program.subtitle}</p>
            </div>
            <div className="program-banner__right">
              <span className="program-banner__progress">
                {activeModuleProgress.done}/{activeModuleProgress.total}
              </span>
              <span className="banner-icon">
                <NotebookPen />
              </span>
            </div>
          </div>

          {visibleChapters.map((chapter) => {
            const prog = chapterProgress.get(chapter.number) ?? { done: 0, total: 0 };
            const isComplete = prog.done === prog.total && prog.total > 0;

            return (
              <section
                key={chapter.number}
                id={`academy-chapter-${chapter.number}`}
                className="academy-chapter"
              >
                <header className="academy-chapter__head">
                  <div>
                    <p className="academy-chapter__eyebrow">
                      Chapitre {chapter.number}
                    </p>
                    <h2 className="academy-chapter__title">{chapter.title}</h2>
                    <p className="academy-chapter__subtitle">{chapter.subtitle}</p>
                  </div>
                  <span
                    className={`academy-chapter__badge${
                      isComplete ? ' is-complete' : ''
                    }`}
                  >
                    {isComplete ? (
                      <>
                        <Check strokeWidth={3} /> Terminé
                      </>
                    ) : (
                      `${prog.done}/${prog.total}`
                    )}
                  </span>
                </header>

                {chapter.modules.map((mod, mi) => {
                  const globalIndex = moduleGlobalIndex.get(mod.id) ?? 0;
                  const palette = paletteFor(globalIndex);
                  const avatarId = avatarFor(globalIndex);

                  return (
                    <section
                      key={mod.id}
                      className="module-section"
                      style={{
                        ['--academy-gold' as string]: palette.main,
                        ['--academy-gold-dark' as string]: palette.dark,
                        ['--academy-gold-soft' as string]: palette.soft,
                      }}
                    >
                      <div
                        className="module-heading"
                        data-module-anchor
                        data-module-id={mod.id}
                      >
                        <h3>
                          <span className="module-num">{mi + 1}</span>
                          {mod.title}
                        </h3>
                        <span>
                          {
                            mod.lessons.filter((l) =>
                              state.practiced.includes(l.id),
                            ).length
                          }{' '}
                          / {mod.lessons.length} leçons
                        </span>
                      </div>

                      <div className="learning-path">
                        <svg
                          className="path-connector"
                          viewBox="0 0 185 345"
                          aria-hidden="true"
                        >
                          <path d="M92 10C92 65 20 65 22 121S153 181 142 235 96 283 96 330" />
                        </svg>

                        {mod.lessons.map((lesson) => {
                          const status = state.practiced.includes(lesson.id)
                            ? 'completed'
                            : lesson.id === nextId
                              ? 'available'
                              : 'locked';
                          return (
                            <div
                              key={lesson.id}
                              className="path-step"
                              data-state={status}
                            >
                              {status === 'available' && (
                                <span className="start-label">
                                  {completed ? 'CONTINUER' : 'C’EST PARTI'}
                                </span>
                              )}
                              <Button
                                variant="academyNode"
                                data-state={status}
                                disabled={status === 'locked'}
                                aria-label={`${
                                  status === 'locked' ? 'Verrouillé : ' : ''
                                }${lesson.title}`}
                                title={lesson.title}
                                onClick={() => setActiveLesson(lesson)}
                              >
                                {status === 'completed' ? (
                                  <Check strokeWidth={4} />
                                ) : status === 'locked' ? (
                                  <LockKeyhole />
                                ) : (
                                  <Star fill="currentColor" />
                                )}
                              </Button>
                              <span className="node-caption">{lesson.title}</span>
                            </div>
                          );
                        })}

                        <div className="path-step">
                          <Button
                            variant="academyNode"
                            className="chest-button"
                            aria-label="Ouvrir le coffre du module"
                            onClick={handleChestOpen}
                          >
                            <Chest />
                          </Button>
                          <span className="node-caption">
                            Le coffre des connaissances
                          </span>
                        </div>

                        <div className="path-mascot">
                          <Avatar kind={avatarId} />
                          <p className="mascot-caption">
                            {mi === 0
                              ? 'On y va ensemble ?'
                              : 'Chaque leçon compte.'}
                          </p>
                        </div>
                      </div>
                    </section>
                  );
                })}

                {/* Bouton « Passer au chapitre 2 » — visible une fois */}
                {chapter.number === 1 &&
                  chapters.some((c) => c.number === 2) &&
                  !chapter2Visible && (
                    <div className="chapter-bridge">
                      <div className="chapter-bridge__text">
                        <p className="chapter-bridge__eyebrow">
                          {isComplete ? 'Chapitre 1 terminé' : 'Chapitre 2 disponible'}
                        </p>
                        <p className="chapter-bridge__copy">
                          {isComplete
                            ? 'Tu maîtrises les fondations. Passe à la pratique.'
                            : 'Continue les leçons ou explore la suite dès maintenant.'}
                        </p>
                      </div>
                      <Button
                        variant="academy"
                        onClick={revealChapter2}
                        className="chapter-bridge__btn"
                      >
                        Passer au chapitre 2 <ChevronRight />
                      </Button>
                    </div>
                  )}

                {/* Message de fin de programme */}
                {chapter.number === 2 && (
                  <div
                    className={`chapter-bridge chapter-bridge--final${
                      isComplete ? ' is-complete' : ''
                    }`}
                  >
                    <div className="chapter-bridge__text">
                      <p className="chapter-bridge__eyebrow">
                        {isComplete
                          ? 'Programme terminé'
                          : 'Continuez votre progression'}
                      </p>
                      <p className="chapter-bridge__copy">
                        {isComplete
                          ? 'Bravo, tu as bouclé tout le programme Fondations.'
                          : 'Il te reste quelques leçons pour boucler ce programme.'}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </section>

        <aside className="support-column">
          <section className="support-card">
            <div className="support-title">
              <h3>La régularité, ça paie.</h3>
              <Sparkles />
            </div>
            <div className="streak-display">
              <Flame />
              <div>
                <strong>0 jour</strong>
                <p>Le début d’une belle série.</p>
              </div>
            </div>
            <div className="week-days">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                <div key={i} className={i === 1 ? 'day-today' : ''}>
                  {d}
                  <span />
                </div>
              ))}
            </div>
          </section>

          <section className="support-card">
            <div className="support-title">
              <h3>Quêtes du jour</h3>
              <Target />
            </div>
            <Quest
              icon={<Zap fill="currentColor" />}
              title="Gagner 50 XP"
              current={state.xp}
              total={50}
            />
            <Quest
              icon={<BookOpen />}
              title="Terminer 2 entraînements"
              current={state.practiced.length}
              total={2}
            />
            <Quest
              icon={<Target />}
              title="Faire le premier pas"
              current={state.practiced.length ? 1 : 0}
              total={1}
            />
          </section>

          <section className="support-card">
            <div className="support-title">
              <h3>Votre prochaine étape</h3>
              <Trophy />
            </div>
            <div className="league-body">
              <div className="league-emblem">
                <Star fill="currentColor" />
              </div>
              <div>
                <strong>Les premières fondations</strong>
                <p>
                  {completed} sur {all.length} entraînements
                  <br />
                  Chaque compétence se construit.
                </p>
              </div>
            </div>
            <div className="league-foot">
              <Clock3 />À votre rythme, sans pression.
            </div>
          </section>

          <div className="coach-note">
            <Avatar kind="lunar-cat" />
            <p>
              <strong>La constance fait la différence.</strong>
              Quelques minutes aujourd’hui, de meilleurs réflexes demain.
            </p>
          </div>
        </aside>
      </div>

      {/* Modale des programmes */}
      {chooser &&
        (isMobile ? (
          <AcademyMobileSheet
            open
            onOpenChange={(v) => {
              if (!v) setChooser(false);
            }}
            title="Votre prochaine aventure"
          >
            <div className="program-chooser-sheet">{programList}</div>
          </AcademyMobileSheet>
        ) : (
          <div className="modal-backdrop" onClick={() => setChooser(false)}>
            <section
              className="academy-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Les programmes"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-title">
                <h2>Votre prochaine aventure</h2>
                <Button
                  variant="academyNav"
                  aria-label="Fermer les programmes"
                  onClick={() => setChooser(false)}
                >
                  <X />
                </Button>
              </div>
              {programList}
            </section>
          </div>
        ))}

      {/* Modale du coffre */}
      {chest &&
        chestReward &&
        (isMobile ? (
          <AcademyMobileSheet
            open
            onOpenChange={(v) => {
              if (!v) closeChest();
            }}
            title={chestReward.kind === 'skin' ? 'Nouveau compagnon' : 'Butin'}
            compact
          >
            <div className="academy-chest-sheet">{chestContent}</div>
          </AcademyMobileSheet>
        ) : (
          <div className="modal-backdrop" onClick={closeChest}>
            <section
              className="academy-modal academy-modal--reward"
              role="dialog"
              aria-modal="true"
              aria-label="Butin du coffre"
              onClick={(e) => e.stopPropagation()}
            >
              {chestContent}
            </section>
          </div>
        ))}

      {activeLesson && (
        <LessonPlayer
          key={activeLesson.id}
          lesson={activeLesson}
          avatar={state.avatar}
          onClose={() => setActiveLesson(null)}
          onComplete={(lesson, xp) => {
            state.finish(lesson, xp);
            setActiveLesson(null);
          }}
        />
      )}
    </AcademyShell>
  );
}

function Quest({
  icon,
  title,
  current,
  total,
}: {
  icon: React.ReactNode;
  title: string;
  current: number;
  total: number;
}) {
  const value = Math.min(current, total);
  const level = Math.round((value / total) * 10);
  return (
    <div className="quest">
      <span className="quest-icon">{icon}</span>
      <div className="quest-info">
        <p>{title}</p>
        <div className="quest-meter">
          <div className="progress-track">
            <div className={`progress-fill lesson-progress-${level}`} />
          </div>
          <small>
            {value}/{total}
          </small>
        </div>
      </div>
    </div>
  );
}