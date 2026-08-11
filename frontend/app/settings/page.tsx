"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useUser } from "@/components/UserProvider";
import { getSimulatedDate, setSimulatedDate } from "@/lib/api";

export default function SettingsPage() {
  const { user, refresh } = useUser();
  const toast = useToast();
  const [simulated, setSimulated] = useState<string>("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setSimulated(getSimulatedDate() ?? "");
    setDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("duo:darkMode", next ? "true" : "false");
    toast(next ? "Dark mode enabled." : "Dark mode disabled.", "info");
  };

  const apply = async () => {
    setSimulatedDate(simulated || null);
    await refresh();
    toast(
      simulated ? `The app now believes it is ${simulated}.` : "Back to the real date.",
      "success"
    );
  };

  return (
    <AppShell>
      <div className="space-y-6 py-6">
        <h1 className="text-3xl font-extrabold dark:text-white">Settings</h1>

        {/* Dark mode */}
        <section className="card-3d p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold dark:text-white">Dark mode</h2>
              <p className="mt-1 text-sm font-bold text-[#777] dark:text-[#aaa]">
                Switch between light and dark themes.
              </p>
            </div>
            <button
              onClick={toggleDark}
              className={clsx(
                "relative h-8 w-14 rounded-full transition-colors",
                darkMode ? "bg-[#58CC02]" : "bg-[#E5E5E5]"
              )}
            >
              <span
                className={clsx(
                  "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform",
                  darkMode ? "translate-x-7" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </section>

        {/* Time travel */}
        <section className="card-3d p-5">
          <h2 className="text-lg font-extrabold dark:text-white">Time travel (for testing)</h2>
          <p className="mt-1 text-[15px] font-bold text-[#777] dark:text-[#aaa]">
            Streaks are day-based. Set a date here and the app sends it to the server as today.
            Finish a lesson, move the date forward, finish another — the streak grows.
            Skip two days and it resets to 1.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={simulated}
              onChange={(event) => setSimulated(event.target.value)}
              className="rounded-2xl border-2 border-[#2a3a40] px-4 py-3 font-bold focus:border-[#1CB0F6] bg-[#1a2a30] text-white"
            />
            <Button onClick={apply}>Apply</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSimulated("");
                setSimulatedDate(null);
                refresh();
                toast("Back to the real date.", "info");
              }}
            >
              Reset
            </Button>
          </div>
          {user?.stats.last_activity_date && (
            <p className="mt-3 text-sm font-bold text-[#AFAFAF]">
              Last activity: {user.stats.last_activity_date}. Streak: {user.stats.streak_count} days.
            </p>
          )}
        </section>

        <Placeholder title="Account" body="Profile editing, email and password." />
        <Placeholder title="Notifications" body="Practice reminders and streak alerts." />
        <Placeholder title="Sound effects" body="Toggle the answer tones and spoken prompts." />
        <Placeholder title="Speaking exercises" body="Pronunciation practice requires speech recognition." />
      </div>
    </AppShell>
  );
}

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <section className="flex items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-[#2a3a40] p-5 dark:border-[#444]">
      <div>
        <h2 className="font-extrabold text-[#777] dark:text-[#aaa]">{title}</h2>
        <p className="text-[15px] font-bold text-[#AFAFAF]">{body}</p>
      </div>
      <span className="shrink-0 rounded-full bg-[#E5E5E5] px-3 py-1 text-xs font-extrabold uppercase text-[#777] dark:bg-[#444]">
        Coming soon
      </span>
    </section>
  );
}

function clsx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
