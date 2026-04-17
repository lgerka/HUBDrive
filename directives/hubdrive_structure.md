# HUBDrive Project Structure & Tech Stack

## Description
HUBDrive project structure, dependencies, and coding constraints (Next.js App Router + shadcn + Tailwind).

## Tech Stack
- Next.js (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- lucide-react
- clsx + tailwind-merge + class-variance-authority
- cn() helper for class merging

## Dependency Rule
Never assume deps exist.
If something is required, explicitly list install commands.

Expected deps:
- tailwindcss postcss autoprefixer
- lucide-react
- clsx tailwind-merge class-variance-authority
- shadcn/ui components (generated into components/ui)

## Project Structure (preferred)
src/
  app/                (routes, layouts)
  components/ui/      (shadcn)
  components/hubdrive/ (feature UI)
  lib/                (business logic helpers)
  server/             (server-only logic, actions, integrations)
  types/              (shared types)

## UI Rules
- Prefer shadcn components over custom HTML.
- No inline styles.
- Responsive by default.
- Dark mode must not break.

## Business Rules
- All calculations live in src/lib (or src/server when appropriate).
- UI consumes typed outputs from src/types.
- No “magic numbers” in components.
