"use client";

/**
 * The course picker.
 *
 * Switching languages does not reset anything: progress is stored per skill
 * and skills belong to a course, so a learner can keep several going at once
 * and come back to each one where they left it.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { CourseSummary } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";
import { useUser } from "@/components/UserProvider";
import { clsx } from "@/lib/clsx";

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [switching, setSwitching] = useState<number | null>(null);
  const { refresh } = useUser();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    api.courses().then(setCourses).catch(() => setCourses([]));
  }, []);

  const choose = async (course: CourseSummary) => {
    if (course.is_active) {
      router.push("/");
      return;
    }
    setSwitching(course.id);
    try {
      await api.selectCourse(course.id);
      await refresh();
      toast(`Now learning ${course.title}.`, "success");
      router.push("/");
    } catch {
      toast("Couldn't switch course. Try again.", "error");
      setSwitching(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 py-6">
        <header>
          <h1 className="text-3xl font-extrabold">Choose a language</h1>
          <p className="mt-1 font-bold text-stone">
            Your XP and streak follow you. Each course keeps its own path, so
            switching never loses progress.
          </p>
        </header>

        {courses === null ? (
          <p className="py-12 text-center font-bold text-stone">Loading courses…</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <li
                key={course.id}
                className={clsx(
                  "card-3d flex flex-col gap-3 p-5",
                  course.is_active && "border-leaf"
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="text-5xl" aria-hidden>{course.flag_emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-extrabold">{course.title}</p>
                    <p className="text-sm font-bold text-stone">
                      from {course.from_language}
                    </p>
                  </div>
                  {course.is_active && (
                    <span className="rounded-full bg-leaf px-3 py-1 text-xs font-extrabold uppercase text-white">
                      Learning
                    </span>
                  )}
                </div>

                <div>
                  <ProgressBar
                    value={course.skills_completed}
                    max={course.total_skills}
                    className="h-3"
                  />
                  <p className="mt-2 text-sm font-bold text-stone">
                    {course.skills_completed === 0
                      ? `${course.total_skills} skills to explore`
                      : `${course.skills_completed} of ${course.total_skills} skills finished`}
                  </p>
                </div>

                <Button
                  variant={course.is_active ? "ghost" : "green"}
                  disabled={switching === course.id}
                  onClick={() => choose(course)}
                >
                  {switching === course.id
                    ? "Switching…"
                    : course.is_active
                    ? "Continue"
                    : course.skills_completed > 0
                    ? "Resume"
                    : "Start learning"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
