"use client";

import { useEffect, useMemo, useState } from "react";
import { clsx } from "@/lib/clsx";
import { playTone } from "@/lib/audio";
import type { Exercise, MatchPair } from "@/lib/types";

/**
 * Tap the matching pairs.
 *
 * This exercise grades itself as you go - a wrong pair flashes red and clears
 * rather than costing a heart, which is how the original behaves. The server
 * still verifies the submitted pair ids on completion, so the leniency is a
 * UI choice rather than a hole.
 */
export function MatchPairs({
  exercise,
  onChange,
  onReady,
}: {
  exercise: Exercise;
  value: unknown;
  onChange: (value: unknown) => void;
  onReady?: (ready: boolean) => void;
  locked: boolean;
}) {
  const pairs = (exercise.payload.pairs ?? []) as MatchPair[];
  const sources = useMemo(() => pairs.map((p) => ({ id: p.id, text: p.source })), [pairs]);
  const targets = useMemo(
    () => [...pairs.map((p) => ({ id: p.id, text: p.target }))].reverse(),
    [pairs]
  );

  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);

  useEffect(() => {
    setMatched([]);
    setSelectedSource(null);
    setSelectedTarget(null);
  }, [exercise.id]);

  useEffect(() => {
    if (!selectedSource || !selectedTarget) return;
    if (selectedSource === selectedTarget) {
      setMatched((m) => [...m, selectedSource]);
      playTone("correct");
    } else {
      setWrong(selectedSource);
      playTone("incorrect");
      setTimeout(() => setWrong(null), 500);
    }
    setSelectedSource(null);
    setSelectedTarget(null);
  }, [selectedSource, selectedTarget]);

  useEffect(() => {
    onChange({ matched });
    onReady?.(matched.length === pairs.length && pairs.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched]);

  const tile = (
    item: { id: string; text: string },
    selected: string | null,
    select: (id: string) => void
  ) => {
    const done = matched.includes(item.id);
    return (
      <button
        key={item.id}
        disabled={done}
        onClick={() => select(item.id)}
        className={clsx(
          "rounded-2xl border-2 border-b-4 px-4 py-4 text-left font-bold transition-colors",
          done && "border-leaf-dark bg-correct-bg text-correct-text opacity-60",
          !done && selected === item.id && "border-sky bg-sky/10 text-sky",
          !done && selected !== item.id && "border-cloud hover:bg-snow",
          wrong === item.id && "animate-shake border-coral bg-incorrect-bg text-incorrect-text"
        )}
      >
        {item.text}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-3">
        {sources.map((s) => tile(s, selectedSource, setSelectedSource))}
      </div>
      <div className="flex flex-col gap-3">
        {targets.map((t) => tile(t, selectedTarget, setSelectedTarget))}
      </div>
    </div>
  );
}
