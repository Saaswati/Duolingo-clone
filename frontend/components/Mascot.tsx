/**
 * Original owl mark drawn for this project.
 *
 * Deliberately not Duolingo's character: the brief asks the app to feel like
 * Duolingo, and copying their artwork would be taking their asset rather than
 * building the experience. Same green, same round-eyed friendliness, our
 * geometry.
 */
export function Mascot({
  size = 120,
  mood = "happy",
}: {
  size?: number;
  mood?: "happy" | "sad" | "celebrate";
}) {
  const eyeY = mood === "sad" ? 46 : 44;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      role="img"
      aria-label="Course mascot"
      className={mood === "celebrate" ? "animate-bounce-soft" : undefined}
    >
      {/* body */}
      <ellipse cx="60" cy="70" rx="38" ry="40" fill="#58CC02" />
      <ellipse cx="60" cy="78" rx="26" ry="28" fill="#89E219" />
      {/* ear tufts */}
      <path d="M28 42 L34 22 L48 34 Z" fill="#58CC02" />
      <path d="M92 42 L86 22 L72 34 Z" fill="#58CC02" />
      {/* eyes */}
      <circle cx="46" cy={eyeY} r="15" fill="#FFFFFF" />
      <circle cx="74" cy={eyeY} r="15" fill="#FFFFFF" />
      <circle cx={mood === "sad" ? 44 : 47} cy={eyeY + 2} r="7" fill="#4B4B4B" />
      <circle cx={mood === "sad" ? 72 : 75} cy={eyeY + 2} r="7" fill="#4B4B4B" />
      <circle cx={mood === "sad" ? 42 : 45} cy={eyeY} r="2.5" fill="#FFFFFF" />
      <circle cx={mood === "sad" ? 70 : 73} cy={eyeY} r="2.5" fill="#FFFFFF" />
      {/* beak */}
      <path d="M60 54 L69 63 L60 70 L51 63 Z" fill="#FFC800" />
      {/* feet */}
      <path d="M48 106 l0 6 M44 112 h10 M72 106 l0 6 M68 112 h10"
        stroke="#FFC800" strokeWidth="4" strokeLinecap="round" />
      {mood === "sad" && (
        <>
          <path d="M36 30 l12 6 M84 30 l-12 6" stroke="#58A700" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="82" cy="60" rx="3" ry="5" fill="#1CB0F6" />
        </>
      )}
    </svg>
  );
}
