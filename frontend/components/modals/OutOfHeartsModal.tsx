"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useUser } from "../UserProvider";
import { Mascot } from "../Mascot";
import { Button } from "../ui/Button";

export function OutOfHeartsModal({
  onRefilled,
  onQuit,
}: {
  onRefilled: () => void;
  onQuit: () => void;
}) {
  const { user, refresh } = useUser();
  const [seconds, setSeconds] = useState(user?.stats.seconds_to_next_heart ?? null);
  const [busy, setBusy] = useState(false);

  // Live countdown to the next heart, so the wait is legible rather than
  // mysterious. The value itself is computed by the server.
  useEffect(() => {
    if (seconds === null) return;
    const timer = setInterval(
      () => setSeconds((s) => (s === null || s <= 0 ? 0 : s - 1)),
      1000
    );
    return () => clearInterval(timer);
  }, [seconds]);

  const refill = async () => {
    setBusy(true);
    await api.refillHearts();
    await refresh();
    onRefilled();
  };

  const clock =
    seconds === null
      ? null
      : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-[440px] animate-pop-in rounded-3xl bg-[#1a2a30] p-6 text-center">
        <Mascot size={110} mood="sad" />
        <h2 className="mt-3 text-2xl font-extrabold">You ran out of hearts</h2>
        <p className="mt-2 font-bold text-stone">
          {clock
            ? `Your next heart arrives in ${clock}, or refill now and keep going.`
            : "Refill to keep going."}
        </p>

        <div className="mt-6 space-y-3">
          <Button variant="green" onClick={refill} disabled={busy} className="w-full">
            {busy ? "Refilling…" : "Refill hearts (free)"}
          </Button>
          <Button variant="ghost" onClick={onQuit} className="w-full">
            Back to the path
          </Button>
        </div>

        <p className="mt-4 text-xs font-bold text-mist">
          Refill is mocked for this build — the real app charges gems or asks you to practise.
        </p>
      </div>
    </div>
  );
}
