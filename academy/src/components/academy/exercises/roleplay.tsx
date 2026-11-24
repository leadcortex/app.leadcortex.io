// academy/src/components/academy/exercises/roleplay.tsx

import { useMemo } from "react";
import { MessageCircle, User } from "../../../../../frontend/components/icons";

import type { Exercise, Answer } from "../../../lib/model";

export function RoleplayExercise({
  exercise,
  answer,
  disabled,
  onAnswer,
}: {
  exercise: Exercise;
  answer: Answer;
  disabled: boolean;
  onAnswer: (next: Answer) => void;
}) {
  const context = exercise.payload.context ?? "";
  const turns = exercise.payload.turns ?? [];

  const choices = useMemo<number[]>(() => {
    const arr = [...(answer as number[])];
    while (arr.length < turns.length) arr.push(-1);
    return arr;
  }, [answer, turns.length]);

  const pick = (turnIdx: number, choiceIdx: number) => {
    if (disabled) return;
    const next = [...choices];
    next[turnIdx] = choiceIdx;
    onAnswer(next);
  };

  return (
    <div className="roleplay">
      {context && (
        <div className="roleplay__context">
          <MessageCircle className="w-4 h-4" />
          <p>{context}</p>
        </div>
      )}

      <div className="roleplay__chat">
        {turns.map((turn, t) => {
          const selected = choices[t] ?? -1;
          const chosen = selected >= 0 ? turn.choices[selected] : null;
          return (
            <div key={t} className="roleplay__turn">
              <div className="roleplay__prospect">
                <div className="roleplay__bubble roleplay__bubble--prospect">
                  {turn.prospect}
                </div>
              </div>

              <div className="roleplay__choices">
                {turn.choices.map((choice, c) => {
                  const isSelected = selected === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`roleplay__choice ${isSelected ? "is-selected" : ""}`}
                      disabled={disabled}
                      onClick={() => pick(t, c)}
                    >
                      <span className="roleplay__choice-letter">
                        {String.fromCharCode(65 + c)}
                      </span>
                      <span className="roleplay__choice-text">{choice.text}</span>
                    </button>
                  );
                })}
              </div>

              {chosen && (
                <div className="roleplay__reply">
                  <User className="w-4 h-4" />
                  <div className="roleplay__bubble roleplay__bubble--you">
                    {chosen.reply}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
