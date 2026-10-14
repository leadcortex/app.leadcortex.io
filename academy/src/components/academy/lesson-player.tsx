import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  GripVertical,
  Heart,
  Lightbulb,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar } from './illustrations';
import {
  checkAnswer,
  type Answer,
  type Exercise,
  type Lesson,
  type Slide,
} from '../../../../model';

/* ==========================================================================
   Sanitize — supprime les éléments "robotiques"
   ========================================================================== */

function sanitizeText(text: string): string {
  return text
    .replace(/\s+—\s+/g, '. ')
    .replace(/\s+–\s+/g, '. ')
    .replace(/([.!?])\s*\.\s*/g, '$1 ');
}

/* ==========================================================================
   Copy — rendu markdown minimal (gras + paragraphes + listes + tableaux)
   ========================================================================== */

type Block =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] };

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

function parseBlocks(rawText: string): Block[] {
  const text = sanitizeText(rawText);
  const lines = text.split('\n');
  const blocks: Block[] = [];
  let buffer: string[] = [];

  const flushP = () => {
    const t = buffer.join('\n').trim();
    if (t) blocks.push({ type: 'p', text: t });
    buffer = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;

    if (line.trim() === '') {
      flushP();
      i++;
      continue;
    }

    // Tableau markdown : | ... | puis |---|---|
    const next = lines[i + 1];
    if (line.includes('|') && next && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(next)) {
      flushP();
      const headers = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i]!.includes('|') && lines[i]!.trim() !== '') {
        rows.push(splitRow(lines[i]!));
        i++;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    // Liste numérotée
    const numMatch = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (numMatch) {
      flushP();
      const items: string[] = [numMatch[1]!];
      i++;
      while (i < lines.length) {
        const m = lines[i]!.match(/^\s*\d+[.)]\s+(.+)$/);
        if (!m) break;
        items.push(m[1]!);
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Liste à puces
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (bulletMatch) {
      flushP();
      const items: string[] = [bulletMatch[1]!];
      i++;
      while (i < lines.length) {
        const m = lines[i]!.match(/^\s*[-*]\s+(.+)$/);
        if (!m) break;
        items.push(m[1]!);
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    buffer.push(line);
    i++;
  }
  flushP();
  return blocks;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode {
  return text.split(/(\*\*.*?\*\*)/gs).map((part, j) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={`${keyPrefix}-${j}`}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={`${keyPrefix}-${j}`}>{part}</span>
    ),
  );
}

function renderBlock(block: Block, i: number): React.ReactNode {
  switch (block.type) {
    case 'p':
      return <p key={i}>{renderInline(block.text, `p-${i}`)}</p>;
    case 'ul':
      return (
        <ul key={i} className="lesson-list lesson-list--bullets">
          {block.items.map((item, j) => (
            <li key={j}>{renderInline(item, `ul-${i}-${j}`)}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={i} className="lesson-list lesson-list--numbered">
          {block.items.map((item, j) => (
            <li key={j}>
              <span className="lesson-list__num">{j + 1}</span>
              <span className="lesson-list__text">{renderInline(item, `ol-${i}-${j}`)}</span>
            </li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <div key={i} className="lesson-table-wrap">
          <table className="lesson-table">
            <thead>
              <tr>
                {block.headers.map((h, j) => (
                  <th key={j}>{renderInline(h, `th-${i}-${j}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>{renderInline(cell, `td-${i}-${ri}-${ci}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function Copy({ text }: { text: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);
  return <div className="lesson-copy">{blocks.map((b, i) => renderBlock(b, i))}</div>;
}

/* ==========================================================================
   Types & helpers
   ========================================================================== */

type Step =
  | { kind: 'cover' }
  | { kind: 'slide'; slide: Slide }
  | { kind: 'exercise'; exercise: Exercise }
  | { kind: 'mission'; title: string; text: string }
  | { kind: 'evaluation'; exercises: Exercise[] }
  | { kind: 'end' };

const MAX_EVAL_QUESTIONS = 2;
const MAX_HEARTS = 3;
const MAX_FAILS_BEFORE_EXPLAIN = 3;

function buildSteps(lesson: Lesson): Step[] {
  const steps: Step[] = [];
  for (const b of lesson.blocks) {
    if (b.type === 'cover') steps.push({ kind: 'cover' });
    for (const slide of b.slides ?? []) steps.push({ kind: 'slide', slide });
    for (const exercise of b.exercises ?? []) steps.push({ kind: 'exercise', exercise });
    if (b.mission) {
      steps.push({ kind: 'mission', title: b.mission.title, text: b.mission.brief_md });
    }
  }
  return steps;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* Reformulation : on décale les options d'un MCQ pour changer la position
   de la bonne réponse. Le texte reste identique mais la mécanique change. */
function reformulateMcq(exercise: Exercise, seed: number): Exercise {
  if (exercise.kind !== 'mcq' && exercise.kind !== 'multi_select') return exercise;
  const opts = exercise.payload.options ?? [];
  if (opts.length === 0) return exercise;

  const idxs = opts.map((_, i) => i);
  let s = seed;
  for (let i = idxs.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [idxs[i], idxs[j]] = [idxs[j]!, idxs[i]!];
  }
  const newOpts = idxs.map((i) => opts[i]!);

  if (exercise.kind === 'mcq') {
    const correct = exercise.payload.correct as number;
    const newCorrect = idxs.indexOf(correct);
    return {
      ...exercise,
      payload: { ...exercise.payload, options: newOpts, correct: newCorrect },
    };
  }
  const correctArr = (exercise.payload.correct as number[]) ?? [];
  const newCorrect = correctArr.map((c) => idxs.indexOf(c));
  return {
    ...exercise,
    payload: { ...exercise.payload, options: newOpts, correct: newCorrect },
  };
}

/* ==========================================================================
   Indices
   ========================================================================== */

function getHint(exercise: Exercise): string {
  const explicit = (exercise as { hint_md?: string }).hint_md;
  if (explicit) return explicit;
  switch (exercise.kind) {
    case 'mcq':
      return 'Relis la question et élimine les réponses qui te paraissent fausses. Il ne doit en rester qu’une.';
    case 'multi_select':
      return 'Plusieurs réponses sont correctes. Cherche celles qui correspondent vraiment à ce que dit la leçon.';
    case 'fill_blank':
      return 'Clique sur un mot en bas pour le placer dans l’emplacement en surbrillance. Clique sur un mot déjà placé pour le retirer.';
    case 'match_pairs':
      return 'Clique un élément de gauche, puis son associé à droite. Si la paire est correcte, les deux blocs se figent en vert.';
    case 'order_steps':
      return 'Attrape une ligne par sa poignée et fais-la glisser à la bonne place. Les autres se décalent automatiquement.';
    case 'free_text':
      return 'Réponds avec tes mots. Aide-toi des critères affichés pour vérifier que tu couvres bien chaque point.';
    default:
      return 'Prends le temps de relire l’énoncé. La bonne réponse découle directement du contenu vu plus haut.';
  }
}

/* ==========================================================================
   FillBlank — blocs à trous
   ========================================================================== */

function FillBlankPlayer({
  exercise,
  answer,
  disabled,
  onAnswer,
}: {
  exercise: Exercise;
  answer: Answer;
  disabled: boolean;
  onAnswer: (next: string[]) => void;
}) {
  const blanks = exercise.payload.blanks ?? [];

  const values = useMemo(() => {
    const v = [...(answer as string[])];
    while (v.length < blanks.length) v.push('');
    return v.slice(0, blanks.length);
  }, [answer, blanks.length]);

  const tokens = useMemo(() => {
    const fromBlanks = blanks.map((b) => b.correct[0] ?? '').filter(Boolean);
    const extra = ((exercise.payload as { distractors?: string[] }).distractors ?? []).filter(
      Boolean,
    );
    const unique = Array.from(new Set([...fromBlanks, ...extra]));
    return unique
      .map((t, i) => ({ t, k: hashStr(exercise.id + ':' + t + ':' + i) }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.t);
  }, [blanks, exercise]);

  const usedSet = useMemo(() => new Set(values.filter(Boolean)), [values]);
  const [activeSlot, setActiveSlot] = useState(0);

  const placeToken = (token: string) => {
    if (disabled || usedSet.has(token)) return;
    const next = [...values];
    let idx = next.findIndex((v) => !v);
    if (idx === -1) idx = activeSlot;
    next[idx] = token;
    onAnswer(next);
    const nextEmpty = next.findIndex((v, i) => i > idx && !v);
    if (nextEmpty !== -1) setActiveSlot(nextEmpty);
  };

  const clearSlot = (idx: number) => {
    if (disabled) return;
    const next = [...values];
    next[idx] = '';
    onAnswer(next);
    setActiveSlot(idx);
  };

  return (
    <div className="fill-blank">
      <div className="fill-blank-slots" role="group" aria-label="Emplacements">
        {blanks.map((_, i) => {
          const v = values[i] ?? '';
          const isActive = i === activeSlot && !v;
          return (
            <button
              key={i}
              type="button"
              className={`block-slot ${v ? 'block-slot--filled' : ''} ${
                isActive ? 'block-slot--active' : ''
              }`}
              onClick={() => (v ? clearSlot(i) : setActiveSlot(i))}
              disabled={disabled}
              aria-label={`Emplacement ${i + 1}${v ? `, contient ${v}` : ', vide'}`}
            >
              {v || <span className="block-slot__hint">…</span>}
            </button>
          );
        })}
      </div>

      <div className="fill-blank-pool" role="group" aria-label="Mots disponibles">
        {tokens.map((t) => {
          const used = usedSet.has(t);
          return (
            <button
              key={t}
              type="button"
              className={`block-token ${used ? 'block-token--used' : ''}`}
              onClick={() => placeToken(t)}
              disabled={disabled || used}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ==========================================================================
   MatchPairs — associer par clic, paires résolues restent visibles
   ========================================================================== */

function MatchPairsPlayer({
  exercise,
  answer,
  disabled,
  onAnswer,
}: {
  exercise: Exercise;
  answer: Answer;
  disabled: boolean;
  onAnswer: (next: string[]) => void;
}) {
  const pairs = exercise.payload.pairs ?? [];

  const shuffledRight = useMemo(() => {
    return pairs
      .map((p, i) => ({ p, i, k: hashStr(exercise.id + ':' + p.right + ':' + i) }))
      .sort((a, b) => a.k - b.k);
  }, [pairs, exercise.id]);

  const matched = useMemo(() => {
    const m = new Map<number, number>();
    (answer as string[]).forEach((v, leftIdx) => {
      if (v) {
        const rightIdx = Number(v);
        if (!Number.isNaN(rightIdx)) m.set(leftIdx, rightIdx);
      }
    });
    return m;
  }, [answer]);

  const matchedRightSet = useMemo(() => new Set(Array.from(matched.values())), [matched]);

  const [activeLeft, setActiveLeft] = useState<number | null>(null);
  const [shakeRight, setShakeRight] = useState<number | null>(null);
  const [flashLeft, setFlashLeft] = useState<number | null>(null);

  const tryMatch = (rightIdx: number) => {
    if (disabled || activeLeft === null || matchedRightSet.has(rightIdx)) return;
    if (rightIdx === activeLeft) {
      const next = [...(answer as string[])];
      while (next.length < pairs.length) next.push('');
      next[activeLeft] = String(rightIdx);
      onAnswer(next);
      setFlashLeft(activeLeft);
      window.setTimeout(() => setFlashLeft(null), 320);
      setActiveLeft(null);
    } else {
      setShakeRight(rightIdx);
      window.setTimeout(() => setShakeRight(null), 380);
    }
  };

  return (
    <div className="match-pairs">
      <div className="match-column match-column--left">
        {pairs.map((p, i) => {
          const isMatched = matched.has(i);
          const isActive = activeLeft === i;
          const isFlash = flashLeft === i;
          return (
            <button
              key={p.left}
              type="button"
              className={`match-block ${isMatched ? 'match-block--success' : ''} ${
                isActive ? 'match-block--active' : ''
              } ${isFlash ? 'match-block--flash' : ''}`}
              disabled={disabled || isMatched}
              onClick={() => setActiveLeft(i)}
            >
              <span className="match-block__text">{p.left}</span>
              {isMatched && <span className="match-block__check">✓</span>}
            </button>
          );
        })}
      </div>

      <div className="match-column match-column--right">
        {shuffledRight.map(({ p, i }) => {
          const isMatched = matchedRightSet.has(i);
          const isShaking = shakeRight === i;
          return (
            <button
              key={p.right}
              type="button"
              className={`match-block ${isMatched ? 'match-block--success' : ''} ${
                isShaking ? 'match-block--error' : ''
              }`}
              disabled={disabled || isMatched || activeLeft === null}
              onClick={() => tryMatch(i)}
            >
              <span className="match-block__text">{p.right}</span>
              {isMatched && <span className="match-block__check">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ==========================================================================
   OrderSteps — drag & drop HTML5
   ========================================================================== */

function OrderStepsPlayer({
  exercise,
  answer,
  disabled,
  onAnswer,
}: {
  exercise: Exercise;
  answer: Answer;
  disabled: boolean;
  onAnswer: (next: number[]) => void;
}) {
  const steps = exercise.payload.steps ?? [];
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...(answer as number[])];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onAnswer(next);
  };

  return (
    <div className="order-steps">
      {(answer as number[]).map((item, i) => {
        const isDragging = dragIdx === i;
        const isOver = overIdx === i && dragIdx !== null && dragIdx !== i;
        return (
          <div
            key={item}
            className={`order-item ${isDragging ? 'order-item--dragging' : ''} ${
              isOver ? 'order-item--over' : ''
            }`}
            draggable={!disabled}
            onDragStart={(e) => {
              if (disabled) return;
              e.dataTransfer.effectAllowed = 'move';
              setDragIdx(i);
            }}
            onDragOver={(e) => {
              if (disabled) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setOverIdx(i);
            }}
            onDragLeave={() => setOverIdx(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIdx !== null) reorder(dragIdx, i);
              setDragIdx(null);
              setOverIdx(null);
            }}
            onDragEnd={() => {
              setDragIdx(null);
              setOverIdx(null);
            }}
          >
            <span className="order-item__handle" aria-hidden="true">
              <GripVertical className="w-4 h-4" />
            </span>
            <span className="order-item__text">{steps[item]}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   LessonPlayer
   ========================================================================== */

export function LessonPlayer({
  lesson,
  avatar,
  onClose,
  onComplete,
}: {
  lesson: Lesson;
  avatar: string;
  onClose: () => void;
  onComplete: (lesson: Lesson, xp: number) => void;
}) {
  const steps = useMemo(() => buildSteps(lesson), [lesson]);
  const [index, setIndex] = useState(0);
  const [evalIndex, setEvalIndex] = useState(0);
  const [quizExercises, setQuizExercises] = useState<Exercise[]>([]);
  const [quizBuilt, setQuizBuilt] = useState(false);
  const [answer, setAnswer] = useState<Answer>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'review' | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showErrorPanel, setShowErrorPanel] = useState(false);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [earned, setEarned] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [missionDeferred, setMissionDeferred] = useState(false);
  const lastCheckedRef = useRef<string>('');

  const isEvaluation = index >= steps.length;
  const step: Step | undefined = !isEvaluation ? steps[index] : undefined;

  const exercise: Exercise | undefined = useMemo(() => {
    if (step?.kind === 'exercise') return step.exercise;
    if (isEvaluation) {
      const raw = quizExercises[evalIndex];
      if (!raw) return undefined;
      // Reformulation : on change la position des bonnes réponses
      return reformulateMcq(raw, hashStr(raw.id + ':' + evalIndex));
    }
    return undefined;
  }, [step, isEvaluation, quizExercises, evalIndex]);

  const cover = lesson.blocks.find((b) => b.type === 'cover');
  const exhausted = failCount >= MAX_FAILS_BEFORE_EXPLAIN;

  /* --- Construit le quiz quand on atteint la fin du contenu --- */
  useEffect(() => {
    if (isEvaluation && !quizBuilt) {
      const allEx = lesson.blocks.flatMap((b) => b.exercises ?? []);
      const wrong = allEx.filter((e) => wrongIds.includes(e.id));
      const others = allEx.filter((e) => !wrongIds.includes(e.id));
      const picked = [...wrong, ...others].slice(0, Math.min(MAX_EVAL_QUESTIONS, allEx.length));
      setQuizExercises(picked);
      setQuizBuilt(true);
    }
  }, [isEvaluation, quizBuilt, wrongIds, lesson]);

  /* --- Escape ferme --- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* --- Reset à chaque nouveau step / sous-step --- */
  useEffect(() => {
    setAnswer([]);
    setFeedback(null);
    setFailCount(0);
    setShowHint(false);
    setShowErrorPanel(false);
    lastCheckedRef.current = '';
    if (exercise?.kind === 'order_steps') {
      setAnswer((exercise.payload.steps ?? []).map((_, i) => i).reverse());
    }
  }, [index, evalIndex, exercise]);

  useEffect(() => {
    if (exhausted) setShowErrorPanel(true);
  }, [exhausted]);

  const ready = useMemo(() => {
    if (!exercise) return true;
    if (exercise.kind === 'fill_blank') {
      return (exercise.payload.blanks ?? []).every(
        (_, i) => String(answer[i] ?? '').trim().length > 0,
      );
    }
    if (exercise.kind === 'match_pairs') {
      return (exercise.payload.pairs ?? []).every((_, i) => answer[i] === String(i));
    }
    if (exercise.kind === 'free_text') {
      const words = String(answer[0] ?? '')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      return words >= (exercise.payload.min_words ?? 1);
    }
    return answer.length > 0;
  }, [exercise, answer]);

  const skipCurrent = useCallback(() => {
    setFeedback(null);
    setFailCount(0);
    setShowErrorPanel(false);
    lastCheckedRef.current = '';
    if (isEvaluation && evalIndex + 1 < quizExercises.length) {
      setEvalIndex((n) => n + 1);
      return;
    }
    if (isEvaluation) {
      // Fin du quiz → on passe à l'écran de fin
      setIndex(steps.length + 1);
      setEvalIndex(0);
      return;
    }
    setIndex((n) => n + 1);
    setEvalIndex(0);
  }, [isEvaluation, evalIndex, quizExercises.length, steps.length]);

  const goNext = useCallback(() => {
    if (!step && !isEvaluation) return;

    // Fin de leçon
    if (index > steps.length) {
      onComplete(lesson, earned);
      return;
    }

    if (exercise && feedback !== 'correct' && feedback !== 'review') {
      const correct = checkAnswer(exercise, answer);
      if (correct === true) {
        setFeedback('correct');
        setEarned((n) => n + (exercise.xp ?? 0));
        setFailCount(0);
      } else if (correct === false) {
        const key = JSON.stringify(answer);
        if (key !== lastCheckedRef.current) {
          setFailCount((n) => n + 1);
          setMistakes((n) => n + 1);
          setWrongIds((prev) => (prev.includes(exercise.id) ? prev : [...prev, exercise.id]));
          if (isEvaluation) setHearts((h) => Math.max(0, h - 1));
          lastCheckedRef.current = key;
        }
        setFeedback('incorrect');
      } else {
        setFeedback('review');
      }
      return;
    }

    if (step?.kind === 'mission') setMissionDeferred(true);

    if (isEvaluation && evalIndex + 1 < quizExercises.length) {
      setEvalIndex((n) => n + 1);
      return;
    }

    if (isEvaluation) {
      // Fin du quiz → écran de fin
      setIndex(steps.length + 1);
      setEvalIndex(0);
      return;
    }

    setIndex((n) => n + 1);
    setEvalIndex(0);
  }, [
    step,
    exercise,
    feedback,
    answer,
    isEvaluation,
    evalIndex,
    quizExercises.length,
    steps.length,
    index,
    earned,
    lesson,
    onComplete,
  ]);

  const goPrev = useCallback(() => {
    if (isEvaluation && evalIndex > 0) {
      setEvalIndex((n) => n - 1);
      return;
    }
    if (isEvaluation) {
      setIndex(steps.length - 1);
      setEvalIndex(0);
      return;
    }
    if (index > 0) {
      setIndex((n) => n - 1);
      setEvalIndex(0);
    }
  }, [index, isEvaluation, evalIndex, steps.length]);

  const canGoPrev = index > 0 || (isEvaluation && evalIndex > 0);

  /* --- Raccourcis clavier --- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      if (e.key === 'Enter' && exercise && (ready || feedback) && !exhausted) {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exercise, ready, feedback, goNext, exhausted]);

  const isDone = index > steps.length;

  const progressPct = isDone
    ? 10
    : isEvaluation
      ? Math.round(((steps.length + evalIndex) / (steps.length + quizExercises.length || 1)) * 10)
      : Math.round((index / Math.max(1, steps.length + MAX_EVAL_QUESTIONS)) * 10);

  const content = (
    <div
      className="academy lesson-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={lesson.title}
    >
      <header className="lesson-header">
        <Button variant="academyNav" aria-label="Quitter la leçon" onClick={onClose}>
          <X />
        </Button>
        <div className="progress-track">
          <div className={`progress-fill lesson-progress-${progressPct}`} />
        </div>
        {isEvaluation && (
          <div className="lesson-hearts" aria-label={`${hearts} vies restantes`}>
            {Array.from({ length: MAX_HEARTS }).map((_, i) => (
              <Heart
                key={i}
                className={i < hearts ? 'heart-full' : 'heart-empty'}
                fill={i < hearts ? 'currentColor' : 'none'}
              />
            ))}
          </div>
        )}
      </header>

      <p className="lesson-title">
        {lesson.subtitle || 'Leçon'} · {lesson.title}
        {isEvaluation && <span className="lesson-eval-label"> · Quiz final</span>}
      </p>

      <main
        className={`lesson-body ${exercise ? 'lesson-body--centered' : ''} ${
          feedback === 'incorrect'
            ? 'animate-error'
            : feedback === 'correct'
              ? 'animate-success'
              : ''
        }`}
      >
        {step?.kind === 'cover' && (
          <>
            <div className="mascot-dialogue">
              <Avatar kind={avatar} />
              <div className="speech-bubble">{cover?.mascot_line}</div>
            </div>
            <h2>{lesson.title}</h2>
            <h3>Dans cette leçon</h3>
            <ul className="objectives">
              {cover?.objectives?.map((o) => (
                <li key={o}>
                  <CheckCircle2 />
                  {o}
                </li>
              ))}
            </ul>
            <p className="step-count mt-7">
              {lesson.duration_min} min · {lesson.xp_total} XP disponibles
            </p>
          </>
        )}

        {step?.kind === 'slide' && (
          <>
            <h2>{step.slide.title}</h2>
            <Copy text={step.slide.body_md} />
            {step.slide.callout && (
              <div className="lesson-callout">
                <strong>{step.slide.callout.title ?? 'À retenir'}</strong>
                {step.slide.callout.text}
              </div>
            )}
            {step.slide.quote && (
              <blockquote className="lesson-callout">
                « {step.slide.quote.text} »
                <br />
                <small>{step.slide.quote.author}</small>
              </blockquote>
            )}
          </>
        )}

        {exercise && (
          <div className="lesson-exercise">
            <div className="mascot-dialogue">
              <Avatar kind={avatar} />
              <div className="speech-bubble">
                {exhausted
                  ? 'Pas de souci, on regarde ensemble.'
                  : isEvaluation
                    ? 'Quiz final. Montre ce que tu as appris.'
                    : exercise.kind === 'multi_select'
                      ? 'À toi de jouer. Plusieurs réponses sont possibles.'
                      : 'À toi de jouer.'}
              </div>
            </div>
            <h2>{exercise.prompt}</h2>

            {(exercise.kind === 'mcq' || exercise.kind === 'multi_select') &&
              exercise.payload.options?.map((option, i) => (
                <Button
                  key={option}
                  variant="academyAnswer"
                  data-selected={(answer as number[]).includes(i)}
                  aria-pressed={(answer as number[]).includes(i)}
                  onClick={() => {
                    setAnswer((prev) => {
                      const arr = [...(prev as number[])];
                      if (exercise.kind === 'mcq') return [i];
                      return arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i];
                    });
                    if (feedback === 'incorrect') setFeedback(null);
                  }}
                  disabled={feedback === 'correct' || exhausted}
                >
                  <span className="answer-letter">
                    {exercise.kind === 'multi_select' && (answer as number[]).includes(i) ? (
                      <Check />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  {option}
                </Button>
              ))}

            {exercise.kind === 'fill_blank' && (
              <FillBlankPlayer
                exercise={exercise}
                answer={answer}
                disabled={feedback === 'correct' || exhausted}
                onAnswer={(next) => {
                  setAnswer(next);
                  if (feedback === 'incorrect') setFeedback(null);
                }}
              />
            )}

            {exercise.kind === 'match_pairs' && (
              <MatchPairsPlayer
                exercise={exercise}
                answer={answer}
                disabled={feedback === 'correct' || exhausted}
                onAnswer={(next) => {
                  setAnswer(next);
                  if (feedback === 'incorrect') setFeedback(null);
                }}
              />
            )}

            {exercise.kind === 'order_steps' && (
              <OrderStepsPlayer
                exercise={exercise}
                answer={answer}
                disabled={feedback === 'correct' || exhausted}
                onAnswer={(next) => {
                  setAnswer(next);
                  if (feedback === 'incorrect') setFeedback(null);
                }}
              />
            )}

            {exercise.kind === 'free_text' && (
              <>
                <textarea
                  className="academy-input"
                  rows={6}
                  aria-label="Votre réponse"
                  placeholder="Votre réponse"
                  value={String(answer[0] ?? '')}
                  disabled={feedback === 'correct' || exhausted}
                  onChange={(e) => {
                    setAnswer([e.target.value]);
                    if (feedback === 'incorrect') setFeedback(null);
                  }}
                />
                <p className="step-count">
                  {exercise.payload.min_words} à {exercise.payload.max_words} mots
                </p>
                {feedback === 'review' && (
                  <div className="lesson-callout">
                    <strong>Critères d’auto-évaluation</strong>
                    <Copy text={exercise.payload.rubric_md ?? ''} />
                  </div>
                )}
              </>
            )}

            {!isEvaluation && exercise.kind !== 'free_text' && !exhausted && (
              <div className="lesson-hint">
                <button
                  type="button"
                  className="lesson-hint-toggle"
                  onClick={() => setShowHint((v) => !v)}
                  aria-expanded={showHint}
                >
                  <Lightbulb className="w-4 h-4" />
                  {showHint ? 'Masquer l’indice' : 'Voir un indice'}
                </button>
                {showHint && <div className="lesson-hint-body">{getHint(exercise)}</div>}
              </div>
            )}

            {exhausted && (
              <div className="lesson-error-panel">
                <button
                  type="button"
                  className="lesson-error-toggle"
                  onClick={() => setShowErrorPanel((v) => !v)}
                  aria-expanded={showErrorPanel}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Comprendre l’erreur</span>
                  <ChevronDown className={`lesson-error-chevron ${showErrorPanel ? 'is-open' : ''}`} />
                </button>
                {showErrorPanel && (
                  <div className="lesson-error-body">
                    <Copy text={exercise.explanation_md} />
                    <Button variant="academy" onClick={skipCurrent}>
                      Question suivante
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step?.kind === 'mission' && (
          <>
            <div className="mascot-dialogue">
              <Avatar kind={avatar} />
              <div className="speech-bubble">Place à la pratique sur le terrain.</div>
            </div>
            <h2>{step.title}</h2>
            <Copy text={step.text} />
            <div className="lesson-callout">
              <strong>Mission à réaliser dans Lead Cortex</strong>
              La validation de cette mission nécessite votre application connectée. Elle reste en
              attente dans cet aperçu.
            </div>
          </>
        )}

        {isDone && (
          <div className="celebration animate-success">
            <Avatar kind={avatar} />
            <h2>Bien joué, tu avances</h2>
            <p className="step-count">
              {mistakes === 0
                ? 'Sans faute. Impressionnant.'
                : mistakes === 1
                  ? 'Une petite erreur, vite corrigée.'
                  : `${mistakes} erreurs. La leçon est bien ancrée.`}
            </p>
            <div className="result-stats">
              <div className="result-stat">
                <small>XP gagnés</small>
                <strong>{earned}</strong>
              </div>
              <div className="result-stat">
                <small>Erreurs</small>
                <strong>{mistakes}</strong>
              </div>
            </div>
            {missionDeferred && (
              <p className="step-count">Mission terrain en attente de validation.</p>
            )}
          </div>
        )}
      </main>

      <footer className="lesson-footer" data-feedback={feedback}>
        <div className="lesson-footer-inner">
          <button
            type="button"
            className="lesson-nav-arrow"
            onClick={goPrev}
            disabled={!canGoPrev}
            aria-label="Étape précédente"
          >
            <ChevronLeft />
          </button>

          {feedback ? (
            <div className="feedback-message">
              {feedback === 'incorrect' ? <XCircle /> : <CheckCircle2 />}
              <div>
                <strong>
                  {feedback === 'correct'
                    ? 'Exactement.'
                    : feedback === 'incorrect'
                      ? exhausted
                        ? 'On passe à la suite.'
                        : 'Pas tout à fait. Corrige ta réponse.'
                      : 'Compare ta réponse aux critères.'}
                </strong>
                {feedback !== 'incorrect' && exercise && <Copy text={exercise.explanation_md} />}
              </div>
            </div>
          ) : (
            <span className="step-count">
              {isDone
                ? 'Chaque petit pas compte.'
                : isEvaluation
                  ? `Quiz final · ${evalIndex + 1} sur ${quizExercises.length}`
                  : `Étape ${index + 1} sur ${steps.length}`}
            </span>
          )}

          <div className="lesson-footer-actions">
            <Button
              variant="academy"
              disabled={
                isDone
                  ? false
                  : exhausted
                    ? false
                    : feedback === 'correct'
                      ? false
                      : exercise
                        ? !ready
                        : false
              }
              onClick={goNext}
            >
              {isDone
                ? 'Revenir au parcours'
                : exhausted
                  ? 'Passer'
                  : feedback === 'correct'
                    ? 'Continuer'
                    : exercise
                      ? 'Vérifier'
                      : step?.kind === 'mission'
                        ? 'Garder pour plus tard'
                        : 'Continuer'}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );

  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
}