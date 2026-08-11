"use client";

import { clsx } from "@/lib/clsx";

type Variant = "green" | "blue" | "red" | "gold" | "ghost" | "locked";

const VARIANTS: Record<Variant, string> = {
  green: "bg-[#58CC02] border-[#58A700] text-white hover:brightness-105",
  blue: "bg-[#1CB0F6] border-[#1899D6] text-white hover:brightness-105",
  red: "bg-[#FF4B4B] border-[#EA2B2B] text-white hover:brightness-105",
  gold: "bg-[#FFC800] border-[#E5B200] text-[#4B4B4B] hover:brightness-105",
  ghost: "bg-white border-[#E5E5E5] text-[#777] hover:bg-[#F7F7F7] dark:bg-[#1a2a30] dark:border-[#2a3a40] dark:text-[#8a9aa0] dark:hover:bg-[#223338]",
  locked: "bg-[#E5E5E5] border-[#d4d4d4] text-[#AFAFAF] dark:bg-[#2a3a40] dark:border-[#333] dark:text-[#666]",
};

export function Button({
  variant = "green",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const isDisabled = props.disabled;
  return (
    <button
      {...props}
      className={clsx(
        "btn-3d",
        isDisabled ? VARIANTS.locked : VARIANTS[variant],
        isDisabled && "active:translate-y-0 active:border-b-4",
        className
      )}
    >
      {children}
    </button>
  );
}
