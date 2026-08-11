"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { LeaderboardEntry } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { clsx } from "@/lib/clsx";

const MEDALS = ["🥇", "🥈", "🥉"];
const AVATAR_COLORS = ["#58CC02", "#1CB0F6", "#FF9600", "#CE82FF", "#FF4B4B", "#FFC800"];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    api.leaderboard().then(setRows).catch(() => setRows([]));
  }, []);

  const total = rows.length;

  return (
    <AppShell>
      <div className="py-6">
        {/* League header */}
        <div className="mb-6 text-center">
          <span className="text-5xl">🏆</span>
          <h1 className="mt-2 text-2xl font-extrabold text-[#4B4B4B] dark:text-white">Gold League</h1>
          <p className="mt-1 text-sm font-bold text-[#777] dark:text-[#8a9aa0]">
            Top 3 advance to the next league · bottom 2 drop down
          </p>
          <p className="text-[12px] font-bold text-[#AFAFAF] dark:text-[#666]">Resets in 3 days</p>
        </div>

        {/* Rankings */}
        <div className="space-y-2">
          {rows.map((row, index) => {
            const isPromotion = index < 3;
            const isDemotion = index >= total - 2;
            const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

            return (
              <div key={row.user_id}>
                {/* Promotion zone divider — after top 3 */}
                {index === 3 && (
                  <div className="my-4 flex items-center gap-3 px-2">
                    <div className="h-px flex-1 bg-[#58CC02]/40" />
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#58CC02]">
                      Promotion Zone
                    </span>
                    <div className="h-px flex-1 bg-[#58CC02]/40" />
                  </div>
                )}

                {/* Relegation zone divider — before last 2 */}
                {index === total - 2 && (
                  <div className="my-4 flex items-center gap-3 px-2">
                    <div className="h-px flex-1 bg-[#FF4B4B]/40" />
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#FF4B4B]">
                      Relegation Zone
                    </span>
                    <div className="h-px flex-1 bg-[#FF4B4B]/40" />
                  </div>
                )}

                <div
                  className={clsx(
                    "flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all duration-200",
                    row.is_current_user
                      ? "border-2 border-[#FFC800]/60 bg-[#FFC800]/10"
                      : "border border-[#E5E5E5] dark:border-[#2a3a40] bg-[#F7F7F7] hover:bg-white dark:bg-[#1a2a30] dark:hover:bg-[#223338]"
                  )}
                >
                  {/* Rank */}
                  <span className="w-8 shrink-0 text-center text-lg font-extrabold text-[#777] dark:text-[#8a9aa0]">
                    {MEDALS[row.rank - 1] ?? row.rank}
                  </span>

                  {/* Avatar circle with initials */}
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-[#4B4B4B] dark:text-white"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {getInitials(row.display_name)}
                  </span>

                  {/* Name */}
                  <span className="flex-1 font-extrabold text-[#4B4B4B] dark:text-white">
                    {row.display_name}
                    {row.is_current_user && (
                      <span className="ml-2 text-[12px] font-bold text-[#777] dark:text-[#8a9aa0]">(you)</span>
                    )}
                  </span>

                  {/* XP */}
                  <div className="text-right">
                    <span className="font-extrabold text-[#4B4B4B] dark:text-white">{row.total_xp}</span>
                    <span className="ml-1 text-sm font-bold text-[#777] dark:text-[#8a9aa0]">XP</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
