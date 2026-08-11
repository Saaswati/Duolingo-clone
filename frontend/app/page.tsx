"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PathView } from "@/components/PathView";
import { useUser } from "@/components/UserProvider";
import { Mascot } from "@/components/Mascot";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default function LearnPage() {
  const { course } = useUser();

  return (
    <AppShell aside={<RightRail />}>
      {course ? (
        <PathView course={course} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <Mascot size={80} />
          <p className="font-bold text-[#777]">Loading your path…</p>
        </div>
      )}
    </AppShell>
  );
}

function RightRail() {
  const { user } = useUser();
  if (!user) return null;
  const { stats } = user;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white p-4 dark:border-[#2a3a40] dark:bg-[#1a2a30]">
        <h2 className="mb-3 text-[15px] font-extrabold uppercase tracking-wide text-[#777] dark:text-[#8a9aa0]">
          Daily goal
        </h2>
        <ProgressBar value={stats.xp_today} max={stats.daily_goal_xp} tone="gold" />
        <p className="mt-2 text-[15px] font-bold text-[#777] dark:text-[#8a9aa0]">
          {stats.xp_today >= stats.daily_goal_xp
            ? "Goal reached today. Nicely done."
            : `${stats.daily_goal_xp - stats.xp_today} XP to go today.`}
        </p>
      </section>

      <section className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white p-4 dark:border-[#2a3a40] dark:bg-[#1a2a30]">
        <h2 className="mb-3 text-[15px] font-extrabold uppercase tracking-wide text-[#777] dark:text-[#8a9aa0]">
          Streak
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden>🔥</span>
          <div>
            <p className="text-2xl font-extrabold text-[#FF9600]">{stats.streak_count} days</p>
            <p className="text-sm font-bold text-[#777] dark:text-[#8a9aa0]">
              Longest: {stats.longest_streak} days
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white p-4 dark:border-[#2a3a40] dark:bg-[#1a2a30]">
        <h2 className="mb-2 text-[15px] font-extrabold uppercase tracking-wide text-[#777] dark:text-[#8a9aa0]">
          Leaderboard
        </h2>
        <p className="text-[15px] font-bold text-[#777] dark:text-[#8a9aa0]">
          You have {stats.total_xp} XP this week.
        </p>
        <Link
          href="/leaderboard"
          className="mt-3 inline-block text-[15px] font-extrabold uppercase tracking-wide text-[#1CB0F6]"
        >
          See standings
        </Link>
      </section>
    </div>
  );
}
