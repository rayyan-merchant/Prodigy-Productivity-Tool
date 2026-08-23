# Prodigy Public Beta Deployment Runbook

This runbook deploys the current Prodigy application to:

- Vercel for the Vite/React frontend.
- Supabase for Postgres, Auth, Storage, and Edge Functions.
- Groq for general AI assistance.
- Gemini for daily briefs and hydration insights.

Follow the stages in order. Do not deploy the database directly to production before
the staging migration, data checks, two-account RLS test, and application smoke test
have passed.

## 1. Deployment Topology

Use separate projects for staging and production:

| Environment | Frontend | Backend | Purpose |
| --- | --- | --- | --- |
| Local | `http://localhost:8080` | Staging or local Supabase | Development |
| Staging | Vercel Preview | `prodigy-staging` Supabase | Migration and release validation |
| Production | Vercel Production | `prodigy-production` Supabase | Public beta |

Record the values below in a private password manager, not in Git:

```text
STAGING_SUPABASE_REF=
STAGING_SUPABASE_URL=
STAGING_SUPABASE_PUBLISHABLE_KEY=

PRODUCTION_SUPABASE_REF=
PRODUCTION_SUPABASE_URL=
PRODUCTION_SUPABASE_PUBLISHABLE_KEY=

VERCEL_PREVIEW_URL=
PRODUCTION_DOMAIN=
```

Important: `supabase/config.toml` currently names project
`yhtrigqbisojsticvtyw`. Identify that project in the Supabase dashboard before
linking or pushing. Treat it as production until proven otherwise.

## 2. Accounts And Credentials

Prepare:

- A GitHub repository containing this branch.
- A Supabase organization with separate staging and production projects.
- A Vercel account connected to the GitHub repository.
- A Groq API key for `ai-service`.
- A Groq API key for AI assistance. This is required because `ai-service` uses
  Groq. A Gemini API key is optional only when deliberately using Gemini as the
  fallback provider for daily briefs and hydration insights.
- Two non-administrator QA email accounts.
- Optional: a custom domain and Google OAuth credentials.

Never put these in Vercel frontend variables:

- `GROQ_API_KEY`
- `GEMINI_API_KEY`

They belong only in Supabase Edge Function secrets. Only the Supabase URL and
publishable/anon key are intentionally exposed to the browser. (Note: `SUPABASE_SERVICE_ROLE_KEY` is injected automatically by Supabase into hosted Edge Functions and does not need to be set).

If a `.env` containing credentials was previously committed, remove it from Git,
rotate the affected credentials, and keep only `.env.example`.

## 3. Workstation Preparation

This repository uses Node 22 and npm. On Windows PowerShell, use the `.cmd`
executables if script execution policy blocks the PowerShell npm aliases.

```powershell
node --version
npm.cmd --version
npm.cmd ci
npx.cmd supabase --version
npx.cmd vercel --version
```

Supabase CLI can run through `npx`; a global npm installation is not required.
Docker Desktop is needed only when running a complete local Supabase stack.

Create a local `.env` for development:

```powershell
Copy-Item .env.example .env
```

Populate only:

```dotenv
VITE_SUPABASE_URL=https://STAGING_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=STAGING_PUBLISHABLE_KEY
VITE_SENTRY_DSN=
```

Before any remote deployment, establish the code baseline:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
git status --short
```

Release gate: all five commands pass and all intended source/migration changes are
committed and pushed.

## 4. Create The Staging Supabase Project

1. In Supabase, create `prodigy-staging`.
2. Choose the region closest to the expected beta users.
3. Generate and securely store a strong database password.
4. Open **Project Settings > API**.
5. Record the project URL and publishable/anon key.
6. Record the project reference from the dashboard URL.
7. Do not copy the service-role key into `.env`, GitHub, or Vercel.

### Staging Auth Configuration

In **Authentication > Providers**:

- Enable email/password.
- Require email confirmation for the public beta.
- Configure an SMTP provider before inviting external testers. The built-in email
  service is not suitable for reliable production delivery.
- Optionally configure Google only after email auth works.

In **Authentication > URL Configuration**:

- Site URL: use the staging Vercel URL after it exists.
- Redirect URLs:
  - `http://localhost:8080/**`
  - `http://127.0.0.1:4173/**`
  - `https://YOUR-VERCEL-PREVIEW-DOMAIN/**`
  - `https://YOUR-PRODUCTION-DOMAIN/**`

