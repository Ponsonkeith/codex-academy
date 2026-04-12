-- ═══════════════════════════════════════════════════════════════
-- CODEX ACADEMY — Full Database Schema
-- Run this in Supabase SQL Editor (or via supabase db push)
-- ═══════════════════════════════════════════════════════════════

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ───────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ───────────────────────────────────────────
create table public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  username        text unique not null,
  full_name       text,
  avatar_url      text,
  bio             text,
  country         text default '🌍',

  -- XP & Leveling
  xp_total        integer default 0 not null,
  xp_level        integer default 1 not null,
  xp_to_next      integer default 1000 not null,

  -- Streak tracking
  streak_current  integer default 0 not null,
  streak_longest  integer default 0 not null,
  streak_last_at  timestamptz,

  -- Subscription
  plan            text default 'explorer' check (plan in ('explorer','learner','elite')),
  stripe_customer_id    text unique,
  stripe_subscription_id text unique,
  subscription_status   text default 'inactive',
  subscription_end_at   timestamptz,

  -- Stats
  lessons_completed  integer default 0,
  quizzes_completed  integer default 0,
  perfect_quizzes    integer default 0,
  community_posts    integer default 0,
  community_likes    integer default 0,

  -- Metadata
  is_admin        boolean default false,
  onboarded       boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ───────────────────────────────────────────
-- COURSES
-- ───────────────────────────────────────────
create table public.courses (
  id              uuid default uuid_generate_v4() primary key,
  slug            text unique not null,
  title           text not null,
  subtitle        text,
  description     text,
  icon            text default '🧠',
  color           text default '#f5a623',
  level           text default 'Beginner' check (level in ('Beginner','Intermediate','Advanced','Expert')),
  xp_reward       integer default 1000,
  required_plan   text default 'explorer' check (required_plan in ('explorer','learner','elite')),
  is_published    boolean default false,
  sort_order      integer default 0,
  created_at      timestamptz default now()
);

-- ───────────────────────────────────────────
-- LESSONS
-- ───────────────────────────────────────────
create table public.lessons (
  id              uuid default uuid_generate_v4() primary key,
  course_id       uuid references public.courses(id) on delete cascade,
  title           text not null,
  slug            text not null,
  content         text,                        -- MDX/markdown content
  video_url       text,
  duration_mins   integer default 10,
  type            text default 'video' check (type in ('video','reading','quiz','project')),
  xp_reward       integer default 100,
  sort_order      integer default 0,
  is_published    boolean default false,
  created_at      timestamptz default now(),
  unique(course_id, slug)
);

-- ───────────────────────────────────────────
-- QUIZZES
-- ───────────────────────────────────────────
create table public.quizzes (
  id              uuid default uuid_generate_v4() primary key,
  lesson_id       uuid references public.lessons(id) on delete cascade,
  course_id       uuid references public.courses(id) on delete cascade,
  title           text not null,
  pass_threshold  integer default 70,          -- % needed to pass
  xp_reward       integer default 200,
  xp_perfect_bonus integer default 100,        -- bonus for 100%
  time_limit_secs integer,                     -- null = no limit
  created_at      timestamptz default now()
);

create table public.quiz_questions (
  id              uuid default uuid_generate_v4() primary key,
  quiz_id         uuid references public.quizzes(id) on delete cascade,
  question        text not null,
  options         jsonb not null,              -- ["option a", "option b", ...]
  correct_index   integer not null,
  explanation     text,
  sort_order      integer default 0
);

-- ───────────────────────────────────────────
-- USER PROGRESS
-- ───────────────────────────────────────────
create table public.lesson_progress (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade,
  lesson_id       uuid references public.lessons(id) on delete cascade,
  course_id       uuid references public.courses(id) on delete cascade,
  completed       boolean default false,
  completed_at    timestamptz,
  xp_earned       integer default 0,
  created_at      timestamptz default now(),
  unique(user_id, lesson_id)
);

create table public.quiz_attempts (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade,
  quiz_id         uuid references public.quizzes(id) on delete cascade,
  score           integer not null,            -- percentage 0-100
  answers         jsonb,                       -- [{question_id, selected_index}]
  passed          boolean default false,
  is_perfect      boolean default false,
  xp_earned       integer default 0,
  time_taken_secs integer,
  created_at      timestamptz default now()
);

