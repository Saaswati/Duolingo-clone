"use client";

import { Mascot } from "../Mascot";
import { Button } from "../ui/Button";

export function QuitModal({ onStay, onQuit }: { onStay: () => void; onQuit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-[440px] animate-slide-up rounded-3xl bg-[#1a2a30] p-6 text-center sm:animate-pop-in">
        <Mascot size={100} mood="sad" />
        <h2 className="mt-3 text-2xl font-extrabold">Leave this lesson?</h2>
        <p className="mt-2 font-bold text-stone">
          Your progress in this lesson won&apos;t be saved. Hearts you&apos;ve already
          spent stay spent.
        </p>
        <div className="mt-6 space-y-3">
          <Button variant="green" onClick={onStay} className="w-full">
            Keep learning
          </Button>
          <Button variant="ghost" onClick={onQuit} className="w-full">
            Leave lesson
          </Button>
        </div>
      </div>
    </div>
  );
}