Prodigy sends password recovery back to `/reset-password`, so that route must be
covered by the redirect allowlist.

For Google OAuth, configure the provider callback shown by Supabase in Google Cloud.
The application itself should continue redirecting through Supabase.

## 5. Back Up Any Existing Target

Before linking to a Supabase project that contains data:

1. Confirm the project name and reference in the dashboard.
2. Confirm automated backups are available, or take a database backup.
3. Export counts for the application tables.
4. Record the migration list.

Useful pre-deployment inventory:

```sql
select 'profiles' as table_name, count(*) from public.profiles
union all select 'tasks', count(*) from public.tasks
union all select 'habits', count(*) from public.habits
union all select 'pomodoro_sessions', count(*) from public.pomodoro_sessions
union all select 'water_intake', count(*) from public.water_intake
union all select 'water_settings', count(*) from public.water_settings;
```

Save the result with the release evidence. Never run `supabase db reset` against a
hosted project containing data.

## 6. Apply Migrations To Staging

From the repository root:

```powershell
npx.cmd supabase login
npx.cmd supabase link --project-ref YOUR_STAGING_PROJECT_REF
npx.cmd supabase migration list
npx.cmd supabase db push --dry-run
npx.cmd supabase db push
npx.cmd supabase migration list
```

The migration history should end with:

```text
20260612090000_public_beta_remediation.sql
```

If the remote project already has manually applied schema changes, stop on any
migration-history mismatch. Reconcile the remote history and schema before pushing;
do not mark migrations applied merely to silence an error.

## 7. Verify The Staging Migration

Run these in the Supabase SQL Editor.

### Required Objects

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'habit_completions', 'ai_usage')
order by table_name;

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tasks'
  and column_name in ('due_on', 'status', 'completed', 'completed_at')
order by column_name;

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'handle_new_user',
    'sync_task_completion',
    'consume_ai_quota'
  )
order by routine_name;
```

### Data Backfills

The first query must return zero:

```sql
select count(*) as missing_due_on
from public.tasks
where due_date is not null and due_on is null;
```

Inspect, rather than automatically modify, any inconsistent completion records:

```sql
select id, user_id, status, completed, completed_at
from public.tasks
where (completed = true and completed_at is null)
   or (completed = false and completed_at is not null)
limit 100;
```

Confirm historical habit completion migration:

```sql
select count(*) as habits_with_legacy_completion
from public.habits
where last_completed is not null;

select count(*) as migrated_completion_rows
from public.habit_completions;
```

### Constraints, RLS, And Storage

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles', 'tasks', 'habits', 'habit_completions',
    'pomodoro_sessions', 'water_intake', 'water_settings', 'ai_usage'
  )
order by tablename;

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'avatars';
```

Expected:

- RLS is enabled on every user-owned table.
- User-owned tables have policies for the operations used by the app.
- `avatars` exists and `public` is `false`.
- The bucket accepts only the configured image types and size.

Run the inventory query from step 5 again and investigate unexpected record-count
changes before proceeding.

## 8. Configure And Deploy Edge Functions

While linked to staging:

```powershell
npx.cmd supabase secrets set GROQ_API_KEY="YOUR_GROQ_KEY"
# Optional fallback for daily-brief and hydration-insights:
# npx.cmd supabase secrets set GEMINI_API_KEY="YOUR_GEMINI_KEY"
npx.cmd supabase secrets list

npx.cmd supabase functions deploy ai-service
npx.cmd supabase functions deploy daily-brief
npx.cmd supabase functions deploy hydration-insights
npx.cmd supabase functions deploy delete-account
```