-- ───────────────────────────────────────────
-- BADGES
-- ───────────────────────────────────────────
create table public.badges (
  id              text primary key,            -- e.g. 'first_lesson', 'streak_7'
  name            text not null,
  description     text,
  icon            text not null,
  rarity          text default 'common' check (rarity in ('common','rare','epic','legendary')),
  xp_reward       integer default 50,
  xp_multiplier   numeric(3,2) default 1.00,  -- legendary badges boost XP earn rate
  trigger_type    text not null,              -- 'lesson_count','streak','quiz_score','leaderboard','manual'
  trigger_value   integer,                    -- e.g. 7 for streak_7
  is_active       boolean default true
);

create table public.user_badges (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade,
  badge_id        text references public.badges(id) on delete cascade,
  earned_at       timestamptz default now(),
  unique(user_id, badge_id)
);

-- Seed badges
insert into public.badges (id, name, description, icon, rarity, xp_reward, trigger_type, trigger_value) values
  ('first_lesson',  'Ignition',   'Complete your first lesson',              '🔥', 'common',    50,   'lesson_count',  1),
  ('lessons_10',    'Momentum',   'Complete 10 lessons',                     '⚡', 'rare',      150,  'lesson_count',  10),
  ('lessons_50',    'Scholar',    'Complete 50 lessons',                     '📚', 'epic',      400,  'lesson_count',  50),
  ('lessons_100',   'Sage',       'Complete 100 lessons',                    '🌙', 'legendary', 1000, 'lesson_count',  100),
  ('streak_7',      'Voltage',    '7-day learning streak',                   '⚡', 'rare',      150,  'streak',        7),
  ('streak_30',     'Celestial',  '30-day learning streak',                  '🌟', 'legendary', 1000, 'streak',        30),
  ('streak_100',    'Immortal',   '100-day learning streak',                 '💫', 'legendary', 2000, 'streak',        100),
  ('quiz_perfect',  'Flawless',   'Score 100% on any quiz',                  '💎', 'epic',      200,  'quiz_score',    100),
  ('quiz_5perfect', 'Diamond',    'Score 100% on 5 quizzes',                 '💠', 'legendary', 500,  'quiz_score',    100),
  ('top10',         'Apex',       'Reach top 10 on leaderboard',             '👑', 'legendary', 500,  'leaderboard',   10),
  ('top3',          'Titan',      'Reach top 3 on leaderboard',              '🏆', 'legendary', 1000, 'leaderboard',   3),
  ('social_5',      'Connector',  'Help 5 students in the community',        '🤝', 'rare',      100,  'manual',        null),
  ('speed_3',       'Hyperdrive', 'Complete 3 lessons in a single day',      '🚀', 'epic',      250,  'lesson_count',  3),
  ('course_first',  'Conqueror',  'Complete your first full course',         '🏅', 'epic',      300,  'manual',        null),
  ('elite_member',  'Elite',      'Subscribed to Elite plan',                '⭐', 'rare',      200,  'manual',        null);

-- ───────────────────────────────────────────
-- XP TRANSACTIONS (audit log)
-- ───────────────────────────────────────────
create table public.xp_transactions (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade,
  amount          integer not null,
  reason          text not null,               -- 'lesson_complete', 'badge_earned', 'quiz_passed', etc.
  meta            jsonb,                       -- { lesson_id, badge_id, etc. }
  created_at      timestamptz default now()
);

