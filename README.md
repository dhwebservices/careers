# DH Careers Candidate Portal

Candidate-facing recruitment portal for DH Website Services.

## What this repo includes

- Candidate sign in and sign up flow using Supabase Auth
- Candidate dashboard with linked applications and live roles
- Candidate profile area for personal details, NI number, skills, and experience
- Guided multi-step application flow
- Candidate interview booking flow with confirmation emails
- Invite activation page for existing applicants
- Supabase migration to add candidate profile tables, application linking, and invite support

## Environment

Create a `.env` file with:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PORTAL_BASE_URL=http://localhost:5173
VITE_WORKER_URL=https://dh-email-worker.aged-silence-66a7.workers.dev
```

## Run locally

```bash
npm install
npm run dev
```

## Database

Run the migration in `supabase/migrations/20260407_candidate_portal.sql`.

This migration:

- adds `candidate_profiles`, `candidate_skills`, `candidate_experience`, and `candidate_invites`
- links `job_applications` to candidate auth users
- adds RPCs for claiming historic applications and completing invite activation
- starts moving recruiting data toward candidate-safe RLS

## Important integration notes

- The public website should keep job discovery and marketing pages.
- The staff portal should keep the internal recruiting workspace.
- This repo is the candidate-facing product surface.
- Existing applicants should be invited with a tokenized link to `/invite/:token`.
- Staff portal work is still needed to manage invites, candidate accounts, and portal status from the recruitment workspace.
