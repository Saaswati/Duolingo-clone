/** Mirrors app/schemas.py on the backend. */

export type ExerciseType =
  | "multiple_choice"
  | "translate"
  | "match_pairs"
  | "fill_blank"
  | "type_answer";

export type SkillState = "locked" | "available" | "in_progress" | "completed";

export interface Stats {
  active_course_id: number | null;
  total_xp: number;
  gems: number;
  hearts: number;
  max_hearts: number;
  seconds_to_next_heart: number | null;
  streak_count: number;
  longest_streak: number;
  daily_goal_xp: number;
  xp_today: number;
  last_activity_date: string | null;
}

export interface User {
  id: number;
  username: string;
  display_name: string;
  avatar_emoji: string;
  stats: Stats;
}

export interface Skill {
  id: number;
  order_index: number;
  title: string;
  icon: string;
  total_lessons: number;
  lessons_completed: number;
  crown_level: number;
  state: SkillState;
  next_lesson_id: number | null;
}

export interface Unit {
  id: number;
  order_index: number;
  title: string;
  subtitle: string;
  color: string;
  skills: Skill[];
}

export interface Course {
  id: number;
  code: string;
  speech_lang: string;
  title: string;
  from_language: string;
  to_language: string;
  flag_emoji: string;
  units: Unit[];
}

/* --- exercise payloads (no answers here, by design) --- */
export interface ChoiceOption { id: string; text: string; emoji?: string | null }
export interface MatchPair { id: string; source: string; target: string }

export interface Exercise {
  id: number;
  order_index: number;
  type: ExerciseType;
  prompt: string;
  payload: {
    question?: string;
    audio_text?: string | null;
    options?: ChoiceOption[] | string[];
    sentence?: string;
    word_bank?: string[];
    pairs?: MatchPair[];
    sentence_before?: string;
    sentence_after?: string;
    translation_hint?: string | null;
    source_text?: string;
    placeholder?: string;
  };
}

export interface AttemptStart {
  attempt_id: number;
  lesson_id: number;
  skill_title: string;
  speech_lang: string;
  exercises: Exercise[];
  hearts: number;
}

export interface AnswerResult {
  correct: boolean;
  correct_answer: string;
  explanation: string | null;
  hearts: number;
  out_of_hearts: boolean;
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  icon: string;
  threshold: number;
  progress: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface CompleteResult {
  xp_earned: number;
  base_xp: number;
  bonus_xp: number;
  total_xp: number;
  hearts: number;
  accuracy: number;
  streak_count: number;
  streak_extended: boolean;
  daily_goal_met: boolean;
  xp_today: number;
  daily_goal_xp: number;
  crown_level: number;
  skill_completed: boolean;
  new_achievements: Achievement[];
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  display_name: string;
  avatar_emoji: string;
  total_xp: number;
  is_current_user: boolean;
}

export interface DayActivity { activity_date: string; xp_earned: number }

export interface Profile {
  user: User;
  lessons_completed: number;
  crowns: number;
  achievements: Achievement[];
  recent_days: DayActivity[];
}

/** A course in the picker: no units, plus this learner's progress through it. */
export interface CourseSummary {
  id: number;
  code: string;
  title: string;
  from_language: string;
  to_language: string;
  flag_emoji: string;
  total_skills: number;
  skills_completed: number;
  is_active: boolean;
}

/** The three fields a learner may change about themselves. */
export interface UserUpdate {
  display_name?: string;
  avatar_emoji?: string;
  daily_goal_xp?: number;
}
