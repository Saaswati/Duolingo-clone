"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { AttemptStart } from "@/lib/types";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { OutOfHeartsModal } from "@/components/modals/OutOfHeartsModal";
import { Mascot } from "@/components/Mascot";

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptStart | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .startLesson(Number(params.lessonId))
      .then((data) => !cancelled && setAttempt(data))
      .catch((error) => {
        if (cancelled) return;
        // 402 is the server saying "no hearts" - the one error with its own
        // screen, because it is a game state rather than a fault.
        if (error instanceof ApiError && error.status === 402) setBlocked(true);
        else setFailed(error instanceof ApiError ? error.message : "Something went wrong.");
      });
    return () => {
      cancelled = true;
    };
  }, [params.lessonId]);

  if (blocked) {
    return (
      <OutOfHeartsModal onRefilled={() => location.reload()} onQuit={() => router.push("/")} />
    );
  }

  if (failed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Mascot size={100} mood="sad" />
        <h1 className="text-2xl font-extrabold">This lesson didn&apos;t open</h1>
        <p className="font-bold text-stone">{failed}</p>
        <button
          onClick={() => router.push("/")}
          className="btn-3d border-cloud bg-white text-stone"
        >
          Back to the path
        </button>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Mascot size={90} mood="celebrate" />
      </div>
    );
  }

  return <LessonPlayer attempt={attempt} />;
}
