import { clsx } from "@/lib/clsx";

export function ProgressBar({
  value,
  max,
  tone = "green",
  className,
}: {
  value: number;
  max: number;
  tone?: "green" | "gold" | "blue";
  className?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const fill =
    tone === "gold" ? "bg-[#FFC800]" : tone === "blue" ? "bg-[#1CB0F6]" : "bg-[#58CC02]";

  return (
    <div
      className={clsx("h-4 w-full overflow-hidden rounded-full bg-[#E5E5E5] dark:bg-[#2a3a40]", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={clsx("relative h-full rounded-full transition-[width] duration-500", fill)}
        style={{ width: `${percent}%` }}
      >
        {percent > 8 && (
          <span className="absolute inset-x-2 top-[3px] h-[3px] rounded-full bg-white/40" />
        )}
      </div>
    </div>
  );
}
