"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/clsx";

const NAV = [
  { href: "/", label: "LEARN", icon: "🏠" },
  { href: "/courses", label: "LANGUAGES", icon: "🌍" },
  { href: "/leaderboard", label: "LEADERBOARDS", icon: "🏆" },
  { href: "/quests", label: "QUESTS", icon: "📜" },
  { href: "/shop", label: "SHOP", icon: "🛍️" },
  { href: "/profile", label: "PROFILE", icon: "👤" },
  { href: "/settings", label: "MORE", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop rail */}
      <nav className="fixed inset-y-0 left-0 hidden w-[256px] flex-col gap-2 border-r-2 border-[#E5E5E5] bg-white p-4 dark:border-[#2a3a40] dark:bg-[#1a2a30] lg:flex">
        <Link
          href="/"
          className="mb-4 px-3 text-[28px] font-extrabold tracking-tight text-[#58CC02]"
        >
          duolingo
        </Link>
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-4 rounded-2xl border-2 px-4 py-3 text-[15px] font-bold uppercase tracking-wide transition-colors",
                active
                  ? "border-[#1CB0F6]/40 bg-[#1CB0F6]/10 text-[#1CB0F6]"
                  : "border-transparent text-[#777] hover:bg-[#F7F7F7] dark:text-[#8a9aa0] dark:hover:bg-[#223338]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-2xl" aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-[#E5E5E5] bg-white dark:border-[#2a3a40] dark:bg-[#1a2a30] lg:hidden">
        {NAV.slice(0, 5).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-bold uppercase",
                active ? "text-[#1CB0F6]" : "text-[#777] dark:text-[#8a9aa0]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-2xl" aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
