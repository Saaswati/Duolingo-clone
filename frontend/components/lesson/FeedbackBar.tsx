"use client";

import { Button } from "../ui/Button";
import type { AnswerResult } from "@/lib/types";

/**
 * The bar that slides up from the bottom after every answer. Duolingo's most
 * imitated component, and the moment the whole loop hangs on: it names the
 * verdict, shows the right answer when you got it wrong, and moves you on
 * with the same button in the same place every time.
 */
export function FeedbackBar({
  result,
  onContinue,
  isLast,
}: {
  result: AnswerResult;
  onContinue: () => void;
  isLast: boolean;
}) {
  const good = result.correct;

  return (
    <div
      className={`animate-slide-up border-t-2 ${
        good ? "border-leaf/30 bg-[#1a3a1a]" : "border-coral/30 bg-[#3a1a1a]"
      }`}
      role="alert"
    >
      <div className="mx-auto flex max-w-[1000px] flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#131F24] text-2xl ${
              good ? "text-[#58CC02]" : "text-[#FF4B4B]"
            }`}
            aria-hidden
          >
            {good ? "✓" : "✕"}
          </span>
          <div className={good ? "text-[#58CC02]" : "text-[#FF4B4B]"}>
            <p className="text-2xl font-extrabold">
              {good ? "Nice!" : "Correct answer:"}
            </p>
            {!good && <p className="text-lg font-bold">{result.correct_answer}</p>}
            {result.explanation && (
              <p className="mt-1 text-[15px] font-bold opacity-80">{result.explanation}</p>
            )}
          </div>
        </div>

        <Button
          variant={good ? "green" : "red"}
          onClick={onContinue}
          className="w-full sm:w-[180px]"
          autoFocus
        >
          {isLast ? "Finish" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
