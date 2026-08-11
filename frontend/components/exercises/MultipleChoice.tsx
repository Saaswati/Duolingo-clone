"use client";

import { clsx } from "@/lib/clsx";
import { speak } from "@/lib/audio";
import type { ChoiceOption, Exercise } from "@/lib/types";

export function MultipleChoice({
  exercise,
  value,
  onChange,
  locked,
  speechLang,
}: {
  exercise: Exercise;
  value: unknown;
  onChange: (value: unknown) => void;
  locked: boolean;
  speechLang?: string;
}) {
  const options = (exercise.payload.options ?? []) as ChoiceOption[];
  const selected = (value as { option_id?: string })?.option_id;

  return (
    <div>
      <button
        onClick={() => exercise.payload.audio_text && speak(exercise.payload.audio_text, speechLang)}
        className="mb-8 flex items-center gap-3 rounded-2xl border-2 border-b-4 border-cloud px-5 py-4 text-2xl font-extrabold hover:bg-snow"
      >
        <span className="text-sky" aria-hidden>🔊</span>
        {exercise.payload.question}
      </button>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.id}
            disabled={locked}
            onClick={() => onChange({ option_id: option.id })}
            className={clsx(
              "flex flex-col items-center gap-3 rounded-2xl border-2 border-b-4 p-4 transition-colors",
              selected === option.id
                ? "border-sky bg-sky/10 text-sky"
                : "border-cloud hover:bg-snow"
            )}
          >
            <span className="text-5xl" aria-hidden>{option.emoji ?? "❓"}</span>
            <span className="text-[15px] font-bold">{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
