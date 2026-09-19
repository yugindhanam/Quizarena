# QuizArena

A responsive exam and quiz platform built with Next.js, React, TypeScript, Tailwind CSS, Prisma, and PostgreSQL. Includes a ready-to-run local demo with six sample quizzes, an interactive dashboard, creator tools, timed exams, server scoring, answer review, live leaderboards, and analytics.

## Run locally

Requires Node.js 22 or newer.

```sh
npm install
cp .env.example .env
npm run db:generate
npm run dev
```

On Windows use `Copy-Item .env.example .env`. Open http://localhost:3000. Local mode works without PostgreSQL and seeds itself on the first API request. It writes to `.data/store.json` using a serialized queue and atomic file replacement. Use only one application process in this mode.

Demo creator: `demo@quizarena.app` / `QuizArena123!`.

Try quiz code `QZ48291` as a guest, or register a new account. The home page is an interactive workspace preview; `/about` provides the public marketing page and features. Creator and account actions require authentication.

## PostgreSQL

1. Create a PostgreSQL database and set `DATABASE_URL` in `.env`.
2. Set `DATA_MODE=postgres` and a randomly generated `SESSION_SECRET` of at least 32 characters.
3. Run:

```sh
npm run db:migrate
npm run db:seed
npm run dev
```

The checked-in initial migration creates User, Quiz, Question, Option, QuizAttempt, and ParticipantAnswer, including foreign keys, unique quiz codes, and query indexes. The seed command is idempotent. Avoid seeding the publicly documented demo credentials into a real production deployment; create your own account instead.

The PostgreSQL adapter serializes mutations using an advisory transaction lock. It currently loads the application state within each transaction; this provides straightforward consistent behavior for a small deployment. For high traffic, replace this adapter with scoped Prisma queries and per-attempt transaction locks, and paginate results. PostgreSQL requires a running external database; automated checks in this workspace use local mode.

## Complete flow

1. Sign up or log in. Choose **Create Quiz**.
2. Add quiz details, a duration, optional schedule, and multiple choice questions. Select one correct option per question. Set positive marks and optional negative marks.
3. Add, duplicate, reorder, or remove questions. Choose score/answer visibility, guest access, shuffling, leaderboard visibility, and attempt limits.
4. Publish or save a draft. Copy the generated code or quiz link from the results page or **My Quizzes → Share**.
5. Participants use **Join Quiz**, review the instructions, and start. Answers save on selection; the server persists the deadline and question/option order. Refreshing resumes the same attempt.
6. Submit manually after confirmation, or let the countdown finish. The server validates selected options and calculates the score. Repeated submissions cannot change a completed attempt.
7. Review the permitted results and answers, view the leaderboard, or open creator analytics and export CSV.

Quizzes with attempts cannot have their questions edited, preserving historical grading. Duplicate the quiz to create a revised edition. Publishing/unpublishing remains available. Deleting a quiz deletes its attempts with a confirmation.

## Authentication and exam integrity

- Passwords use bcrypt. Authentication uses signed, expiring JWTs in HTTP-only SameSite cookies via `jose` (custom authentication rather than Auth.js). Cookies are secure in production. Logout clears the session cookie.
- Zod validates inputs; server routes enforce creator ownership and attempt ownership.
- Correct-answer flags and awarded marks are stripped from active attempts. Quiz previews never contain questions. Results honor creator visibility settings.
- Deadlines, availability windows, maximum attempts, option membership, and grading are enforced by the server. Late submissions use previously saved answers. Expired attempts are finalized on the next API request, even if the participant closes the page.
- Guests are identified by an HTTP-only browser cookie. Clearing that cookie creates a new guest identity; require accounts when durable per-person attempt limits matter.
- Leaderboards refresh every 10 seconds and rank attempts by score, shorter completion time, then earlier submission. Multiple permitted attempts occupy separate rows.
- The pass rate uses a 50% threshold. Percentages are floored at zero when negative marks produce a negative raw score.
- Before a public high-traffic rollout, add distributed rate limiting, email verification/recovery, operational monitoring, and backups. These services are not bundled.

## Deployment to Vercel

1. Push the repository and import it into Vercel as a Next.js project.
2. Provision PostgreSQL and set `DATABASE_URL`, `DATA_MODE=postgres`, and `SESSION_SECRET` in Vercel.
3. Run `npm run db:migrate` against the deployment database from CI or a trusted terminal. Seed only if you deliberately want the demo data.
4. Use `npm run build` as the build command; Prisma Client is generated automatically. Deploy with the Node.js runtime.

The local file adapter is not suitable for Vercel's ephemeral filesystem. No deployment is performed by this repository setup.

## Validation

```sh
npm run typecheck
npm run build
npx playwright install chromium
# With npm run dev running in another terminal:
npm test
```

Tests cover creator registration, publishing, guest joining, ownership restrictions, answer privacy, forged options, server-side scoring, repeat submissions, attempt limits, responsive navigation, filtering, persisted answers after refresh, and submission through the browser. Screenshots are written to `test-results/`.

## Structure

```text
src/app/              App Router pages and API entrypoint
src/components/       Dashboard, shell, quiz editor, exam, results, leaderboard
src/lib/              Domain types, persistence, authentication, grading, seed
prisma/               PostgreSQL schema and initial migration
scripts/              Database seed command
tests/                Playwright API and browser integration tests
```

Included extras: quiz search and categories, duplication, copyable links, CSV exports, randomized questions/options, fullscreen exams, tab-switch notices, answer autosave, live leaderboards. QR codes, dark mode, certificates, question banks, quiz passwords, and email recovery are not implemented.
