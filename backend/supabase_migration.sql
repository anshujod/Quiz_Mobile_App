-- Create a table to store push subscriptions
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  subscription jsonb not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Policy: Users can insert their own subscription
create policy "Users can insert their own subscription"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

-- Policy: Users can view their own subscription (optional, for debugging)
create policy "Users can view their own subscription"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

-- Policy: Service Role (Backend) has full access
-- Note: Supabase Service Role bypasses RLS, so no explicit policy needed for backend if using service_role key.
