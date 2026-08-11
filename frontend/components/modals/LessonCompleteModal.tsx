"use client";

import { Mascot } from "../Mascot";
import { Button } from "../ui/Button";
import { ProgressBar } from "../ui/ProgressBar";
import type { CompleteResult } from "@/lib/types";

export function LessonCompleteModal({
  summary,
  onClose,
}: {
  summary: CompleteResult;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a2a30]/95 p-4">
      <div className="w-full max-w-[560px] animate-pop-in text-center">
        <Mascot size={140} mood="celebrate" />
        <h2 className="mt-4 text-3xl font-extrabold text-sun">Lesson complete!</h2>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <Tile label="Total XP" value={`+${summary.xp_earned}`} tone="sun" />
          <Tile label="Accuracy" value={`${summary.accuracy}%`} tone="sky" />
          <Tile
            label="Day streak"
            value={String(summary.streak_count)}
            tone="ember"
          />
        </div>

        {summary.bonus_xp > 0 && (
          <p className="mt-4 text-[15px] font-extrabold text-leaf-dark">
            Perfect lesson — {summary.bonus_xp} bonus XP
          </p>
        )}

        {/* daily goal */}
        <div className="mt-8 text-left">
          <div className="mb-2 flex items-center justify-between text-[15px] font-extrabold text-stone">
            <span>Daily goal</span>
            <span>
              {summary.xp_today} / {summary.daily_goal_xp} XP
            </span>
          </div>
          <ProgressBar value={summary.xp_today} max={summary.daily_goal_xp} tone="gold" />
          {summary.daily_goal_met && (
            <p className="mt-2 text-[15px] font-extrabold text-leaf-dark">
              Daily goal reached. Your streak is safe.
            </p>
          )}
        </div>

        {summary.new_achievements.length > 0 && (
          <div className="mt-6 space-y-2">
            {summary.new_achievements.map((achievement) => (
              <div
                key={achievement.code}
                className="flex items-center gap-3 rounded-2xl border-2 border-b-4 border-sun bg-sun/10 px-4 py-3 text-left"
              >
                <span className="text-3xl" aria-hidden>{achievement.icon}</span>
                <div>
                  <p className="font-extrabold">{achievement.title}</p>
                  <p className="text-sm font-bold text-stone">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button onClick={onClose} className="mt-8 w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone: string }) {
  const border =
    tone === "sun" ? "border-sun" : tone === "sky" ? "border-sky" : "border-ember";
  const text =
    tone === "sun" ? "text-sun-dark" : tone === "sky" ? "text-sky" : "text-ember";
  return (
    <div className={`overflow-hidden rounded-2xl border-2 ${border}`}>
      <p className={`py-1 text-[13px] font-extrabold uppercase tracking-wide text-white ${
        tone === "sun" ? "bg-sun" : tone === "sky" ? "bg-sky" : "bg-ember"
      }`}>
        {label}
      </p>
      <p className={`bg-[#1a2a30] py-3 text-2xl font-extrabold ${text}`}>{value}</p>
    </div>
  );
}
