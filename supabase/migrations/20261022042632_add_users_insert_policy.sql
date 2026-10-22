-- Allow newly-verified (or OAuth) users to create their own public profile row.
create policy "Users can insert their own profile"
  on public.users
  for insert
  to authenticated
  with check (auth.uid() = id);
