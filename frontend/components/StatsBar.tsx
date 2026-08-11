"use client";

import Link from "next/link";
import { useUser } from "./UserProvider";

export function StatsBar() {
  const { user, course } = useUser();
  if (!user) return <div className="h-14" />;

  const { stats } = user;
  const goalPercent = Math.min(
    100,
    Math.round((stats.xp_today / Math.max(stats.daily_goal_xp, 1)) * 100)
  );

  return (
    <div className="sticky top-0 z-20 flex items-center justify-end gap-4 bg-white/95 py-4 backdrop-blur dark:bg-[#131F24]/95 sm:gap-6">
      <Link
        href="/courses"
        className="mr-auto flex items-center gap-1 rounded-xl px-1 py-1 text-3xl hover:bg-[#F7F7F7] dark:hover:bg-[#223338]"
        title={course ? `Learning ${course.title} - tap to switch` : "Choose a language"}
      >
        {course?.flag_emoji ?? "🌐"}
      </Link>

      <Stat icon="🔥" value={stats.streak_count} label="day streak" tone="text-[#FF9600]" />
      <Stat icon="💎" value={stats.gems} label="gems" tone="text-[#1CB0F6]" />

      <Link href="/shop" className="flex items-center gap-1.5" title="Hearts">
        <span className="text-2xl" aria-hidden>{stats.hearts > 0 ? "❤️" : "🖤"}</span>
        <span className="text-lg font-extrabold text-[#FF4B4B]">{stats.hearts}</span>
      </Link>

      {/* Daily goal ring */}
      <div className="relative hidden h-9 w-9 shrink-0 sm:block" title={`${stats.xp_today} of ${stats.daily_goal_xp} XP today`}>
        <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#E5E5E5" strokeWidth="5" className="dark:stroke-[#2a3a40]" />
          <circle
            cx="18" cy="18" r="15" fill="none" stroke="#FFC800" strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${(goalPercent / 100) * 94.2} 94.2`}
            className="transition-[stroke-dasharray] duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-[#4B4B4B] dark:text-white">
          {goalPercent}%
        </span>
      </div>
    </div>
  );
}

function Stat({ icon, value, label, tone }: {
  icon: string; value: number; label: string; tone: string;
}) {
  return (
    <div className="flex items-center gap-1.5" title={label}>
      <span className="text-2xl" aria-hidden>{icon}</span>
      <span className={`text-lg font-extrabold ${tone}`}>{value}</span>
    </div>
  );
}
