"use client";

import { useEffect, useMemo, useState } from "react";
import { speak } from "@/lib/audio";
import type { Exercise } from "@/lib/types";

/**
 * Tap-the-words.
 *
 * Words are tracked by index rather than by their text, because a word bank
 * can legitimately contain the same word twice ("the man reads the book") and
 * tracking by string would make the two copies indistinguishable.
 */
export function Translate({
  exercise,
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
  const bank = useMemo(
    () => shuffle(exercise.payload.word_bank ?? [], exercise.id),
    [exercise.payload.word_bank, exercise.id]
  );
  const [picked, setPicked] = useState<number[]>([]);

  useEffect(() => setPicked([]), [exercise.id]);
  useEffect(
    () => onChange({ words: picked.map((i) => bank[i]) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [picked]
  );

  return (
    <div>
      <button
        onClick={() => exercise.payload.audio_text && speak(exercise.payload.audio_text, speechLang)}
        className="mb-8 flex items-center gap-3 text-2xl font-extrabold"
      >
        <span className="text-sky" aria-hidden>🔊</span>
        {exercise.payload.sentence}
      </button>

      {/* answer slots */}
      <div className="min-h-[64px] border-b-2 border-t-2 border-cloud py-3">
        <div className="flex flex-wrap gap-2">
          {picked.map((bankIndex, position) => (
            <button
              key={`${bankIndex}-${position}`}
              disabled={locked}
              onClick={() => setPicked((p) => p.filter((_, i) => i !== position))}
              className="rounded-xl border-2 border-b-4 border-cloud bg-white px-4 py-2 font-bold"
            >
              {bank[bankIndex]}
            </button>
          ))}
        </div>
      </div>

      {/* word bank */}
      <div className="mt-6 flex flex-wrap gap-2">
        {bank.map((word, index) => {
          const used = picked.includes(index);
          return (
            <button
              key={`${word}-${index}`}
              disabled={locked || used}
              onClick={() => setPicked((p) => [...p, index])}
              className={
                used
                  ? "rounded-xl border-2 border-b-4 border-cloud bg-cloud px-4 py-2 font-bold text-cloud"
                  : "rounded-xl border-2 border-b-4 border-cloud bg-white px-4 py-2 font-bold hover:bg-snow"
              }
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Deterministic shuffle so the bank does not reorder on every re-render. */
function shuffle(words: string[], seed: number): string[] {
  const output = [...words];
  let state = seed * 9301 + 49297;
  for (let i = output.length - 1; i > 0; i--) {
    state = (state * 9301 + 49297) % 233280;
    const j = state % (i + 1);
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}
