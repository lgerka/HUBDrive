# Design System: HUBDrive
**Project ID:** 15420168746026509113

## 1. Visual Theme & Atmosphere
HUBDrive features a high-contrast, modern, and utilitarian aesthetic. While the core theme leans towards dark mode accents, it utilizes a clean, open layout with high legibility. The mood is professional, dense with information, yet airy enough to allow easy scannability of vehicle specifications and system notifications. It relies heavily on neutral slate tones with vibrant primary color pops to guide user attention.

## 2. Color Palette & Roles
* **Azure Blue / Primary** (#135BEC): Used for primary actions, active states, key icons, and important text highlights. It provides a sharp, energetic contrast against neutral backgrounds.
* **Pure White** (#FFFFFF): Used for high-contrast text on dark backgrounds and primary surface backgrounds in light contexts.
* **Deep Carbon / Slate 900** (#0F172A): Used for primary typography, deep background elements, and high-contrast containers.
* **Muted Slate / Slate 400-500** (#64748B - #94A3B8): Assigned to secondary text, subtitles, and inactive icons to establish clear visual hierarchy without drawing focus.
* **Whisper Gray / Slate 100-200** (#E2E8F0 - #F1F5F9): Used for subtle borders, dividers, and faint background layers to separate content zones cleanly.

## 3. Typography Rules
* **Font Family:** Inter (Sans-serif)
* The typographic scale is highly structured, relying primarily on `text-sm` for dense body content to maximize information density on mobile screens.
* **Headers & Titles:** Utilize `font-bold` heavily across various sizes (from `text-lg` to `text-3xl`) to create unmistakable section boundaries.
* **Body & Data:** Defaults to `text-sm` with `font-medium` or `font-normal`.
* **Microcopy:** Uses `text-[10px]` and `text-xs` for very small tags, statuses, and secondary labels.

## 4. Component Stylings
* **Buttons:** Standardized with subtly rounded corners (`rounded-lg` or 8px block radius). Primary buttons utilize the Azure Blue background with white text.
* **Cards/Containers:** Feature moderately rounded corners (`rounded-xl` or `rounded-lg`) to soften the dense data presentation. Surfaces mostly rely on structural borders (`border-slate-100` or `border-slate-200`) rather than heavy shadows, though subtle elevations (`shadow-sm`) are used to lift interactive cards.
* **Badges/Tags:** Pill-shaped (`rounded-full`) for quick visual scanning of statuses or categories.
* **Inputs/Forms:** Clean, bordered structures, utilizing subtle slate rings (`border-slate-200` and `ring-primary`) upon focus.

## 5. Layout Principles
* **Whitespace Strategy:** The layout employs structural dividers (`border-b`, `border-t`, `divide-y`) to separate list items and cards, allowing for a dense but organized space.
* **Alignment:** Heavily utilizes flexbox for tight grouping of icons and text. Follows a mobile-first flow with well-padded edges (typically standard Tailwind container padding) to keep content structured and highly readable.
