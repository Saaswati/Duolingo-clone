"use client";

/**
 * The lesson loop.
 *
 * This shell owns everything that is true of *every* exercise: the progress
 * bar, the hearts, submitting to the server, the feedback bar and what
 * happens when a lesson ends. Each exercise component below only knows how to
 * collect one answer and hand it back. That split is why adding a sixth
 * exercise type means writing one component and adding one line to the
 * registry - nothing in here changes.
 */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { playTone } from "@/lib/audio";
import type { AnswerResult, AttemptStart, CompleteResult, Exercise } from "@/lib/types";
import { useUser } from "../UserProvider";
import { ProgressBar } from "../ui/ProgressBar";
import { Button } from "../ui/Button";
import { FeedbackBar } from "./FeedbackBar";
import { LessonCompleteModal } from "../modals/LessonCompleteModal";
import { OutOfHeartsModal } from "../modals/OutOfHeartsModal";
import { QuitModal } from "../modals/QuitModal";
import { MultipleChoice } from "../exercises/MultipleChoice";
import { Translate } from "../exercises/Translate";
import { MatchPairs } from "../exercises/MatchPairs";
import { FillBlank } from "../exercises/FillBlank";
import { TypeAnswer } from "../exercises/TypeAnswer";

/** Exercise type -> component. The one place a new type is registered. */
const EXERCISES = {
  multiple_choice: MultipleChoice,
  translate: Translate,
  match_pairs: MatchPairs,
  fill_blank: FillBlank,
  type_answer: TypeAnswer,
} as const;

export function LessonPlayer({ attempt }: { attempt: AttemptStart }) {
  const router = useRouter();
  const { refresh } = useUser();

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<unknown>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [hearts, setHearts] = useState(attempt.hearts);
  const [checking, setChecking] = useState(false);
  const [summary, setSummary] = useState<CompleteResult | null>(null);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [pairsReady, setPairsReady] = useState(false);

  const exercise: Exercise | undefined = attempt.exercises[index];
  const isLast = index === attempt.exercises.length - 1;

  const canSubmit = (() => {
    if (!exercise || checking || result) return false;
    if (exercise.type === "match_pairs") return pairsReady;
    if (exercise.type === "type_answer")
      return Boolean((answer as { text?: string })?.text?.trim());
    if (exercise.type === "translate")
      return Boolean((answer as { words?: string[] })?.words?.length);
    return answer !== null;
  })();

  const check = useCallback(async () => {
    if (!exercise || !canSubmit) return;
    setChecking(true);
    try {
      const response = await api.submitAnswer(attempt.attempt_id, exercise.id, answer ?? {});
      setResult(response);
      setHearts(response.hearts);
      playTone(response.correct ? "correct" : "incorrect");
      if (response.out_of_hearts) setOutOfHearts(true);
    } catch {
      /* network hiccup: the learner can press check again */
    } finally {
      setChecking(false);
    }
  }, [answer, attempt.attempt_id, canSubmit, exercise]);

  const advance = useCallback(async () => {
    setResult(null);
    setAnswer(null);
    setPairsReady(false);

    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }
    try {
      const done = await api.completeLesson(attempt.attempt_id);
      setSummary(done);
      await refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) setOutOfHearts(true);
    }
  }, [attempt.attempt_id, isLast, refresh]);

  // Enter checks the answer and then continues, so a whole lesson can be done
  // from the keyboard - which is how anyone practising typing will use it.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter") return;
      if (result) {
        event.preventDefault();
        advance();
      } else if (canSubmit && exercise?.type !== "type_answer") {
        event.preventDefault();
        check();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, canSubmit, check, exercise?.type, result]);

  if (!exercise) return null;

  const Component = EXERCISES[exercise.type];

  return (
    <div className="flex min-h-screen flex-col">
      {/* header: quit, progress, hearts */}
      <header className="mx-auto flex w-full max-w-[1000px] items-center gap-4 px-4 py-5">
        <button
          onClick={() => setConfirmQuit(true)}
          aria-label="Quit lesson"
          className="text-2xl font-bold text-mist hover:text-stone"
        >
          ✕
        </button>
        <ProgressBar value={index + (result ? 1 : 0)} max={attempt.exercises.length} />
        <span className="flex items-center gap-1 text-lg font-extrabold text-coral">
          <span aria-hidden>{hearts > 0 ? "❤️" : "🖤"}</span>
          {hearts}
        </span>
      </header>

      {/* question */}
      <main className="mx-auto w-full max-w-[700px] flex-1 px-4 py-6">
        <h1 className="mb-8 text-2xl font-extrabold sm:text-3xl">{exercise.prompt}</h1>
        <Component
          exercise={exercise}
          value={answer}
          onChange={setAnswer}
          locked={Boolean(result)}
          onSubmit={check}
          onReady={setPairsReady}
          speechLang={attempt.speech_lang}
        />
      </main>

      {/* footer: check button, or the feedback bar once answered */}
      {result ? (
        <FeedbackBar result={result} onContinue={advance} isLast={isLast} />
      ) : (
        <footer className="border-t-2 border-cloud">
          <div className="mx-auto flex max-w-[1000px] justify-end px-4 py-5">
            <Button
              onClick={check}
              disabled={!canSubmit}
              className="w-full sm:w-[180px]"
            >
              {checking ? "Checking…" : "Check"}
            </Button>
          </div>
        </footer>
      )}

      {summary && (
        <LessonCompleteModal
          summary={summary}
          onClose={() => router.push("/")}
        />
      )}
      {outOfHearts && (
        <OutOfHeartsModal
          onRefilled={() => {
            setOutOfHearts(false);
            router.push("/");
          }}
          onQuit={() => router.push("/")}
        />
      )}
      {confirmQuit && (
        <QuitModal
          onStay={() => setConfirmQuit(false)}
          onQuit={async () => {
            await api.quitLesson(attempt.attempt_id).catch(() => {});
            router.push("/");
          }}
        />
      )}
    </div>
  );
}
