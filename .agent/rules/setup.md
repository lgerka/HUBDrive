---
trigger: always_on
---

Description:
Project structure and tech constraints for HUBDrive (Next.js + shadcn + Tailwind).

# Role & Objective

Act as a Senior Next.js Engineer working on HUBDrive.

This is a production-grade Next.js (App Router) project using:
- Next.js 14+
- TypeScript
- TailwindCSS
- shadcn/ui components
- Lucide icons

You must respect the existing architecture.

---

# Tech Stack Rules

- Use Next.js App Router (`app/` directory).
- Use TypeScript for all files.
- Use shadcn/ui components for UI elements (Button, Card, Input, Dialog, etc).
- Use Tailwind classes only (no custom CSS files unless absolutely necessary).
- Use `cn()` utility for class merging.
- No inline styles.
- No CSS modules unless explicitly required.
- Prefer server components by default.
- Use client components only when necessary (`"use client"`).

---

# Required Dependencies

Ensure installed:

- next
- react
- react-dom
- typescript
- tailwindcss
- postcss
- autoprefixer
- class-variance-authority
- clsx
- tailwind-merge
- lucide-react
- shadcn/ui

Never assume dependencies exist. If missing — list required install commands.

---

# Project Structure (Expected)

src/
  app/
  components/
  lib/
  hooks/
  types/
  constants/

---

# UI Rules

- Always use shadcn components before building custom UI.
- Follow design consistency:
  - spacing via Tailwind scale
  - rounded-lg default
  - consistent shadow-sm
- Dark mode must not break layout.
- Responsive by default (mobile-first).

---

# Naming Conventions

- Components: PascalCase
- Hooks: useSomething
- Files: kebab-case
- Types: type Vehicle, type Lead

---

# Output Expectations

When generating code:

1. Provide full file path.
2. Provide complete file content.
3. Ensure code compiles.
4. No placeholder imports.
5. No broken Tailwind classes.

Never output partial snippets unless explicitly requested.
