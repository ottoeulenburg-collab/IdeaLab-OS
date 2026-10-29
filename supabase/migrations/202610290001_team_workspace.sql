begin;
create table public.event_workspaces (
  id uuid primary key,
  revision integer not null default 0,
  metadata jsonb not null default '{"event":{"name":"","start":"","location":"","budget":0},"checklist":[],"people":[],"shifts":[]}'::jsonb
);
insert into public.event_workspaces(id) values ('11111111-1111-4111-8111-111111111111');
create table public.event_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.event_workspaces(id) on delete cascade
);
create index event_members_workspace on public.event_members(workspace_id);
alter table public.event_members enable row level security;
create policy own_membership on public.event_members for select to authenticated using (user_id = (select auth.uid()));
alter table public.event_workspaces enable row level security;
create policy member_workspace on public.event_workspaces for select to authenticated using (
  id in (select workspace_id from public.event_members where user_id = (select auth.uid()))
);
create table public.event_tasks (
  workspace_id uuid not null references public.event_workspaces(id) on delete cascade,
  id text not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and payload->>'id' = id),
  primary key(workspace_id, id)
);
create table public.event_contacts (like public.event_tasks including all);
alter table public.event_contacts add foreign key(workspace_id) references public.event_workspaces(id) on delete cascade;
create table public.event_expenses (like public.event_tasks including all);
alter table public.event_expenses add foreign key(workspace_id) references public.event_workspaces(id) on delete cascade;
create table public.event_equipment (like public.event_tasks including all);
alter table public.event_equipment add foreign key(workspace_id) references public.event_workspaces(id) on delete cascade;
create index event_tasks_status_due on public.event_tasks(workspace_id, (payload->>'status'), (payload->>'due'));
create index event_equipment_status on public.event_equipment(workspace_id, (payload->>'status'));
create unique index event_equipment_inventory on public.event_equipment(workspace_id, (payload->>'inventoryCode'));
do $$ declare t text; begin
  foreach t in array array['event_tasks','event_contacts','event_expenses','event_equipment'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy team_read on public.%I for select to authenticated using (workspace_id in (select workspace_id from public.event_members where user_id = (select auth.uid())))', t);
  end loop;
end $$;
revoke all on public.event_workspaces, public.event_members, public.event_tasks, public.event_contacts, public.event_expenses, public.event_equipment from anon, authenticated;
grant select on public.event_workspaces, public.event_members, public.event_tasks, public.event_contacts, public.event_expenses, public.event_equipment to authenticated;

-- One statement produces a consistent snapshot; RLS also protects direct REST reads.
create function public.event_snapshot() returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('revision', w.revision, 'data', w.metadata || jsonb_build_object(
    'tasks', coalesce((select jsonb_agg(payload order by id) from public.event_tasks where workspace_id=w.id), '[]'::jsonb),
    'contacts', coalesce((select jsonb_agg(payload order by id) from public.event_contacts where workspace_id=w.id), '[]'::jsonb),
    'expenses', coalesce((select jsonb_agg(payload order by id) from public.event_expenses where workspace_id=w.id), '[]'::jsonb),
    'equipment', coalesce((select jsonb_agg(payload order by id) from public.event_equipment where workspace_id=w.id), '[]'::jsonb)
  )) from public.event_workspaces w join public.event_members m on m.workspace_id=w.id where m.user_id=(select auth.uid());
$$;

-- Writes are atomic, membership checked, and serialized on the workspace revision.
-- Only this narrowly scoped function can mutate data; table write grants are absent.
create function public.event_apply(expected_revision integer, operations jsonb, only_empty boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare wid uuid; rev integer; op jsonb; tbl text; entry jsonb;
begin
  select workspace_id into wid from public.event_members where user_id=(select auth.uid());
  if wid is null then raise exception 'not a workspace member' using errcode='42501'; end if;
  select revision into rev from public.event_workspaces where id=wid for update;
  if rev <> expected_revision then raise exception 'conflict: workspace changed'; end if;
  if only_empty and rev <> 0 then raise exception 'conflict: workspace is not empty'; end if;
  if jsonb_typeof(operations) <> 'array' or jsonb_array_length(operations)>10000 then raise exception 'invalid operations'; end if;
  for op in select * from jsonb_array_elements(operations) loop
    if op->>'collection' = 'metadata' then
      entry := op->'item';
      if jsonb_typeof(entry->'event') is distinct from 'object' or jsonb_typeof(entry->'checklist') is distinct from 'array'
        or jsonb_typeof(entry->'people') is distinct from 'array' or jsonb_typeof(entry->'shifts') is distinct from 'array'
        then raise exception 'invalid metadata'; end if;
      update public.event_workspaces set metadata=entry where id=wid;
    else
      tbl := case op->>'collection' when 'tasks' then 'event_tasks' when 'contacts' then 'event_contacts' when 'expenses' then 'event_expenses' when 'equipment' then 'event_equipment' else null end;
      if tbl is null then raise exception 'invalid collection'; end if;
      if op ? 'item' then
        entry := op->'item';
        if jsonb_typeof(entry) is distinct from 'object' or coalesce(entry->>'id','')='' then raise exception 'invalid item'; end if;
        execute format('insert into public.%I(workspace_id,id,payload) values ($1,$2,$3) on conflict(workspace_id,id) do update set payload=excluded.payload',tbl) using wid,entry->>'id',entry;
      else
        execute format('delete from public.%I where workspace_id=$1 and id=$2',tbl) using wid,op->>'id';
      end if;
    end if;
  end loop;
  update public.event_workspaces set revision=revision+1 where id=wid;
  return public.event_snapshot();
end $$;
revoke all on function public.event_snapshot(), public.event_apply(integer,jsonb,boolean) from public, anon;
grant execute on function public.event_snapshot(), public.event_apply(integer,jsonb,boolean) to authenticated;
alter publication supabase_realtime add table public.event_workspaces;
commit;
