-- =====================================================================
-- WEGOBE (ndj) Supabase schema — 코드(src/) 기준으로 역추적하여 재구성
-- Supabase Dashboard > SQL Editor 에 통째로 붙여넣고 Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nickname    text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- 가입 시 profiles row 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nickname, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'nickname'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 기존 auth 유저들 profiles 복구
insert into public.profiles (id, nickname, avatar_url)
select id,
       coalesce(raw_user_meta_data->>'name', raw_user_meta_data->>'nickname'),
       raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 2. diet_challenges  (유저당 1개 — 코드에서 .single() / "이미 진행 중" 처리)
-- ---------------------------------------------------------------------
create table if not exists public.diet_challenges (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references auth.users(id) on delete cascade,
  title          text not null,
  start_weight   numeric(5,1) not null,
  target_weight  numeric(5,1) not null,
  target_date    date not null,
  deposit        integer not null default 0,
  status         text not null default 'active',
  invite_code    text unique,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. diet_participants  (적들)
-- ---------------------------------------------------------------------
create table if not exists public.diet_participants (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.diet_challenges(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  character     text,
  created_at    timestamptz not null default now(),
  unique (challenge_id, user_id)
);
create index if not exists diet_participants_user_idx on public.diet_participants(user_id);

-- ---------------------------------------------------------------------
-- 4. diet_daily_logs
-- ---------------------------------------------------------------------
create table if not exists public.diet_daily_logs (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.diet_challenges(id) on delete cascade,
  logged_date   date not null default (now() at time zone 'Asia/Seoul')::date,
  weight        numeric(5,1) not null,
  photo_url     text,
  created_at    timestamptz not null default now(),
  unique (challenge_id, logged_date)
);

-- ---------------------------------------------------------------------
-- 5. diet_missions
-- ---------------------------------------------------------------------
create table if not exists public.diet_missions (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.diet_challenges(id) on delete cascade,
  mission_date  date not null,
  content       text not null,
  photo_url     text,
  created_at    timestamptz not null default now(),
  unique (challenge_id, mission_date)
);

-- ---------------------------------------------------------------------
-- 6. diet_mission_verifications  (미션 인증 요청)
-- ---------------------------------------------------------------------
create table if not exists public.diet_mission_verifications (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.diet_challenges(id) on delete cascade,
  mission_date  date not null,
  requester_id  uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now()
);
create index if not exists diet_mission_verifications_idx
  on public.diet_mission_verifications(challenge_id, mission_date);

-- ---------------------------------------------------------------------
-- 7. diet_reactions
-- ---------------------------------------------------------------------
create table if not exists public.diet_reactions (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.diet_challenges(id) on delete cascade,
  logged_date   date not null,
  user_id       uuid not null references auth.users(id) on delete cascade,
  reaction      text not null,
  created_at    timestamptz not null default now(),
  unique (challenge_id, logged_date, user_id)
);

-- ---------------------------------------------------------------------
-- 8. diet_comments
-- ---------------------------------------------------------------------
create table if not exists public.diet_comments (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.diet_challenges(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  content       text not null,
  is_anonymous  boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists diet_comments_challenge_idx
  on public.diet_comments(challenge_id, created_at desc);

-- ---------------------------------------------------------------------
-- 9. diet_booms
-- ---------------------------------------------------------------------
create table if not exists public.diet_booms (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.diet_challenges(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  voted_date    date not null,
  is_boom_up    boolean not null,
  created_at    timestamptz not null default now()
);
create index if not exists diet_booms_challenge_idx on public.diet_booms(challenge_id);

-- ---------------------------------------------------------------------
-- 10. notifications
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  body        text not null,
  url         text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx
  on public.notifications(user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 11. fcm_tokens
-- ---------------------------------------------------------------------
create table if not exists public.fcm_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  token       text not null,
  device_id   text not null,
  updated_at  timestamptz not null default now(),
  unique (user_id, device_id)
);
create index if not exists fcm_tokens_token_idx on public.fcm_tokens(token);

-- =====================================================================
-- RLS
-- =====================================================================

-- 챌린지 owner 또는 참여자인지 (RLS 재귀 방지용 security definer)
create or replace function public.is_challenge_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.diet_challenges c where c.id = cid and c.user_id = auth.uid())
      or exists (select 1 from public.diet_participants p where p.challenge_id = cid and p.user_id = auth.uid());
$$;

create or replace function public.is_challenge_owner(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.diet_challenges c where c.id = cid and c.user_id = auth.uid());
$$;

alter table public.profiles                   enable row level security;
alter table public.diet_challenges            enable row level security;
alter table public.diet_participants          enable row level security;
alter table public.diet_daily_logs            enable row level security;
alter table public.diet_missions              enable row level security;
alter table public.diet_mission_verifications enable row level security;
alter table public.diet_reactions             enable row level security;
alter table public.diet_comments              enable row level security;
alter table public.diet_booms                 enable row level security;
alter table public.notifications              enable row level security;
alter table public.fcm_tokens                 enable row level security;

-- profiles
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- diet_challenges (초대코드로 조회해야 하므로 로그인 유저는 select 가능)
drop policy if exists "challenges_select" on public.diet_challenges;
create policy "challenges_select" on public.diet_challenges for select to authenticated using (true);
drop policy if exists "challenges_insert_own" on public.diet_challenges;
create policy "challenges_insert_own" on public.diet_challenges for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "challenges_update_own" on public.diet_challenges;
create policy "challenges_update_own" on public.diet_challenges for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "challenges_delete_own" on public.diet_challenges;
create policy "challenges_delete_own" on public.diet_challenges for delete to authenticated using (user_id = auth.uid());

-- diet_participants
drop policy if exists "participants_select" on public.diet_participants;
create policy "participants_select" on public.diet_participants for select to authenticated
  using (user_id = auth.uid() or public.is_challenge_member(challenge_id));
drop policy if exists "participants_insert_own" on public.diet_participants;
create policy "participants_insert_own" on public.diet_participants for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "participants_delete_own" on public.diet_participants;
create policy "participants_delete_own" on public.diet_participants for delete to authenticated
  using (user_id = auth.uid() or public.is_challenge_owner(challenge_id));

-- diet_daily_logs
drop policy if exists "logs_select" on public.diet_daily_logs;
create policy "logs_select" on public.diet_daily_logs for select to authenticated using (public.is_challenge_member(challenge_id));
drop policy if exists "logs_insert_owner" on public.diet_daily_logs;
create policy "logs_insert_owner" on public.diet_daily_logs for insert to authenticated with check (public.is_challenge_owner(challenge_id));
drop policy if exists "logs_update_owner" on public.diet_daily_logs;
create policy "logs_update_owner" on public.diet_daily_logs for update to authenticated using (public.is_challenge_owner(challenge_id)) with check (public.is_challenge_owner(challenge_id));
drop policy if exists "logs_delete_owner" on public.diet_daily_logs;
create policy "logs_delete_owner" on public.diet_daily_logs for delete to authenticated using (public.is_challenge_owner(challenge_id));

-- diet_missions
drop policy if exists "missions_select" on public.diet_missions;
create policy "missions_select" on public.diet_missions for select to authenticated using (public.is_challenge_member(challenge_id));
drop policy if exists "missions_insert_owner" on public.diet_missions;
create policy "missions_insert_owner" on public.diet_missions for insert to authenticated with check (public.is_challenge_owner(challenge_id));
drop policy if exists "missions_update_owner" on public.diet_missions;
create policy "missions_update_owner" on public.diet_missions for update to authenticated using (public.is_challenge_owner(challenge_id)) with check (public.is_challenge_owner(challenge_id));
drop policy if exists "missions_delete_owner" on public.diet_missions;
create policy "missions_delete_owner" on public.diet_missions for delete to authenticated using (public.is_challenge_owner(challenge_id));

-- diet_mission_verifications
drop policy if exists "verifications_select" on public.diet_mission_verifications;
create policy "verifications_select" on public.diet_mission_verifications for select to authenticated using (public.is_challenge_member(challenge_id));
drop policy if exists "verifications_insert_own" on public.diet_mission_verifications;
create policy "verifications_insert_own" on public.diet_mission_verifications for insert to authenticated
  with check (requester_id = auth.uid() and public.is_challenge_member(challenge_id));

-- diet_reactions
drop policy if exists "reactions_select" on public.diet_reactions;
create policy "reactions_select" on public.diet_reactions for select to authenticated using (public.is_challenge_member(challenge_id));
drop policy if exists "reactions_insert_own" on public.diet_reactions;
create policy "reactions_insert_own" on public.diet_reactions for insert to authenticated
  with check (user_id = auth.uid() and public.is_challenge_member(challenge_id));
drop policy if exists "reactions_update_own" on public.diet_reactions;
create policy "reactions_update_own" on public.diet_reactions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "reactions_delete_own" on public.diet_reactions;
create policy "reactions_delete_own" on public.diet_reactions for delete to authenticated using (user_id = auth.uid());

-- diet_comments
drop policy if exists "comments_select" on public.diet_comments;
create policy "comments_select" on public.diet_comments for select to authenticated using (public.is_challenge_member(challenge_id));
drop policy if exists "comments_insert_own" on public.diet_comments;
create policy "comments_insert_own" on public.diet_comments for insert to authenticated
  with check (user_id = auth.uid() and public.is_challenge_member(challenge_id));
drop policy if exists "comments_delete_own" on public.diet_comments;
create policy "comments_delete_own" on public.diet_comments for delete to authenticated using (user_id = auth.uid());

-- diet_booms
drop policy if exists "booms_select" on public.diet_booms;
create policy "booms_select" on public.diet_booms for select to authenticated using (public.is_challenge_member(challenge_id));
drop policy if exists "booms_insert_own" on public.diet_booms;
create policy "booms_insert_own" on public.diet_booms for insert to authenticated
  with check (user_id = auth.uid() and public.is_challenge_member(challenge_id));
drop policy if exists "booms_delete_own" on public.diet_booms;
create policy "booms_delete_own" on public.diet_booms for delete to authenticated using (user_id = auth.uid());

-- notifications (insert 는 service role 로만 → insert 정책 없음)
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications for delete to authenticated using (user_id = auth.uid());

-- fcm_tokens
drop policy if exists "fcm_tokens_own" on public.fcm_tokens;
create policy "fcm_tokens_own" on public.fcm_tokens for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =====================================================================
-- Realtime (NotificationBell / BottomNavNew 가 notifications INSERT 구독)
-- =====================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- =====================================================================
-- Storage: diet-photos (private, signed URL 사용)
-- 경로 규칙: {userId}/{challengeId}/{YYYY-MM-DD}[...]
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('diet-photos', 'diet-photos', false)
on conflict (id) do nothing;

drop policy if exists "diet_photos_insert_own" on storage.objects;
create policy "diet_photos_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'diet-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "diet_photos_update_own" on storage.objects;
create policy "diet_photos_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'diet-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'diet-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "diet_photos_delete_own" on storage.objects;
create policy "diet_photos_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'diet-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "diet_photos_select_member" on storage.objects;
create policy "diet_photos_select_member" on storage.objects for select to authenticated
  using (
    bucket_id = 'diet-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_challenge_member(((storage.foldername(name))[2])::uuid)
    )
  );
