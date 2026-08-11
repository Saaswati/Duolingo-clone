"use client";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/components/UserProvider";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

export default function ShopPage() {
  const { user, refresh } = useUser();
  const toast = useToast();

  const refill = async () => {
    await api.refillHearts();
    await refresh();
    toast("Hearts refilled.", "success");
  };

  return (
    <AppShell>
      <div className="space-y-6 py-6">
        <h1 className="text-3xl font-extrabold text-white">Shop</h1>

        <section className="card-3d flex items-center gap-4 p-5">
          <span className="text-5xl" aria-hidden>❤️</span>
          <div className="flex-1">
            <h2 className="text-lg font-extrabold">Refill hearts</h2>
            <p className="text-[15px] font-bold text-stone">
              You have {user?.stats.hearts ?? 0} of {user?.stats.max_hearts ?? 5}. One heart
              comes back every 30 minutes on its own.
            </p>
          </div>
          <Button
            onClick={refill}
            disabled={user?.stats.hearts === user?.stats.max_hearts}
          >
            {user?.stats.hearts === user?.stats.max_hearts ? "Full" : "Refill"}
          </Button>
        </section>

        <ComingSoon
          icon="💎"
          title="Gems"
          body="Gems are displayed but can't be earned or spent in this build."
        />
        <ComingSoon
          icon="🦸"
          title="Super"
          body="Subscriptions and in-app purchases are out of scope for this assignment."
        />
        <ComingSoon
          icon="🎽"
          title="Streak freeze"
          body="Streak protection isn't implemented — streaks reset after a missed day."
        />
      </div>
    </AppShell>
  );
}

function ComingSoon({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <section className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-cloud p-5">
      <span className="text-4xl opacity-40" aria-hidden>{icon}</span>
      <div>
        <h2 className="text-lg font-extrabold text-stone">
          {title} <span className="ml-2 rounded-full bg-cloud px-2 py-0.5 text-xs uppercase">Coming soon</span>
        </h2>
        <p className="text-[15px] font-bold text-mist">{body}</p>
      </div>
    </section>
  );
}
