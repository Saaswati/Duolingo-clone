"use client";

import { useEffect, useRef } from "react";
import { speak } from "@/lib/audio";
import type { Exercise } from "@/lib/types";

export function TypeAnswer({
  exercise,
  value,
  onChange,
  locked,
  onSubmit,
  speechLang,
}: {
  exercise: Exercise;
  value: unknown;
  onChange: (value: unknown) => void;
  locked: boolean;
  onSubmit?: () => void;
  speechLang?: string;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const text = (value as { text?: string })?.text ?? "";

  // Focus the field on arrival so a keyboard-first learner never has to reach
  // for the mouse between questions.
  useEffect(() => {
    inputRef.current?.focus();
  }, [exercise.id]);

  return (
    <div>
      <button
        onClick={() => exercise.payload.audio_text && speak(exercise.payload.audio_text, speechLang)}
        className="mb-6 flex items-center gap-3 text-2xl font-extrabold"
      >
        <span className="text-sky" aria-hidden>🔊</span>
        {exercise.payload.source_text}
      </button>

      <textarea
        ref={inputRef}
        disabled={locked}
        value={text}
        onChange={(event) => onChange({ text: event.target.value })}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit?.();
          }
        }}
        rows={3}
        placeholder={exercise.payload.placeholder ?? "Type in English"}
        className="w-full resize-none rounded-2xl border-2 border-cloud bg-snow p-4 text-lg font-bold placeholder:text-mist focus:border-sky focus:bg-white"
      />
    </div>
  );
}
