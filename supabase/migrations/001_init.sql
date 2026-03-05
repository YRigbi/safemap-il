-- SafeMap IL — Full Database Schema
-- Run this in Supabase SQL Editor

-- ── EXTENSIONS ──────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── USERS (mirrors auth.users) ───────────────
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  email       text unique,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- ── CITIES ───────────────────────────────────
create table public.cities (
  id          serial primary key,
  name        text unique not null,
  zone        text not null,
  lat         float not null,
  lng         float not null,
  migun_time  int not null default 90,   -- seconds
  created_at  timestamptz default now()
);

-- ── USER LOCATIONS (current + history) ───────
create table public.user_locations (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.users(id) on delete cascade,
  city_name   text not null,
  lat         float,
  lng         float,
  status      text not null default 'safe',  -- safe|shelter|moving|help
  recorded_at timestamptz default now()
);

create index on public.user_locations(user_id, recorded_at desc);

-- ── SHELTER SESSIONS ─────────────────────────
create table public.shelter_sessions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.users(id) on delete cascade,
  city_name   text not null,
  entered_at  timestamptz not null,
  exited_at   timestamptz,
  duration_mins int generated always as (
    extract(epoch from (coalesce(exited_at, now()) - entered_at)) / 60
  ) stored
);

create index on public.shelter_sessions(user_id, entered_at desc);

-- ── GROUPS ───────────────────────────────────
create table public.groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  icon        text default '👥',
  owner_id    uuid references public.users(id) on delete cascade,
  invite_token text unique default encode(gen_random_bytes(16), 'hex'),
  created_at  timestamptz default now()
);

-- ── GROUP MEMBERS ─────────────────────────────
create table public.group_members (
  group_id    uuid references public.groups(id) on delete cascade,
  user_id     uuid references public.users(id) on delete cascade,
  joined_at   timestamptz default now(),
  primary key (group_id, user_id)
);

-- ── OREF ALERTS CACHE ─────────────────────────
create table public.oref_alerts (
  id          serial primary key,
  alert_id    text,
  cities      text[] not null,
  title       text,
  description text,
  category    int,
  triggered_at timestamptz default now()
);

create index on public.oref_alerts(triggered_at desc);

-- ── RLS POLICIES ─────────────────────────────
alter table public.users           enable row level security;
alter table public.user_locations  enable row level security;
alter table public.shelter_sessions enable row level security;
alter table public.groups          enable row level security;
alter table public.group_members   enable row level security;
alter table public.oref_alerts     enable row level security;
alter table public.cities          enable row level security;

-- Users: read own, update own
create policy "users_read_own"   on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);

-- Locations: read group members, write own
create policy "locations_read_group" on public.user_locations for select
  using (
    user_id = auth.uid() or
    exists (
      select 1 from public.group_members gm1
      join public.group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid() and gm2.user_id = user_locations.user_id
    )
  );
create policy "locations_insert_own" on public.user_locations for insert with check (user_id = auth.uid());

-- Shelter: own only
create policy "shelter_own" on public.shelter_sessions for all using (user_id = auth.uid());

-- Groups: read if member or owner
create policy "groups_read" on public.groups for select
  using (
    owner_id = auth.uid() or
    exists (select 1 from public.group_members where group_id = groups.id and user_id = auth.uid())
  );
create policy "groups_insert" on public.groups for insert with check (owner_id = auth.uid());
create policy "groups_update"  on public.groups for update using (owner_id = auth.uid());
create policy "groups_delete"  on public.groups for delete using (owner_id = auth.uid());

-- Group members
create policy "members_read" on public.group_members for select
  using (
    user_id = auth.uid() or
    exists (select 1 from public.groups where id = group_id and owner_id = auth.uid())
  );
create policy "members_insert" on public.group_members for insert with check (
  -- join via invite (allow) or owner adds
  user_id = auth.uid() or
  exists (select 1 from public.groups where id = group_id and owner_id = auth.uid())
);
create policy "members_delete" on public.group_members for delete
  using (user_id = auth.uid() or exists (select 1 from public.groups where id = group_id and owner_id = auth.uid()));

-- Oref alerts: read all
create policy "oref_read_all" on public.oref_alerts for select using (true);

-- Cities: read all
create policy "cities_read_all" on public.cities for select using (true);

