/**
 * Spoken prompts via the browser's built-in speech synthesis.
 *
 * Chosen over seeded audio files so any seeded word can be spoken without
 * shipping recordings. The voice is audibly synthetic - a production course
 * would use recorded audio per exercise (see ASSUMPTIONS.md).
 */
export function speak(text: string, lang = "en-US") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

/** Short tones for correct/incorrect, synthesised so there are no audio assets. */
export function playTone(kind: "correct" | "incorrect") {
  if (typeof window === "undefined") return;
  const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctor) return;
  try {
    const ctx = new Ctor();
    const notes = kind === "correct" ? [523.25, 659.25, 783.99] : [220, 185];
    notes.forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      const start = ctx.currentTime + index * 0.08;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {
    /* audio is a nicety, never a failure */
  }
}
