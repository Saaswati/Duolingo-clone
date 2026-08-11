"use client";

import { Sidebar } from "./Sidebar";
import { StatsBar } from "./StatsBar";
import { useUser } from "./UserProvider";
import { Mascot } from "./Mascot";

export function AppShell({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  const { loading, serverWaking, error } = useUser();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center dark:bg-[#131F24]">
        <Mascot size={96} mood="celebrate" />
        <p className="text-lg font-bold text-[#777] dark:text-[#8a9aa0]">
          {serverWaking
            ? "Waking the server up — free hosting sleeps when idle. This takes about a minute."
            : "Loading your path…"}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center dark:bg-[#131F24]">
        <Mascot size={96} mood="sad" />
        <h1 className="text-2xl font-extrabold dark:text-white">The server isn&apos;t answering</h1>
        <p className="max-w-md font-bold text-[#777]">
          Start the backend with <code className="rounded bg-[#F7F7F7] px-2 py-1 dark:bg-[#2a3a40] dark:text-[#58CC02]">uvicorn app.main:app --reload</code>{" "}
          and check that NEXT_PUBLIC_API_URL points at it.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#131F24] lg:pl-[256px]">
      <Sidebar />
      <div className="mx-auto flex max-w-[1000px] gap-8 px-4 pb-24 lg:pb-8">
        <main className="min-w-0 flex-1">
          <StatsBar />
          {children}
        </main>
        {aside && (
          <aside className="hidden w-[330px] shrink-0 pt-6 xl:block">{aside}</aside>
        )}
      </div>
    </div>
  );
}
