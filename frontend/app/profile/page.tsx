"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Profile } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { EditProfileModal } from "@/components/modals/EditProfileModal";
import { useUser } from "@/components/UserProvider";
import { clsx } from "@/lib/clsx";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const { user: currentUser, course } = useUser();

  useEffect(() => {
    api.profile().then(setProfile).catch(() => setProfile(null));
  }, [currentUser?.display_name, currentUser?.avatar_emoji]);

  if (!profile) {
    return (
      <AppShell>
        <p className="py-24 text-center font-bold text-[#777] dark:text-[#8a9aa0]">Loading profile…</p>
      </AppShell>
    );
  }

  const { user, achievements, recent_days } = profile;
  const maxDayXp = Math.max(...recent_days.map((d) => d.xp_earned), 1);

  return (
    <AppShell>
      <div className="space-y-6 py-6">
        {/* Hero card */}
        <header className="overflow-hidden rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white dark:border-[#2a3a40] dark:bg-[#1a2a30]">
          <div className="bg-gradient-to-r from-[#58CC02] to-[#89E219] px-6 py-6">
            <div className="flex flex-wrap items-center gap-5">
              <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/30 bg-white/20 text-4xl shadow-lg">
                {user.avatar_emoji}
              </span>
              <div className="min-w-0 flex-1 text-[#4B4B4B] dark:text-white">
                <h1 className="text-2xl font-extrabold">{user.display_name}</h1>
                <p className="font-bold opacity-80">@{user.username}</p>
              </div>
              <Button variant="ghost" onClick={() => setEditing(true)} className="border-white/30 bg-white/20 text-[#4B4B4B] dark:text-white hover:bg-white/30">
                Edit
              </Button>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-4 divide-x divide-[#E5E5E5] dark:divide-[#2a3a40]">
            <QuickStat icon="🔥" value={user.stats.streak_count} label="Streak" />
            <QuickStat icon="⚡" value={user.stats.total_xp} label="XP" />
            <QuickStat icon="👑" value={profile.crowns} label="Crowns" />
            <QuickStat icon="📘" value={profile.lessons_completed} label="Lessons" />
          </div>
        </header>

        {/* Course progress */}
        {course && (
          <section className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white p-5 dark:border-[#444] dark:bg-[#2a2a2a]">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{course.flag_emoji}</span>
              <div className="flex-1">
                <p className="font-extrabold text-[#4B4B4B] dark:text-white">{course.title}</p>
                <p className="text-sm font-bold text-[#777] dark:text-[#8a9aa0]">
                  {profile.crowns} of {course.units.reduce((a, u) => a + u.skills.length, 0)} skills completed
                </p>
              </div>
            </div>
            <ProgressBar
              value={profile.crowns}
              max={course.units.reduce((a, u) => a + u.skills.length, 0)}
              className="mt-3 h-3"
            />
          </section>
        )}

        {/* Weekly XP chart */}
        <section className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white p-5 dark:border-[#444] dark:bg-[#2a2a2a]">
          <h2 className="mb-4 text-lg font-extrabold text-[#4B4B4B] dark:text-white">Last 7 days</h2>
          <div className="flex h-[140px] items-end justify-between gap-2">
            {recent_days.map((day) => {
              const height = day.xp_earned > 0 ? Math.max(12, (day.xp_earned / maxDayXp) * 100) : 4;
              return (
                <div key={day.activity_date} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[11px] font-bold text-[#777] dark:text-[#8a9aa0]">
                    {day.xp_earned > 0 ? day.xp_earned : ""}
                  </span>
                  <div className="flex h-[90px] w-full items-end">
                    <div
                      className={clsx(
                        "w-full rounded-t-lg transition-[height] duration-700",
                        day.xp_earned > 0 ? "bg-[#FFC800]" : "bg-[#E5E5E5] dark:bg-[#444]"
                      )}
                      style={{ height: `${height}%` }}
                      title={`${day.xp_earned} XP`}
                    />
                  </div>
                  <span className="text-[11px] font-extrabold text-[#AFAFAF] dark:text-[#777]">
                    {new Date(day.activity_date).toLocaleDateString("en", { weekday: "narrow" })}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Achievements */}
        <section className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white p-5 dark:border-[#444] dark:bg-[#2a2a2a]">
          <h2 className="mb-4 text-lg font-extrabold text-[#4B4B4B] dark:text-white">Achievements</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {achievements.map((a) => (
              <div
                key={a.code}
                className={clsx(
                  "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all",
                  a.unlocked
                    ? "border-[#FFC800] bg-[#FFC800]/10"
                    : "border-[#E5E5E5] opacity-50 dark:border-[#2a3a40] grayscale"
                )}
              >
                <span className="text-3xl">{a.icon}</span>
                <p className="text-[12px] font-extrabold text-[#4B4B4B] dark:text-white">{a.title}</p>
                {!a.unlocked && (
                  <div className="w-full">
                    <ProgressBar value={a.progress} max={a.threshold} tone="gold" className="h-2" />
                    <p className="mt-1 text-[10px] font-bold text-[#AFAFAF]">
                      {a.progress}/{a.threshold}
                    </p>
                  </div>
                )}
                {a.unlocked && (
                  <span className="text-[10px] font-extrabold text-[#FFC800]">UNLOCKED</span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {editing && <EditProfileModal onClose={() => setEditing(false)} />}
    </AppShell>
  );
}

function QuickStat({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-4">
      <span className="text-xl">{icon}</span>
      <span className="text-xl font-extrabold text-[#4B4B4B] dark:text-white">{value}</span>
      <span className="text-[11px] font-bold text-[#AFAFAF]">{label}</span>
    </div>
  );
}