Hosted Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` to functions. Do not disable JWT verification for these
functions: all four operate on authenticated users.

### Function Acceptance Checks

Test through the signed-in staging application and inspect **Edge Functions > Logs**.

| Function | Valid input | Expected limit |
| --- | --- | --- |
| `ai-service` | `prompt`, supported `type`, optional task context | 30/day, 8-second cooldown |
| `daily-brief` | tasks, habits, sessions | 100/day, 5-second cooldown |
| `hydration-insights` | prompt up to 5,000 characters | 100/day, 5-second cooldown |
| `delete-account` | authenticated request | Deletes avatar files and auth user |

Verify:

- An unauthenticated request returns `401`.
- A normal request returns `success: true`, provider, generation time, and remaining
  quota where applicable.
- An immediate repeated request returns `429`.
- Provider failures appear as actionable errors in the UI.
- No API key, authorization header, task content, or profile content appears in logs.
- Account deletion is tested only with a disposable QA account.

## 9. Real Two-Account RLS Test

Create two confirmed non-admin users:

```text
prodigy.qa.a+RELEASE@example.com
prodigy.qa.b+RELEASE@example.com
```

Never perform this test with a service-role client; service-role access bypasses RLS.

### Account A Setup

Sign in as A and create uniquely named records:

- Task: `RLS-A-RELEASE`
- Habit: `RLS-A-HABIT-RELEASE`, then complete it today
- One completed focus session
- One 321 ml water entry
- A profile bio marker
- An avatar
- One AI request

Record the task ID and habit ID from the browser network response or Supabase SQL
Editor.

### Account B Isolation

In the same browser, log out A and sign in as B. Confirm:

- A's task, habit, completion, Pomodoro session, water entry, profile, avatar, and AI
  cache are absent.
- Browser-stored timer and preferences do not leak from A.
- B cannot open A's records using a copied URL or identifier.
- B cannot update or delete A's task or habit.
- B can create and manage its own equivalent records.

### Direct REST Proof

Obtain each user's access token from their own login response. Use the publishable
key, never the service-role key:

```powershell
$supabaseUrl = "https://YOUR_STAGING_REF.supabase.co"
$publishableKey = "YOUR_STAGING_PUBLISHABLE_KEY"
$tokenB = "ACCOUNT_B_ACCESS_TOKEN"
$taskA = "ACCOUNT_A_TASK_UUID"

$headersB = @{
  apikey = $publishableKey
  Authorization = "Bearer $tokenB"
  Prefer = "return=representation"
}

Invoke-RestMethod `
  -Method Get `
  -Uri "$supabaseUrl/rest/v1/tasks?id=eq.$taskA&select=id,title,user_id" `
  -Headers $headersB

Invoke-RestMethod `
  -Method Patch `
  -Uri "$supabaseUrl/rest/v1/tasks?id=eq.$taskA" `
  -Headers $headersB `
  -ContentType "application/json" `
  -Body '{"title":"RLS-B-MUST-NOT-WRITE"}'
