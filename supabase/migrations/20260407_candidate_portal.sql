create extension if not exists pgcrypto;

create table if not exists candidate_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  date_of_birth date,
  ni_number text,
  location text,
  address_line_1 text,
  address_line_2 text,
  city text,
  postcode text,
  country text default 'United Kingdom',
  linkedin_url text,
  portfolio_url text,
  summary text,
  right_to_work_uk text,
  profile_status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists candidate_skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  proficiency text,
  years_experience text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists candidate_experience (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text,
  job_title text,
  start_date date,
  end_date date,
  is_current boolean default false,
  summary text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists candidate_invites (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  application_id uuid references job_applications(id) on delete set null,
  token_hash text not null unique,
  invited_by_email text,
  sent_at timestamptz default now(),
  expires_at timestamptz,
  accepted_at timestamptz,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists candidate_interview_slots (
  id uuid default gen_random_uuid() primary key,
  application_id uuid not null references job_applications(id) on delete cascade,
  hiring_manager_email text,
  hiring_manager_name text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text default 'Europe/London',
  interview_mode text default 'video',
  location text,
  notes text,
  status text default 'open',
  created_by_email text,
  created_by_name text,
  booked_by_user_id uuid references auth.users(id) on delete set null,
  booked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table job_applications
  add column if not exists candidate_user_id uuid references auth.users(id) on delete set null,
  add column if not exists portal_status text default 'unclaimed',
  add column if not exists portal_last_viewed_at timestamptz,
  add column if not exists portal_invited_at timestamptz,
  add column if not exists portal_invited_by_email text,
  add column if not exists candidate_profile_snapshot jsonb default '{}'::jsonb;

create index if not exists idx_candidate_profiles_email on candidate_profiles (lower(email));
create index if not exists idx_job_applications_candidate_user_id on job_applications (candidate_user_id);
create index if not exists idx_job_applications_email on job_applications (lower(email));
create index if not exists idx_candidate_invites_email on candidate_invites (lower(email));
create index if not exists idx_candidate_interview_slots_application_id on candidate_interview_slots (application_id);

alter table candidate_profiles enable row level security;
alter table candidate_skills enable row level security;
alter table candidate_experience enable row level security;
alter table candidate_invites enable row level security;
alter table candidate_interview_slots enable row level security;

drop policy if exists "candidate_profiles_self_select" on candidate_profiles;
create policy "candidate_profiles_self_select"
  on candidate_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "candidate_profiles_self_upsert" on candidate_profiles;
create policy "candidate_profiles_self_upsert"
  on candidate_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "candidate_profiles_self_update" on candidate_profiles;
create policy "candidate_profiles_self_update"
  on candidate_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "candidate_skills_self_all" on candidate_skills;
create policy "candidate_skills_self_all"
  on candidate_skills for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "candidate_experience_self_all" on candidate_experience;
create policy "candidate_experience_self_all"
  on candidate_experience for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "candidate_invites_self_select" on candidate_invites;
create policy "candidate_invites_self_select"
  on candidate_invites for select
  using (accepted_by_user_id = auth.uid());

drop policy if exists "candidate_invites_allow_insert" on candidate_invites;
create policy "candidate_invites_allow_insert"
  on candidate_invites for insert
  with check (true);

drop policy if exists "candidate_interview_slots_allow_all" on candidate_interview_slots;
create policy "candidate_interview_slots_allow_all"
  on candidate_interview_slots for all
  using (true)
  with check (true);

drop policy if exists "job_posts_public_read" on job_posts;
create policy "job_posts_public_read"
  on job_posts for select
  using (status = 'published');

drop policy if exists "job_applications_candidate_read" on job_applications;
create policy "job_applications_candidate_read"
  on job_applications for select
  using (candidate_user_id = auth.uid());

drop policy if exists "job_applications_candidate_insert" on job_applications;
create policy "job_applications_candidate_insert"
  on job_applications for insert
  with check (candidate_user_id = auth.uid());

create or replace function claim_existing_candidate_applications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_claimed integer := 0;
begin
  select email into v_email from auth.users where id = auth.uid();
  if auth.uid() is null or v_email is null then
    raise exception 'Candidate session missing';
  end if;

  update job_applications
     set candidate_user_id = auth.uid(),
         portal_status = 'active',
         portal_last_viewed_at = now(),
         updated_at = now()
   where lower(email) = lower(v_email)
     and (candidate_user_id is null or candidate_user_id = auth.uid());

  get diagnostics v_claimed = row_count;
  return v_claimed;
end;
$$;

create or replace function sync_candidate_profile_snapshot(
  profile_payload jsonb,
  skills_payload jsonb default '[]'::jsonb,
  experience_payload jsonb default '[]'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Candidate session missing';
  end if;

  update job_applications
     set candidate_profile_snapshot = jsonb_build_object(
       'profile', coalesce(profile_payload, '{}'::jsonb),
       'skills', coalesce(skills_payload, '[]'::jsonb),
       'experience', coalesce(experience_payload, '[]'::jsonb)
     ),
         portal_last_viewed_at = now(),
         updated_at = now()
   where candidate_user_id = auth.uid();

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create or replace function complete_candidate_invite(invite_token text, invite_email text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite candidate_invites%rowtype;
  v_claimed integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Candidate session missing';
  end if;

  select *
    into v_invite
    from candidate_invites
   where token_hash = encode(digest(invite_token, 'sha256'), 'hex')
     and lower(email) = lower(invite_email)
     and accepted_at is null
     and (expires_at is null or expires_at > now())
   limit 1;

  if v_invite.id is null then
    raise exception 'Invite is invalid or expired';
  end if;

  insert into candidate_profiles (user_id, email, updated_at)
  values (auth.uid(), lower(invite_email), now())
  on conflict (user_id) do update
    set email = excluded.email,
        updated_at = now();

  update candidate_invites
     set accepted_at = now(),
         accepted_by_user_id = auth.uid()
   where id = v_invite.id;

  update job_applications
     set candidate_user_id = auth.uid(),
         portal_status = 'active',
         portal_last_viewed_at = now(),
         updated_at = now()
   where lower(email) = lower(invite_email)
     and (candidate_user_id is null or candidate_user_id = auth.uid());

  get diagnostics v_claimed = row_count;
  return v_claimed;
end;
$$;

create or replace function book_candidate_interview_slot(slot_id_input uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot candidate_interview_slots%rowtype;
  v_application job_applications%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Candidate session missing';
  end if;

  select *
    into v_slot
    from candidate_interview_slots
   where id = slot_id_input
     and status = 'open'
   limit 1;

  if v_slot.id is null then
    raise exception 'Interview slot is no longer available';
  end if;

  select *
    into v_application
    from job_applications
   where id = v_slot.application_id
     and candidate_user_id = auth.uid()
   limit 1;

  if v_application.id is null then
    raise exception 'Application not found for this candidate';
  end if;

  update candidate_interview_slots
     set status = 'booked',
         booked_by_user_id = auth.uid(),
         booked_at = now(),
         updated_at = now()
   where id = v_slot.id;

  update candidate_interview_slots
     set status = 'closed',
         updated_at = now()
   where application_id = v_slot.application_id
     and id <> v_slot.id
     and status = 'open';

  update job_applications
     set status = 'interview',
         updated_at = now()
   where id = v_slot.application_id;

  return jsonb_build_object(
    'slot_id', v_slot.id,
    'application_id', v_slot.application_id,
    'status', 'booked'
  );
end;
$$;