-- ───────────────────────────────────────────
-- COMMUNITY
-- ───────────────────────────────────────────
create table public.community_posts (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade,
  channel         text default 'general' check (channel in ('general','ai-help','projects','off-topic')),
  content         text not null,
  likes_count     integer default 0,
  reply_to        uuid references public.community_posts(id) on delete set null,
  is_deleted      boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table public.post_likes (
  user_id         uuid references public.profiles(id) on delete cascade,
  post_id         uuid references public.community_posts(id) on delete cascade,
  created_at      timestamptz default now(),
  primary key(user_id, post_id)
);

-- ───────────────────────────────────────────
-- AI TUTOR CONVERSATIONS
-- ───────────────────────────────────────────
create table public.ai_conversations (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade,
  lesson_id       uuid references public.lessons(id) on delete set null,
  messages        jsonb default '[]',          -- [{role, content, timestamp}]
  tokens_used     integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ───────────────────────────────────────────
-- STRIPE EVENTS (webhook idempotency)
-- ───────────────────────────────────────────
create table public.stripe_events (
  id              text primary key,            -- Stripe event ID
  type            text not null,
  processed_at    timestamptz default now()
);

-- ───────────────────────────────────────────
-- VIEWS
-- ───────────────────────────────────────────

-- Global leaderboard
create or replace view public.leaderboard as
  select
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.country,
    p.xp_total,
    p.xp_level,
    p.streak_current,
    p.plan,
    rank() over (order by p.xp_total desc) as rank
  from public.profiles p
  where p.xp_total > 0
  order by p.xp_total desc;

-- Course progress summary per user
create or replace view public.course_progress as
  select
    lp.user_id,
    lp.course_id,
    c.title as course_title,
    c.xp_reward as course_xp_reward,
    count(l.id) as total_lessons,
    count(lp.id) filter (where lp.completed = true) as completed_lessons,
    coalesce(sum(lp.xp_earned), 0) as xp_earned,
    round(count(lp.id) filter (where lp.completed = true)::numeric / count(l.id) * 100) as pct_complete,
    bool_and(lp.completed) as is_complete,
    max(lp.completed_at) as last_activity
  from public.courses c
  join public.lessons l on l.course_id = c.id
  left join public.lesson_progress lp on lp.lesson_id = l.id
  group by lp.user_id, lp.course_id, c.title, c.xp_reward;

-- ───────────────────────────────────────────
-- FUNCTIONS
-- ───────────────────────────────────────────

-- Award XP and level up if needed
create or replace function public.award_xp(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_meta jsonb default '{}'
) returns integer language plpgsql security definer as $$
declare
  v_multiplier numeric := 1.0;
  v_final_xp integer;
  v_new_total integer;
  v_new_level integer;
  v_xp_to_next integer;
begin
  -- Get XP multiplier from legendary badges
  select coalesce(max(b.xp_multiplier), 1.0)
  into v_multiplier
  from public.user_badges ub
  join public.badges b on b.id = ub.badge_id
  where ub.user_id = p_user_id and b.xp_multiplier > 1.0;

  v_final_xp := ceil(p_amount * v_multiplier);

  -- Log the transaction
  insert into public.xp_transactions (user_id, amount, reason, meta)
  values (p_user_id, v_final_xp, p_reason, p_meta);

  -- Update profile XP
  update public.profiles
  set xp_total = xp_total + v_final_xp
  where id = p_user_id
  returning xp_total into v_new_total;

  -- Recalculate level (every 1000 XP, +200 per level)
  v_new_level := greatest(1, floor((-100 + sqrt(10000 + 800 * v_new_total)) / 400)::int + 1);
  v_xp_to_next := (v_new_level * 400 + 100)^2 / 800 - v_new_total;

  update public.profiles
  set xp_level = v_new_level, xp_to_next = greatest(0, v_xp_to_next)
  where id = p_user_id;

  return v_final_xp;
end;
$$;

-- Update streak
create or replace function public.update_streak(p_user_id uuid)
returns integer language plpgsql security definer as $$
declare
  v_last_at timestamptz;
  v_current integer;
  v_longest integer;
  v_days_diff integer;
begin
  select streak_last_at, streak_current, streak_longest
  into v_last_at, v_current, v_longest
  from public.profiles where id = p_user_id;

  if v_last_at is null then
    -- First activity ever
    update public.profiles
    set streak_current = 1, streak_longest = 1, streak_last_at = now()
    where id = p_user_id;
    return 1;
  end if;

  v_days_diff := extract(day from now() - v_last_at)::int;

  if v_days_diff = 0 then
    return v_current; -- already active today
  elsif v_days_diff = 1 then
    v_current := v_current + 1;
  else
    v_current := 1; -- streak broken
  end if;

  v_longest := greatest(v_longest, v_current);

  update public.profiles
  set streak_current = v_current,
      streak_longest = v_longest,
      streak_last_at = now()
  where id = p_user_id;

  return v_current;
end;
$$;

-- Check and award badges automatically
create or replace function public.check_badges(p_user_id uuid)
returns setof text language plpgsql security definer as $$
declare
  v_profile public.profiles%rowtype;
  v_badge public.badges%rowtype;
  v_already boolean;
  v_earned_id text;
begin
  select * into v_profile from public.profiles where id = p_user_id;

  for v_badge in select * from public.badges where is_active = true and trigger_type != 'manual' loop
    -- Skip if already earned
    select exists(select 1 from public.user_badges where user_id = p_user_id and badge_id = v_badge.id)
    into v_already;

    if v_already then continue; end if;

    -- Check trigger condition
    if v_badge.trigger_type = 'lesson_count' and v_profile.lessons_completed >= v_badge.trigger_value then
      insert into public.user_badges (user_id, badge_id) values (p_user_id, v_badge.id);
      perform public.award_xp(p_user_id, v_badge.xp_reward, 'badge_earned', jsonb_build_object('badge_id', v_badge.id));
      return next v_badge.id;
    end if;

    if v_badge.trigger_type = 'streak' and v_profile.streak_current >= v_badge.trigger_value then
      insert into public.user_badges (user_id, badge_id) values (p_user_id, v_badge.id);
      perform public.award_xp(p_user_id, v_badge.xp_reward, 'badge_earned', jsonb_build_object('badge_id', v_badge.id));
      return next v_badge.id;
    end if;

    if v_badge.trigger_type = 'quiz_score' and v_profile.perfect_quizzes >= 1 and v_badge.id = 'quiz_perfect' then
      insert into public.user_badges (user_id, badge_id) values (p_user_id, v_badge.id);
      perform public.award_xp(p_user_id, v_badge.xp_reward, 'badge_earned', jsonb_build_object('badge_id', v_badge.id));
      return next v_badge.id;
    end if;
  end loop;
end;
$$;

-- ───────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ───────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.user_badges enable row level security;
alter table public.xp_transactions enable row level security;
alter table public.community_posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.ai_conversations enable row level security;

-- Profiles: users see all profiles (public), only edit their own
create policy "Profiles are public" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- Lesson progress: private to owner
create policy "Own lesson progress" on public.lesson_progress for all using (auth.uid() = user_id);

-- Quiz attempts: private to owner
create policy "Own quiz attempts" on public.quiz_attempts for all using (auth.uid() = user_id);

-- Badges: all earned badges are public (for leaderboard/profiles)
create policy "Badges are public" on public.user_badges for select using (true);
create policy "System awards badges" on public.user_badges for insert with check (false); -- only via service role

-- XP: private to owner
create policy "Own XP history" on public.xp_transactions for select using (auth.uid() = user_id);

-- Community: all posts visible, users manage their own
create policy "Posts are public" on public.community_posts for select using (true);
create policy "Users create posts" on public.community_posts for insert with check (auth.uid() = user_id);
create policy "Users update own posts" on public.community_posts for update using (auth.uid() = user_id);

-- Likes
create policy "Likes are public" on public.post_likes for select using (true);
create policy "Users manage own likes" on public.post_likes for all using (auth.uid() = user_id);

-- AI conversations: private
create policy "Own AI conversations" on public.ai_conversations for all using (auth.uid() = user_id);

-- ───────────────────────────────────────────
-- INDEXES (performance)
-- ───────────────────────────────────────────
create index idx_lesson_progress_user on public.lesson_progress(user_id);
create index idx_lesson_progress_course on public.lesson_progress(course_id);
create index idx_quiz_attempts_user on public.quiz_attempts(user_id);
create index idx_user_badges_user on public.user_badges(user_id);
create index idx_xp_transactions_user on public.xp_transactions(user_id);
create index idx_community_posts_channel on public.community_posts(channel);
create index idx_community_posts_user on public.community_posts(user_id);
create index idx_profiles_xp on public.profiles(xp_total desc);

-- Done!