```

Both responses must contain zero rows. Sign back in as A and prove the title was not
changed. Repeat the read/write isolation test for:

- `habits`
- `habit_completions`
- `pomodoro_sessions`
- `water_intake`
- `water_settings`
- `profiles`
- `ai_usage`

Also verify B cannot list, replace, or delete A's object in the private `avatars`
bucket.

Release gate: retain screenshots or request/response evidence showing isolation for
all user-owned data.

## 10. Create The Vercel Staging Deployment

1. Import the GitHub repository into Vercel.
2. Choose Vite if framework detection does not select it automatically.
3. Set:
   - Install command: `npm ci`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add Preview environment variables:
   - `VITE_SUPABASE_URL` = staging project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = staging publishable/anon key
   - `VITE_SENTRY_DSN` = optional staging DSN
5. Do not add provider or service-role secrets.
6. Deploy the branch and record the preview URL.

`vercel.json` already supplies the SPA rewrite and security headers. Confirm in the
deployed response that the CSP, frame, referrer, permissions, and content-type
headers are present.

Return to Supabase Auth URL Configuration and add the exact Vercel preview domain.
Then redeploy or retest signup, confirmation, OAuth, and password recovery.

CLI alternative:

```powershell
npx.cmd vercel login
npx.cmd vercel link
npx.cmd vercel
```

Use the dashboard for environment-variable separation unless the operator is
already comfortable with Vercel CLI scoping.

## 11. Configure GitHub CI

In **GitHub > Settings > Secrets and variables > Actions**, add staging-safe values:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

The current workflow gates:

- `npm ci`
- ESLint
- TypeScript
- Vitest
- Production build
- Playwright desktop smoke tests

Require the CI job to pass before merging to the production branch. Never add the
service-role or AI provider keys to this frontend CI workflow.

## 12. Staging Product Acceptance

Test at desktop, tablet, and 390 x 844 mobile widths.

### Authentication

- Signup explains that confirmation is required.
- Confirmation returns to the correct staging domain.
- Invalid login has a descriptive, non-sensitive error.
- Password reset returns to `/reset-password`.
- Password update works and the user can log in with the new password.
- Logout protects private routes.
- Disposable account deletion removes access and avatar data.

### Tasks

- Create and edit due dates in UTC-12, UTC, and UTC+14 without a date shift.
- New dates reject past dates; an existing overdue task can be edited without
  changing its due date.
- All status transitions synchronize `status`, `completed`, and `completed_at`.
- Reopening clears completion metadata.
- Completing a recurring task creates exactly one next occurrence.
- Tags, subtasks, recurrence, project, estimate, and long text survive editing.
- Destructive actions require confirmation.

### Habits, Timer, And Water

- Daily and weekly habit completion, undo, streak, category, and calendar history
  agree with the database.
- Focus, short break, and long break persist with normalized session types.
- Completed and interrupted Pomodoro sessions agree with analytics.
- Water accepts 1-2,000 ml, warns on unusually large values, and supports deletion.
- The progress ring clamps at 100%; over-goal progress is shown separately.

### AI, Export, Offline, And PWA

- Deterministic task order remains usable when AI is unavailable or malformed.
- Quotas, cooldowns, provider, generated time, refresh, and failures are visible.
- AI results do not leak between A and B.
- CSV, JSON, and ICS exports download, escape content, and report success/failure.
- Offline mode is clearly read-only and disables mutation controls.
- The install prompt renders once and remains dismissed for 30 days.
- PWA icons, manifest, installation, and updates work.
- Browser zoom works and 200% zoom does not hide required controls.

## 13. Lighthouse Measurement

Measure the deployed staging build, not the Vite development server.

For public pages:

1. Open the Vercel preview in a clean Chrome Incognito window.
2. Open DevTools > Lighthouse.
3. Select Mobile and all relevant categories.
4. Run at least three times and retain the median report.
5. Repeat for Desktop.

For authenticated pages, sign in first and run Lighthouse from DevTools so the
session remains available. Measure at least:

- Landing/auth page
- Dashboard
- Tasks
- Habits
- Pomodoro
- Hydration

CLI for public routes:

```powershell
npx.cmd lighthouse https://YOUR-STAGING-DOMAIN/ `
  --preset=desktop `
  --output=html `
  --output-path=./artifacts/lighthouse-desktop.html

npx.cmd lighthouse https://YOUR-STAGING-DOMAIN/ `
  --form-factor=mobile `
  --screenEmulation.mobile `
  --output=html `
  --output-path=./artifacts/lighthouse-mobile.html
```

Public-beta gates:

- Accessibility: 90 or higher.
- Best Practices: 90 or higher.
- Mobile Performance: 80 or higher.
- No serious accessibility violation.
- No horizontal overflow at 390 px or 200% zoom.

Performance scores vary. Record the URL, commit SHA, timestamp, run count, median,
and major diagnostics rather than relying on one run.

## 14. Prepare Production Supabase

Only proceed after staging is signed off.

If `yhtrigqbisojsticvtyw` is the existing production project:

- Confirm it in writing in the release record.
- Take and verify a backup.
- Run the pre-migration inventory.
- Confirm the application can tolerate additive migration deployment.

Otherwise create `prodigy-production` using the same region and auth configuration
principles as staging.

Link explicitly and verify the project reference shown by the CLI:

```powershell
npx.cmd supabase link --project-ref YOUR_PRODUCTION_PROJECT_REF
npx.cmd supabase migration list
npx.cmd supabase db push --dry-run
```

Stop if the dry run contains anything other than the reviewed repository
migrations. During the release window:

```powershell
npx.cmd supabase db push
npx.cmd supabase migration list
```

Run every SQL verification from steps 5 and 7. Compare pre/post record counts and
sample existing users' tasks, habits, sessions, and water history.

Set production secrets and deploy the functions:

