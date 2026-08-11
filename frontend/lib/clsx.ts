/** Tiny class-name joiner. A dependency would be overkill for eight lines. */
export function clsx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
