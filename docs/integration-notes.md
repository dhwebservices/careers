# Integration Notes

## Website changes

- Keep the public careers landing page and role detail pages on the company website.
- Update the website apply CTA to send signed-in candidates to the candidate portal route:
  - `/apply/:slug` for authenticated candidates
  - `/login` for unauthenticated candidates
- If preferred, the public website can deep-link directly to:
  - `https://careers.dhwebsiteservices.co.uk/jobs/:slug`

## Staff portal changes

The staff portal should remain the internal recruiting workspace, but add:

- candidate account status on application profiles
- resend invite action
- invite token generation
- portal completion indicator
- candidate profile summary card
- candidate skills and experience viewer
- direct link to candidate-linked applications

## Existing applicant invite flow

1. Recruiter clicks `Invite to portal` inside the staff recruiting workspace.
2. Staff portal creates a random token.
3. Staff portal stores `sha256(token)` in `candidate_invites`.
4. Staff portal emails the applicant a link to:
   - `https://careers.dhwebsiteservices.co.uk/invite/<raw-token>`
5. Candidate creates their password.
6. Candidate portal calls `complete_candidate_invite(token, email)`.
7. Existing `job_applications` rows with the same email become linked to that auth user.

## New applicant flow

1. Candidate signs up in the portal.
2. Candidate completes profile.
3. Candidate applies to a role through the multi-step application flow.
4. Application is inserted into `job_applications` with `candidate_user_id` set.
5. Staff team reviews it inside the current recruitment workspace.
