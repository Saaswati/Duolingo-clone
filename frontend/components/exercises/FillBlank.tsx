"use client";

import { clsx } from "@/lib/clsx";
import type { Exercise } from "@/lib/types";

export function FillBlank({
  exercise,
  value,
  onChange,
  locked,
}: {
  exercise: Exercise;
  value: unknown;
  onChange: (value: unknown) => void;
  locked: boolean;
}) {
  const options = (exercise.payload.options ?? []) as string[];
  const chosen = (value as { choice?: string })?.choice;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-2 text-2xl font-extrabold">
        <span>{exercise.payload.sentence_before}</span>
        <span
          className={clsx(
            "min-w-[120px] border-b-2 px-3 pb-1 text-center",
            chosen ? "border-sky text-sky" : "border-mist text-mist"
          )}
        >
          {chosen ?? "\u00A0"}
        </span>
        <span>{exercise.payload.sentence_after}</span>
      </div>

      {exercise.payload.translation_hint && (
        <p className="mb-6 text-[15px] font-bold text-stone">
          {exercise.payload.translation_hint}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <button
            key={option}
            disabled={locked}
            onClick={() => onChange({ choice: option })}
            className={clsx(
              "rounded-2xl border-2 border-b-4 px-6 py-4 text-lg font-bold transition-colors",
              chosen === option
                ? "border-sky bg-sky/10 text-sky"
                : "border-cloud hover:bg-snow"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
