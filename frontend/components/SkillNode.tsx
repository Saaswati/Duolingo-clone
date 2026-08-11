"use client";

import { useRouter } from "next/navigation";
import { clsx } from "@/lib/clsx";
import type { Skill } from "@/lib/types";

const UNIT_COLORS: Record<string, { ring: string; bg: string; border: string }> = {
  green:  { ring: "#58CC02", bg: "bg-[#58CC02]", border: "border-[#58A700]" },
  blue:   { ring: "#1CB0F6", bg: "bg-[#1CB0F6]", border: "border-[#1899D6]" },
  purple: { ring: "#CE82FF", bg: "bg-[#CE82FF]", border: "border-[#A568CC]" },
};

export function SkillNode({
  skill,
  color,
  offset,
  onLocked,
}: {
  skill: Skill;
  color: string;
  offset: number;
  onLocked: () => void;
}) {
  const router = useRouter();
  const theme = UNIT_COLORS[color] ?? UNIT_COLORS.green;

  const locked = skill.state === "locked";
  const completed = skill.state === "completed";
  const isCurrent = skill.state === "available" || skill.state === "in_progress";
  const fraction = skill.total_lessons > 0 ? skill.lessons_completed / skill.total_lessons : 0;

  const handleClick = () => {
    if (locked) {
      onLocked();
      return;
    }
    if (skill.next_lesson_id) {
      router.push(`/lesson/${skill.next_lesson_id}`);
    }
  };

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ transform: `translateX(${offset}px)` }}
    >
      <button
        onClick={handleClick}
        aria-label={`${skill.title}, ${skill.state.replace("_", " ")}`}
        className={clsx(
          "group relative transition-transform duration-150",
          !locked && "hover:scale-105 active:scale-95",
          locked && "cursor-not-allowed"
        )}
      >
        {/* Progress ring */}
        <svg viewBox="0 0 100 100" className="absolute -inset-2 h-[88px] w-[88px] -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" stroke={locked ? "#E5E5E5" : "#E5E5E520"} className="dark:stroke-[#3a3a3a]" strokeWidth="6" />
          {!locked && fraction > 0 && (
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke={theme.ring} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${fraction * 276} 276`}
              className="transition-[stroke-dasharray] duration-700"
            />
          )}
        </svg>

        {/* Node circle */}
        <span className={clsx(
          "relative flex h-[72px] w-[72px] items-center justify-center rounded-full text-3xl transition-all",
          locked
            ? "bg-[#E5E5E5] text-[#AFAFAF] dark:bg-[#3a3a3a] dark:text-[#AFAFAF] dark:text-[#666]"
            : completed
            ? `${theme.bg} text-white shadow-lg`
            : isCurrent
            ? `${theme.bg} text-white shadow-lg ring-4 ring-[#58CC02]/30`
            : `${theme.bg} text-white shadow-lg`
        )}>
          {locked ? "🔒" : completed ? "👑" : skill.icon}
        </span>
      </button>

      {/* Label */}
      <p className={clsx(
        "mt-2 max-w-[120px] text-center text-[12px] font-bold",
        locked ? "text-[#AFAFAF] dark:text-[#666]" : "text-[#4B4B4B] dark:text-[#b0b0b0]"
      )}>
        {skill.title}
      </p>

      {/* Inline START button for current skill */}
      {isCurrent && (
        <button
          onClick={handleClick}
          className="mt-1 rounded-xl bg-[#58CC02] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-md transition-all hover:brightness-110 active:scale-95"
        >
          {skill.lessons_completed > 0 ? "Continue" : "Start"}
        </button>
      )}
    </div>
  );
}
