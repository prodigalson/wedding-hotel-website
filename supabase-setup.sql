-- ============================================================
-- WEDDING HOTEL SITE: DATABASE SETUP
-- Paste this whole file into Supabase (SQL Editor) and press Run.
-- It creates the tables, security rules, and safety logic that
-- prevents two guests from booking the last room at once.
-- ============================================================

-- 1) Tables ---------------------------------------------------

create table if not exists hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stars int,
  distance_km numeric,
  travel_minutes int,
  price_from numeric,
  address text,
  lat numeric,
  lng numeric,
  phone text,
  email text,
  amenities text[] default '{}',
  photos text[] default '{}',
  description_en text,
  description_pt text,
  description_it text,
  cancellation_en text,
  cancellation_pt text,
  cancellation_it text,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  name text not null,
  price numeric,
  total int not null default 0,
  remaining int not null default 0,
  created_at timestamptz default now()
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references hotels(id),
  room_id uuid references rooms(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  arrival date not null,
  departure date not null,
  guests int default 2,
  status text not null default 'confirmed',
  notes text,
  created_at timestamptz default now()
);

-- 2) Security rules (Row Level Security) ---------------------

alter table hotels enable row level security;
alter table rooms enable row level security;
alter table reservations enable row level security;

-- Anyone can view active hotels and their rooms
create policy "public read hotels" on hotels
  for select using (active = true);
create policy "public read rooms" on rooms
  for select using (true);

-- Only the logged-in admin can change anything
create policy "admin all hotels" on hotels
  for all to authenticated using (true) with check (true);
create policy "admin all rooms" on rooms
  for all to authenticated using (true) with check (true);
create policy "admin all reservations" on reservations
  for all to authenticated using (true) with check (true);

-- Guests can NOT read reservations (privacy) and can only create
-- them through the safe function below.

-- 3) Safe reservation function (prevents overbooking) --------

create or replace function reserve_room(
  p_room_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_arrival date,
  p_departure date,
  p_guests int
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining int;
  v_hotel uuid;
  v_id uuid;
begin
  -- basic checks
  if coalesce(trim(p_first_name), '') = '' or coalesce(trim(p_last_name), '') = ''
     or coalesce(trim(p_email), '') = '' then
    return json_build_object('ok', false, 'error', 'missing_fields');
  end if;
  if p_departure <= p_arrival then
    return json_build_object('ok', false, 'error', 'invalid_dates');
  end if;

  -- lock the room row so two people can't take the last room
  select remaining, hotel_id into v_remaining, v_hotel
  from rooms where id = p_room_id for update;

  if v_remaining is null then
    return json_build_object('ok', false, 'error', 'room_not_found');
  end if;
  if v_remaining <= 0 then
    return json_build_object('ok', false, 'error', 'sold_out');
  end if;

  update rooms set remaining = remaining - 1 where id = p_room_id;

  insert into reservations
    (hotel_id, room_id, first_name, last_name, email, phone, arrival, departure, guests)
  values
    (v_hotel, p_room_id, trim(p_first_name), trim(p_last_name), trim(p_email),
     nullif(trim(coalesce(p_phone, '')), ''), p_arrival, p_departure, coalesce(p_guests, 2))
  returning id into v_id;

  return json_build_object('ok', true, 'id', v_id);
end;
$$;

revoke all on function reserve_room(uuid, text, text, text, text, date, date, int) from public;
grant execute on function reserve_room(uuid, text, text, text, text, date, date, int) to anon, authenticated;

-- 4) Cancel function (admin only, puts the room back) ---------

create or replace function cancel_reservation(p_reservation_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room uuid;
  v_status text;
begin
  select room_id, status into v_room, v_status
  from reservations where id = p_reservation_id for update;

  if v_status is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_status = 'cancelled' then
    return json_build_object('ok', true);
  end if;

  update reservations set status = 'cancelled' where id = p_reservation_id;
  if v_room is not null then
    update rooms set remaining = least(total, remaining + 1) where id = v_room;
  end if;
  return json_build_object('ok', true);
end;
$$;

revoke all on function cancel_reservation(uuid) from public;
grant execute on function cancel_reservation(uuid) to authenticated;

-- 5) Photo storage --------------------------------------------

insert into storage.buckets (id, name, public)
values ('hotel-photos', 'hotel-photos', true)
on conflict (id) do nothing;

create policy "public read photos" on storage.objects
  for select using (bucket_id = 'hotel-photos');
create policy "admin write photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'hotel-photos');
create policy "admin update photos" on storage.objects
  for update to authenticated using (bucket_id = 'hotel-photos');
create policy "admin delete photos" on storage.objects
  for delete to authenticated using (bucket_id = 'hotel-photos');

-- Done! Now add your admin user:
-- Supabase menu → Authentication → Users → Add user
-- (use your own email and a strong password)