```powershell
npx.cmd supabase secrets set GROQ_API_KEY="YOUR_PRODUCTION_GROQ_KEY"
npx.cmd supabase secrets set GEMINI_API_KEY="YOUR_PRODUCTION_GEMINI_KEY"
npx.cmd supabase functions deploy ai-service
npx.cmd supabase functions deploy daily-brief
npx.cmd supabase functions deploy hydration-insights
npx.cmd supabase functions deploy delete-account
```

Use separate provider keys for staging and production when the providers support it.
Run a shortened two-account RLS smoke test against production before inviting beta
users.

## 15. Promote The Frontend To Production

In Vercel, add Production-scoped variables:

```text
VITE_SUPABASE_URL=https://YOUR_PRODUCTION_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PRODUCTION_PUBLISHABLE_KEY
VITE_SENTRY_DSN=YOUR_OPTIONAL_PRODUCTION_DSN
```

Confirm Preview still points to staging. Promote the exact reviewed commit:

```powershell
npx.cmd vercel --prod
```

Or merge the protected production branch and let Vercel deploy it. Do not promote a
different commit from the one that passed CI and staging acceptance.

For a custom domain:

1. Add the domain in Vercel and configure the requested DNS records.
2. Wait for TLS issuance.
3. Set the production Supabase Auth Site URL to the canonical HTTPS domain.
4. Add the canonical domain to Auth redirect URLs.
5. Update Google OAuth authorized origins/callback configuration if enabled.
6. Verify `www`/apex redirects and choose one canonical address.

## 16. Production Smoke Test

Immediately after promotion:

- Load `/`, `/reset-password`, and a protected deep link directly.
- Create and confirm a new disposable user.
- Create, edit, complete, reopen, recur, and delete a task.
- Complete and undo a habit.
- Complete a short Pomodoro test.
- Add and delete a water entry.
- Generate one request through each AI function.
- Upload and replace an avatar.
- Download CSV, JSON, and ICS exports.
- Log out, refresh, and confirm protected data is inaccessible.
- Check Vercel logs, Supabase database/API logs, Auth logs, and Function logs.
- Confirm no service-role key or provider key appears in browser bundles or network
  responses.

Keep the release operator available during the initial beta invitation period.

## 17. Monitoring And Incident Response

Monitor:

- Vercel deployment/runtime errors and Web Analytics if enabled.
- Supabase Auth failures, database/API errors, storage failures, and function logs.
- Function `401`, `429`, timeout, and provider-error rates.
- `ai_usage` growth by feature without inspecting private user content.
- Optional Sentry-compatible frontend errors and release SHA.

For an incident:

1. Stop new beta invitations.
2. Capture the affected URL, user ID, timestamp, request ID, and release SHA.
3. Roll Vercel back to the previous healthy deployment if the frontend caused it.
4. Redeploy the previous function version if an Edge Function caused it.
5. Because production migrations are additive, prefer a forward corrective
   migration. Do not drop new columns/tables while old and new clients may coexist.
6. Use database restore only for confirmed destructive data corruption, with the
   resulting downtime and data-loss window explicitly understood.
7. Rotate any credential suspected of exposure.

## 18. Final Release Record

The release is complete only when this evidence exists:

```text
[ ] Reviewed commit SHA:
[ ] CI run URL:
[ ] Staging Vercel URL:
[ ] Staging Supabase project ref:
[ ] Migration dry-run reviewed:
[ ] Migration list verified:
[ ] Pre/post database counts retained:
[ ] Two-account RLS evidence retained:
[ ] Edge Function tests passed:
[ ] Desktop/tablet/mobile acceptance passed:
[ ] Lighthouse mobile median:
[ ] Lighthouse desktop median:
[ ] Production backup verified:
[ ] Production Supabase project ref:
[ ] Production Vercel deployment URL:
[ ] Custom domain/TLS verified:
[ ] Production smoke test passed:
[ ] Rollback owner and previous deployment identified:
```

## Official References

- Supabase CLI: https://supabase.com/docs/guides/local-development/cli/getting-started
- Supabase database migrations: https://supabase.com/docs/guides/deployment/database-migrations
- Supabase Edge Function deployment: https://supabase.com/docs/guides/functions/deploy
- Supabase Edge Function secrets: https://supabase.com/docs/guides/functions/secrets
- Vercel Vite deployment: https://vercel.com/docs/frameworks/frontend/vite
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Lighthouse overview: https://developer.chrome.com/docs/lighthouse/overview
