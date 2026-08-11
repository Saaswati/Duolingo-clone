"use client";

import { AppShell } from "@/components/AppShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useUser } from "@/components/UserProvider";

export default function QuestsPage() {
  const { user } = useUser();
  if (!user) return <AppShell><div /></AppShell>;

  const { stats } = user;
  const dailyPercent = Math.min(100, Math.round((stats.xp_today / Math.max(stats.daily_goal_xp, 1)) * 100));

  return (
    <AppShell>
      <div className="space-y-6 py-6">
        <h1 className="text-3xl font-extrabold text-[#4B4B4B] dark:text-white">Quests</h1>

        {/* Daily quest */}
        <section className="overflow-hidden rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white dark:border-[#2a3a40] dark:bg-[#1a2a30]">
          <div className="flex items-center gap-2 bg-[#FFC800] px-4 py-2">
            <span className="text-lg">⚡</span>
            <span className="text-sm font-extrabold uppercase tracking-wide text-[#4B4B4B] dark:text-white">Daily Quest</span>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-extrabold text-[#4B4B4B] dark:text-white">Earn {stats.daily_goal_xp} XP</p>
                <p className="text-sm font-bold text-[#777] dark:text-[#8a9aa0]">Complete lessons to earn XP</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl">🎁</span>
                <span className="text-[11px] font-bold text-[#FFC800]">+20 gems</span>
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar value={stats.xp_today} max={stats.daily_goal_xp} tone="gold" />
              <p className="mt-2 text-right text-sm font-extrabold text-[#777] dark:text-[#8a9aa0]">
                {stats.xp_today} / {stats.daily_goal_xp} XP
              </p>
            </div>
          </div>
        </section>

        {/* Weekly goal */}
        <section className="overflow-hidden rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white dark:border-[#2a3a40] dark:bg-[#1a2a30]">
          <div className="flex items-center gap-2 bg-[#CE82FF] px-4 py-2">
            <span className="text-lg">🎯</span>
            <span className="text-sm font-extrabold uppercase tracking-wide text-[#4B4B4B] dark:text-white">Weekly Goal</span>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-extrabold text-[#4B4B4B] dark:text-white">Complete 5 lessons</p>
                <p className="text-sm font-bold text-[#777] dark:text-[#8a9aa0]">Keep your momentum going</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl">💎</span>
                <span className="text-[11px] font-bold text-[#CE82FF]">+50 gems</span>
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar value={3} max={5} tone="blue" />
              <p className="mt-2 text-right text-sm font-extrabold text-[#777] dark:text-[#8a9aa0]">
                3 / 5 lessons
              </p>
            </div>
          </div>
        </section>

        {/* Streak quest */}
        <section className="overflow-hidden rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white dark:border-[#2a3a40] dark:bg-[#1a2a30]">
          <div className="flex items-center gap-2 bg-[#FF9600] px-4 py-2">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-extrabold uppercase tracking-wide text-[#4B4B4B] dark:text-white">Streak Challenge</span>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-extrabold text-[#4B4B4B] dark:text-white">Reach a 7-day streak</p>
                <p className="text-sm font-bold text-[#777] dark:text-[#8a9aa0]">Practice every day</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl">🏆</span>
                <span className="text-[11px] font-bold text-[#FF9600]">Badge</span>
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar value={stats.streak_count} max={7} />
              <p className="mt-2 text-right text-sm font-extrabold text-[#777] dark:text-[#8a9aa0]">
                {stats.streak_count} / 7 days
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
