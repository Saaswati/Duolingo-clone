/**
 * The only place in the frontend that knows the backend exists.
 *
 * Every component calls these functions rather than fetch() directly, so the
 * base URL, the learner header and error handling are defined once. Swapping
 * the header for a real session cookie later is a change to this file alone.
 */
import type {
  AnswerResult,
  AttemptStart,
  CompleteResult,
  Course,
  CourseSummary,
  LeaderboardEntry,
  Profile,
  User,
  UserUpdate,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Set by the settings page to exercise streak logic without waiting a day. */
const SIMULATED_DATE_KEY = "duo:simulatedDate";

export function getSimulatedDate(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SIMULATED_DATE_KEY);
}

export function setSimulatedDate(value: string | null) {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(SIMULATED_DATE_KEY, value);
  else window.localStorage.removeItem(SIMULATED_DATE_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  const simulated = getSimulatedDate();
  if (simulated) headers["X-Simulated-Date"] = simulated;

  const response = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      detail = (await response.json()).detail ?? detail;
    } catch {
      /* response had no JSON body */
    }
    throw new ApiError(response.status, detail);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  me: () => request<User>("/me"),
  course: () => request<Course>("/course"),
  courses: () => request<CourseSummary[]>("/courses"),

  selectCourse: (courseId: number) =>
    request<Course>(`/courses/${courseId}/select`, { method: "POST" }),

  updateMe: (changes: UserUpdate) =>
    request<User>("/me", { method: "PATCH", body: JSON.stringify(changes) }),

  profile: () => request<Profile>("/profile"),
  leaderboard: () => request<LeaderboardEntry[]>("/leaderboard"),
  refillHearts: () => request<User>("/hearts/refill", { method: "POST" }),

  startLesson: (lessonId: number) =>
    request<AttemptStart>(`/lessons/${lessonId}/start`, { method: "POST" }),

  submitAnswer: (attemptId: number, exerciseId: number, answer: unknown) =>
    request<AnswerResult>(`/attempts/${attemptId}/answer`, {
      method: "POST",
      body: JSON.stringify({ exercise_id: exerciseId, answer }),
    }),

  completeLesson: (attemptId: number) =>
    request<CompleteResult>(`/attempts/${attemptId}/complete`, { method: "POST" }),

  quitLesson: (attemptId: number) =>
    request<void>(`/attempts/${attemptId}/quit`, { method: "POST" }),
};
