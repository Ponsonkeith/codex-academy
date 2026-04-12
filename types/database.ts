// types/database.ts
// Auto-generate this with: npx supabase gen types typescript --local > types/database.ts
// Below is a manually crafted version to get you started

export type Plan = 'explorer' | 'learner' | 'elite'
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
export type LessonType = 'video' | 'reading' | 'quiz' | 'project'
export type BadgeTrigger = 'lesson_count' | 'streak' | 'quiz_score' | 'leaderboard' | 'manual'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  country: string
  xp_total: number
  xp_level: number
  xp_to_next: number
  streak_current: number
  streak_longest: number
  streak_last_at: string | null
  plan: Plan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string
  subscription_end_at: string | null
  lessons_completed: number
  quizzes_completed: number
  perfect_quizzes: number
  community_posts: number
  community_likes: number
  is_admin: boolean
  onboarded: boolean
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  icon: string
  color: string
  level: CourseLevel
  xp_reward: number
  required_plan: Plan
  is_published: boolean
  sort_order: number
  created_at: string
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  slug: string
  content: string | null
  video_url: string | null
  duration_mins: number
  type: LessonType
  xp_reward: number
  sort_order: number
  is_published: boolean
  created_at: string
}

export interface Badge {
  id: string
  name: string
  description: string | null
  icon: string
  rarity: BadgeRarity
  xp_reward: number
  xp_multiplier: number
  trigger_type: BadgeTrigger
  trigger_value: number | null
  is_active: boolean
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  badge?: Badge
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  course_id: string
  completed: boolean
  completed_at: string | null
  xp_earned: number
  created_at: string
}

export interface QuizAttempt {
  id: string
  user_id: string
  quiz_id: string
  score: number
  answers: any
  passed: boolean
  is_perfect: boolean
  xp_earned: number
  time_taken_secs: number | null
  created_at: string
}

export interface CommunityPost {
  id: string
  user_id: string
  channel: string
  content: string
  likes_count: number
  reply_to: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url' | 'xp_level' | 'plan'>
}

export interface LeaderboardEntry {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  country: string
  xp_total: number
  xp_level: number
  streak_current: number
  plan: Plan
  rank: number
}

export interface XPTransaction {
  id: string
  user_id: string
  amount: number
  reason: string
  meta: any
  created_at: string
}

// Supabase Database type (used by typed client)
export interface Database {
  public: {
    Tables: {
      profiles:          { Row: Profile;          Insert: Partial<Profile>;          Update: Partial<Profile> }
      courses:           { Row: Course;           Insert: Partial<Course>;           Update: Partial<Course> }
      lessons:           { Row: Lesson;           Insert: Partial<Lesson>;           Update: Partial<Lesson> }
      badges:            { Row: Badge;            Insert: Partial<Badge>;            Update: Partial<Badge> }
      user_badges:       { Row: UserBadge;        Insert: Partial<UserBadge>;        Update: Partial<UserBadge> }
      lesson_progress:   { Row: LessonProgress;   Insert: Partial<LessonProgress>;   Update: Partial<LessonProgress> }
      quiz_attempts:     { Row: QuizAttempt;      Insert: Partial<QuizAttempt>;      Update: Partial<QuizAttempt> }
      community_posts:   { Row: CommunityPost;    Insert: Partial<CommunityPost>;    Update: Partial<CommunityPost> }
      xp_transactions:   { Row: XPTransaction;    Insert: Partial<XPTransaction>;    Update: Partial<XPTransaction> }
    }
    Views: {
      leaderboard:       { Row: LeaderboardEntry }
    }
    Functions: {
      award_xp:          { Args: { p_user_id: string; p_amount: number; p_reason: string; p_meta?: any }; Returns: number }
      update_streak:     { Args: { p_user_id: string }; Returns: number }
      check_badges:      { Args: { p_user_id: string }; Returns: string[] }
    }
  }
}
