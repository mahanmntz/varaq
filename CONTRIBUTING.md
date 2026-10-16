# Contributing

Varaq is built for friends and small communities, so prefer **simple, low-friction** features over enterprise machinery. Read the [README](README.md) first: it explains the layout, the architecture rules and where each kind of change belongs.

## Ground rules

| Area                                                                                | Rule                                                                                                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Code, comments, docs, commit messages, API routes, OpenAPI                          | **English**                                                                                                               |
| Everything users see in the web app (labels, buttons, toasts, errors, empty states) | **Natural, modern Persian**, RTL                                                                                          |
| Privacy                                                                             | No photo uploads, no exact locations, never store a raw phone number, never expose private identity fields to other users |

New API error codes need a Persian message in `apps/web/lib/labels.ts`.

## Setup

```bash
cp .env.example .env
pnpm install
pnpm infra && pnpm db:deploy && pnpm db:seed
pnpm dev
```

## Before opening a PR

```bash
pnpm format
pnpm typecheck
pnpm test
```

CI runs the same checks plus a web build and a migrations/seed run against Postgres.

## Backend conventions

- Keep the module structure (`repository` → `service` → `routes`). Don't import another module's repository; depend on its service and wire it in `src/app.ts`.
- Atomic cross-module writes take an optional `tx`.
- Put request/response schemas the web app also needs in `packages/shared`.
- Keep rules that can be pure free of I/O and unit-test them (see `loan-state-machine.ts`).
- Schema change: edit `schema.prisma`, run `pnpm db:migrate`, and keep the hand-written SQL (extensions, indexes, constraints) in the migrations.
- Never build public user data from a whole database row; add fields explicitly to `toPublicUser`.

## Frontend conventions

- Mobile first. Use logical Tailwind utilities (`ms-*`, `ps-*`, `start-*`, `text-start`) instead of left/right so RTL works.
- Colours come from the CSS variables in `app/globals.css`; check light and dark themes.
- Wrap mutations in `mutate()` from `lib/use-api.ts` and import `toast` from `@/lib/notify`.
- Show other people by first name (`displayName`), not by username.
- Digits shown to users go through `toFaDigits`; dates through `formatDate` (Jalali).

## Commits and PRs

Use [Conventional Commits](https://www.conventionalcommits.org) in English, for example `feat(circulation): lock PIN after 5 attempts`. Explain what changed and why. For UI changes include a screenshot at mobile width.
