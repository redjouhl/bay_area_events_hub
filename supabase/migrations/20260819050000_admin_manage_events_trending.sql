-- The events table only had a public SELECT policy, so the admin
-- "trending" toggle silently no-op'd: PostgREST returned 200 but RLS
-- blocked the UPDATE from ever matching a row. Mirror the admin policy
-- already in place for venues/cities/regions.
create policy "Admins manage events" on public.events
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

grant update on public.events to authenticated;
