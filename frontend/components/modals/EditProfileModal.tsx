"use client";

/**
 * Edit your own profile.
 *
 * Only what a learner is allowed to change: a display name, an avatar and the
 * daily XP goal. XP, hearts and streak are earned rather than set, and the
 * backend's UserUpdate schema refuses them outright — this form simply has no
 * way to express them.
 */
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useUser } from "../UserProvider";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { clsx } from "@/lib/clsx";

const AVATARS = ["🦉", "🦊", "🐼", "🐧", "🦁", "🐝", "🐢", "🦄", "🐙", "🐨", "🦖", "🐳"];
const GOALS = [
  { xp: 10, label: "Casual" },
  { xp: 20, label: "Regular" },
  { xp: 30, label: "Serious" },
  { xp: 50, label: "Intense" },
];

export function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { user, refresh } = useUser();
  const toast = useToast();

  const [name, setName] = useState(user?.display_name ?? "");
  const [avatar, setAvatar] = useState(user?.avatar_emoji ?? "🦉");
  const [goal, setGoal] = useState(user?.stats.daily_goal_xp ?? 20);
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && trimmed.length <= 40 && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await api.updateMe({
        display_name: trimmed,
        avatar_emoji: avatar,
        daily_goal_xp: goal,
      });
      await refresh();
      toast("Profile updated.", "success");
      onClose();
    } catch (error) {
      toast(
        error instanceof ApiError ? error.message : "Couldn't save your changes.",
        "error"
      );
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile"
    >
      <div
        className="max-h-[90vh] w-full max-w-[480px] animate-slide-up overflow-y-auto rounded-3xl bg-[#1a2a30] p-6 sm:animate-pop-in"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-2xl font-extrabold">Edit profile</h2>

        {/* name */}
        <label className="mt-6 block">
          <span className="text-[13px] font-extrabold uppercase tracking-wide text-stone">
            Display name
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            className="mt-2 w-full rounded-2xl border-2 border-cloud px-4 py-3 text-lg font-bold focus:border-sky"
            placeholder="What should we call you?"
          />
          {trimmed.length === 0 && (
            <span className="mt-1 block text-sm font-bold text-coral">
              Your name can&apos;t be empty.
            </span>
          )}
        </label>

        {/* avatar */}
        <fieldset className="mt-6">
          <legend className="text-[13px] font-extrabold uppercase tracking-wide text-stone">
            Avatar
          </legend>
          <div className="mt-2 grid grid-cols-6 gap-2">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setAvatar(emoji)}
                aria-pressed={avatar === emoji}
                className={clsx(
                  "rounded-2xl border-2 py-2 text-3xl transition-colors",
                  avatar === emoji
                    ? "border-sky bg-sky/10"
                    : "border-cloud hover:bg-snow"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </fieldset>

        {/* daily goal */}
        <fieldset className="mt-6">
          <legend className="text-[13px] font-extrabold uppercase tracking-wide text-stone">
            Daily goal
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {GOALS.map((option) => (
              <button
                key={option.xp}
                onClick={() => setGoal(option.xp)}
                aria-pressed={goal === option.xp}
                className={clsx(
                  "rounded-2xl border-2 px-4 py-3 text-left transition-colors",
                  goal === option.xp
                    ? "border-sky bg-sky/10 text-sky"
                    : "border-cloud hover:bg-snow"
                )}
              >
                <span className="block font-extrabold">{option.label}</span>
                <span className="block text-sm font-bold text-stone">
                  {option.xp} XP a day
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-8 space-y-3">
          <Button onClick={save} disabled={!canSave} className="w-full">
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