-- ── SEED CITIES ──────────────────────────────
insert into public.cities (name, zone, lat, lng, migun_time) values
('תל אביב - מרכז העיר',   'תל אביב',    32.0780, 34.7748, 90),
('תל אביב - דרום ויפו',   'תל אביב',    32.0490, 34.7550, 90),
('תל אביב - עבר הירקון',  'תל אביב',    32.1040, 34.7990, 90),
('רמת גן',                'דן',          32.0680, 34.8235, 90),
('בני ברק',               'דן',          32.0841, 34.8338, 90),
('גבעתיים',               'דן',          32.0695, 34.8121, 90),
('פתח תקווה',             'דן',          32.0841, 34.8878, 90),
('ראשון לציון - מזרח',    'דן',          31.9800, 34.8200, 90),
('ראשון לציון - מערב',    'דן',          31.9650, 34.7900, 90),
('חולון',                 'דן',          32.0107, 34.7739, 90),
('בת ים',                 'דן',          32.0204, 34.7508, 90),
('ירושלים - מרכז',        'ירושלים',     31.7830, 35.2137, 90),
('ירושלים - מלחה',        'ירושלים',     31.7500, 35.1900, 90),
('ירושלים - ארמון הנציב', 'ירושלים',     31.7400, 35.2300, 90),
('חיפה - כרמל',           'חיפה',        32.7870, 34.9917, 60),
('חיפה - נווה שאנן',      'חיפה',        32.7750, 35.0200, 60),
('קריית אתא',             'חיפה',        32.8100, 35.1000, 60),
('קריית ביאליק',          'חיפה',        32.8350, 35.0750, 60),
('קריית מוצקין',          'חיפה',        32.8400, 35.0700, 60),
('עכו',                   'עכו',         32.9232, 35.0769, 60),
('נהריה',                 'חוף הכרמל',  33.0076, 35.0919, 60),
('נתניה',                 'השרון',       32.3215, 34.8532, 90),
('הרצליה',                'השרון',       32.1645, 34.8439, 90),
('רעננה',                 'השרון',       32.1841, 34.8700, 90),
('כפר סבא',               'השרון',       32.1753, 34.9066, 90),
('הוד השרון',             'השרון',       32.1500, 34.8950, 90),
('ראש העין',              'דן',          32.0956, 34.9524, 90),
('אשדוד - צפון',          'אשדוד',       31.8200, 34.6650, 45),
('אשדוד - דרום',          'אשדוד',       31.7900, 34.6500, 45),
('אשקלון - צפון',         'אשקלון',      31.6800, 34.5720, 30),
('אשקלון - דרום',         'אשקלון',      31.6500, 34.5700, 30),
('רחובות',                'שפלה',        31.8928, 34.8113, 60),
('לוד',                   'שפלה',        31.9516, 34.8954, 60),
('רמלה',                  'שפלה',        31.9296, 34.8706, 60),
('קריית גת',              'שפלה',        31.6100, 34.7642, 45),
('מודיעין',               'שפלה',        31.8940, 35.0095, 90),
('באר שבע - מרכז',        'נגב',         31.2518, 34.7913, 60),
('באר שבע - דרום',        'נגב',         31.2200, 34.7900, 60),
('דימונה',                'נגב',         31.0657, 35.0327, 60),
('אופקים',                'נגב מערבי',  31.3116, 34.6173, 15),
('נתיבות',                'נגב מערבי',  31.4200, 34.5900, 15),
('שדרות',                 'עוטף עזה',   31.5250, 34.5990, 15),
('זיקים',                 'עוטף עזה',   31.6100, 34.5290, 15),
('טבריה',                 'כינרת',       32.7922, 35.5312, 60),
('צפת',                   'גליל עליון', 32.9641, 35.4960, 30),
('קריית שמונה',           'גליל עליון', 33.2071, 35.5695, 15),
('נצרת',                  'גליל תחתון', 32.7000, 35.3000, 90),
('אילת',                  'ערבה',        29.5577, 34.9519, 30);

-- ── FUNCTION: join group by token ────────────
create or replace function public.join_group_by_token(p_token text)
returns uuid language plpgsql security definer as $$
declare
  v_group_id uuid;
begin
  select id into v_group_id from public.groups where invite_token = p_token;
  if v_group_id is null then raise exception 'Invalid invite token'; end if;
  insert into public.group_members(group_id, user_id)
  values (v_group_id, auth.uid())
  on conflict do nothing;
  return v_group_id;
end;
$$;

-- ── REALTIME ─────────────────────────────────
alter publication supabase_realtime add table public.user_locations;
alter publication supabase_realtime add table public.oref_alerts;
