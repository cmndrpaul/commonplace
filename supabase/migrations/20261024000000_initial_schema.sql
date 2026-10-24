create extension if not exists pgcrypto;

create type public.project_category as enum (
  'School project', 'Programming', 'Research', 'Design', 'Engineering', 'Other'
);
create type public.project_status as enum ('draft', 'published');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  bio text not null default '' check (char_length(bio) <= 500),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 30 and 5000),
  category public.project_category not null,
  status public.project_status not null default 'draft',
  thumbnail_path text,
  file_path text,
  project_url text check (project_url is null or project_url ~ '^https?://'),
  search_document tsvector generated always as (to_tsvector('english', title || ' ' || description)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index projects_published_created_idx on public.projects (created_at desc) where status = 'published';
create index projects_category_created_idx on public.projects (category, created_at desc) where status = 'published';
create index projects_search_idx on public.projects using gin (search_document);
create index projects_user_created_idx on public.projects (user_id, created_at desc);
create unique index projects_file_path_unique_idx on public.projects (file_path) where file_path is not null;
create unique index projects_thumbnail_path_unique_idx on public.projects (thumbnail_path) where thumbnail_path is not null;
create index comments_project_created_idx on public.comments (project_id, created_at desc);
create index likes_project_idx on public.likes (project_id);
create index bookmarks_user_created_idx on public.bookmarks (user_id, created_at desc);

create view public.project_like_counts with (security_invoker = false) as
select project_id, count(*)::integer as like_count
from public.likes
group by project_id;
grant select on public.project_like_counts to anon, authenticated;

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();
create trigger comments_set_updated_at before update on public.comments
for each row execute function public.set_updated_at();

create function public.create_profile_for_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  requested_username text;
  requested_name text;
begin
  requested_username := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  requested_username := regexp_replace(requested_username, '[^a-z0-9_]', '', 'g');
  if char_length(requested_username) < 3 or exists (select 1 from public.profiles where username = requested_username) then
    requested_username := 'member_' || replace(left(new.id::text, 12), '-', '');
  end if;
  requested_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Community member');
  insert into public.profiles (id, username, display_name) values (new.id, requested_username, left(requested_name, 80));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.bookmarks enable row level security;

create policy "Profiles are publicly readable" on public.profiles for select using (true);
create policy "Users update their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Published projects and owners are readable" on public.projects for select using (status = 'published' or auth.uid() = user_id);
create policy "Users create their own projects" on public.projects for insert with check (auth.uid() = user_id);
create policy "Users update their own projects" on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete their own projects" on public.projects for delete using (auth.uid() = user_id);

create policy "Comments on published projects are readable" on public.comments for select using (
  auth.uid() = user_id or exists (select 1 from public.projects where projects.id = comments.project_id and projects.status = 'published')
);
create policy "Signed-in users comment on published projects" on public.comments for insert with check (
  auth.uid() = user_id and exists (select 1 from public.projects where projects.id = comments.project_id and projects.status = 'published')
);
create policy "Users update their own comments" on public.comments for update using (auth.uid() = user_id) with check (
  auth.uid() = user_id and exists (select 1 from public.projects where projects.id = comments.project_id and projects.status = 'published')
);
create policy "Users delete their own comments" on public.comments for delete using (auth.uid() = user_id);

create policy "Users read their own likes" on public.likes for select using (auth.uid() = user_id);
create policy "Users add their own likes" on public.likes for insert with check (
  auth.uid() = user_id and exists (select 1 from public.projects where projects.id = likes.project_id and projects.status = 'published')
);
create policy "Users remove their own likes" on public.likes for delete using (auth.uid() = user_id);

create policy "Users read their own bookmarks" on public.bookmarks for select using (auth.uid() = user_id);
create policy "Users bookmark published projects" on public.bookmarks for insert with check (
  auth.uid() = user_id and exists (select 1 from public.projects where projects.id = bookmarks.project_id and projects.status = 'published')
);
create policy "Users remove their own bookmarks" on public.bookmarks for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-assets', 'project-assets', false, 20971520, array[
  'application/pdf', 'application/zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/png', 'image/jpeg'
])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Owners upload project assets" on storage.objects for insert to authenticated with check (
  bucket_id = 'project-assets' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Owners and published project viewers read assets" on storage.objects for select using (
  bucket_id = 'project-assets' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.projects where projects.status = 'published' and (projects.file_path = name or projects.thumbnail_path = name))
  )
);
create policy "Owners update project assets" on storage.objects for update to authenticated using (
  bucket_id = 'project-assets' and (storage.foldername(name))[1] = auth.uid()::text
) with check (bucket_id = 'project-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owners delete project assets" on storage.objects for delete to authenticated using (
  bucket_id = 'project-assets' and (storage.foldername(name))[1] = auth.uid()::text
);