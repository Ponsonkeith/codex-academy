-- supabase/email-triggers.sql
-- ─────────────────────────────────────────────────────────────
-- Database triggers that fire email Edge Functions on key events
-- Run this AFTER deploying the send-email Edge Function
-- ─────────────────────────────────────────────────────────────

-- Helper: call Edge Function via pg_net (enable extension first)
create extension if not exists "pg_net";

-- ── Function: call send-email Edge Function ────────────────
create or replace function public.trigger_email(
  p_type text,
  p_user_id uuid,
  p_data jsonb default '{}'
) returns void language plpgsql security definer as $$
declare
  v_profile record;
  v_payload jsonb;
begin
  select email, raw_user_meta_data->>'full_name' as full_name
  into v_profile
  from auth.users where id = p_user_id;

  if not found then return; end if;

  v_payload := jsonb_build_object(
    'type', p_type,
    'to',   v_profile.email,
    'name', coalesce(v_profile.full_name, split_part(v_profile.email, '@', 1)),
    'data', p_data
  );

  -- Fire Edge Function (non-blocking via pg_net)
  perform net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := v_payload
  );
end;
$$;

-- ── Trigger 1: Welcome email on signup ─────────────────────
create or replace function public.on_user_signup_email()
returns trigger language plpgsql security definer as $$
begin
  perform public.trigger_email('welcome', new.id);
  return new;
end;
$$;

create trigger user_signup_email
  after insert on public.profiles
  for each row execute procedure public.on_user_signup_email();

-- ── Trigger 2: Badge earned email ──────────────────────────
create or replace function public.on_badge_earned_email()
returns trigger language plpgsql security definer as $$
declare
  v_badge public.badges%rowtype;
begin
  select * into v_badge from public.badges where id = new.badge_id;

  perform public.trigger_email('badge_earned', new.user_id, jsonb_build_object(
    'badgeName',        v_badge.name,
    'badgeIcon',        v_badge.icon,
    'badgeDescription', v_badge.description,
    'xpReward',         v_badge.xp_reward,
    'rarity',           v_badge.rarity
  ));
  return new;
end;
$$;

create trigger badge_earned_email
  after insert on public.user_badges
  for each row execute procedure public.on_badge_earned_email();

-- ── Trigger 3: Streak reminder (run via pg_cron daily) ─────
-- Install pg_cron: supabase extensions enable pg_cron

create or replace function public.send_streak_reminders()
returns void language plpgsql security definer as $$
declare
  v_user record;
begin
  -- Find users with streaks > 2 who haven't been active today
  for v_user in
    select id, streak_current
    from public.profiles
    where streak_current > 2
      and streak_last_at < now() - interval '20 hours'
      and streak_last_at > now() - interval '44 hours'  -- only if streak still alive
  loop
    perform public.trigger_email('streak_reminder', v_user.id, jsonb_build_object(
      'streak', v_user.streak_current
    ));
  end loop;
end;
$$;

-- Schedule daily at 6pm UTC
-- select cron.schedule('streak-reminders', '0 18 * * *', 'select public.send_streak_reminders()');

-- ── Trigger 4: Course completion email ─────────────────────
-- Called manually from API after marking course complete:
-- SELECT public.trigger_email('course_complete', user_id, '{"courseName":"...","xpEarned":1200,"courseId":"..."}');

-- ── Set app settings (required for trigger_email) ──────────
-- Run these in Supabase SQL editor (replace with real values):
-- ALTER DATABASE postgres SET app.supabase_url = 'https://your-project.supabase.co';
-- ALTER DATABASE postgres SET app.service_role_key = 'your-service-role-key';
