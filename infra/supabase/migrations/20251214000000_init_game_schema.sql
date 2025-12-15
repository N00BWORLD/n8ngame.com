-- 10-B-2 Strict Schema Migration

-- 1. Profiles (Optional but recommended for syncing user meta)
-- Extends auth.users to store game-specific user profile data.
create table if not exists public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  username text unique,
  avatar_url text,
  credits bigint default 0,
  created_at timestamptz default now()
);

-- Trigger for sync (Idempotent)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger first to ensure clean creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Blueprints (Metadata)
create table if not exists public.blueprints (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null default 'Untitled Blueprint',
  is_public boolean default false,
  structure_version int default 1, -- Data Format Version
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Blueprint Versions (Immutable Snapshots)
create table if not exists public.blueprint_versions (
  id uuid default gen_random_uuid() primary key,
  blueprint_id uuid references public.blueprints(id) on delete cascade not null,
  version int not null check (version > 0),
  data jsonb not null,
  created_at timestamptz default now(),
  unique(blueprint_id, version)
);

-- 4. Inventory (Items)
create table if not exists public.inventory (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  item_type text not null,
  level int default 1 check (level >= 1), -- Enhancement Level
  quantity bigint default 1 check (quantity >= 0),
  metadata jsonb default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique(user_id, item_type, level) -- Stack by Type + Level
);

-- 4.1 Inventory Logs (Audit)
create table if not exists public.inventory_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  item_type text not null,
  delta bigint not null, -- +1 or -1
  reason text, -- 'craft', 'drop', 'trade'
  created_at timestamptz default now()
);

-- 1.1 Wallet Logs (Audit for Credits)
create table if not exists public.wallet_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  delta bigint not null,
  reason text,
  balance_after bigint,
  created_at timestamptz default now()
);


-- 5. RLS Policies
alter table public.profiles enable row level security;
alter table public.blueprints enable row level security;
alter table public.blueprint_versions enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_events enable row level security;
alter table public.wallet_events enable row level security;

-- ... (Previous Policies) ...

-- Inventory: Owner Only
drop policy if exists "Users see own inventory." on public.inventory;
create policy "Users see own inventory." on public.inventory for select using (auth.uid() = user_id);
drop policy if exists "Users update own inventory." on public.inventory;
create policy "Users update own inventory." on public.inventory for update using (auth.uid() = user_id);

-- Logs: Owner Read Only (Server creates inputs)
create policy "Users read own inv logs." on public.inventory_events for select using (auth.uid() = user_id);
create policy "Users read own wallet logs." on public.wallet_events for select using (auth.uid() = user_id);
-- Insert policy for logs usually requires Service Role or function override, 
-- but if we allow client log? No, logs should be server authoritative. 
-- Service Role bypasses RLS, so no Insert policy needed for Client.


-- 6. Indexes for Performance (Safe creation)
create index if not exists idx_blueprints_user_id on public.blueprints(user_id);
create index if not exists idx_blueprints_updated_at on public.blueprints(updated_at);
create index if not exists idx_versions_blueprint_id on public.blueprint_versions(blueprint_id);
create index if not exists idx_inventory_user_id on public.inventory(user_id);
create index if not exists idx_inventory_item_type on public.inventory(item_type);
create index if not exists idx_inv_events_user on public.inventory_events(user_id, created_at desc);
create index if not exists idx_wallet_events_user on public.wallet_events(user_id, created_at desc);
