"use client";

/**
 * Holds the learner and their active course for the whole app.
 *
 * Hearts, XP and streak appear in the top bar, the lesson player and the
 * profile at once, and the active course drives both the flag in the top bar
 * and the path itself. Keeping them in one context means every screen reads
 * the same values and a single `refresh()` after any action re-syncs all of
 * them — the client never guesses at numbers the server owns.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "@/lib/api";
import type { Course, User } from "@/lib/types";

interface UserContextValue {
  user: User | null;
  course: Course | null;
  loading: boolean;
  serverWaking: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setUser: (user: User) => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  course: null,
  loading: true,
  serverWaking: false,
  error: null,
  refresh: async () => {},
  setUser: () => {},
});

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverWaking, setServerWaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      // Both in flight together: the top bar needs the stats and the flag at
      // the same moment, so serialising them would only add latency.
      const [nextUser, nextCourse] = await Promise.all([api.me(), api.course()]);
      setUser(nextUser);
      setCourse(nextCourse);
      setError(null);
    } catch {
      setError("Can't reach the server.");
    } finally {
      setLoading(false);
      setServerWaking(false);
    }
  }, []);

  useEffect(() => {
    // Free hosting tiers sleep after inactivity and take up to a minute to
    // wake. Rather than showing an anonymous spinner for that minute, we say
    // what is happening once the wait becomes noticeable.
    const timer = setTimeout(() => setServerWaking(true), 2500);
    refresh().finally(() => clearTimeout(timer));
    return () => clearTimeout(timer);
  }, [refresh]);

  return (
    <UserContext.Provider
      value={{ user, course, loading, serverWaking, error, refresh, setUser }}
    >
      {children}
    </UserContext.Provider>
  );
}
