# Design System Specification: The Ethereal Showroom

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Curator."** 

Unlike standard e-commerce platforms that overwhelm the user with dense grids and aggressive "Buy Now" signals, this system treats the luxury electric vehicle marketplace as a high-end editorial gallery. We move beyond the "template" look by utilizing intentional asymmetry, expansive white space (breathing room), and a "layered paper" philosophy. The goal is to evoke the feeling of a physical premium showroom—quiet, spacious, and meticulously composed. We prioritize the vehicle as art, using the UI as a minimalist frame that recedes to let the product shine.

---

## 2. Colors & Tonal Depth
Our palette is rooted in the contrast between "Pure Light" and the energetic "Noble Orange." We avoid heavy blacks in favor of sophisticated charcoals and warm-toned neutrals to maintain an "expensive" airiness.

### Core Palette
- **Primary (Noble Orange):** `#9d4300` (Main brand energy)
- **Primary Container:** `#f97316` (High-visibility CTAs and accents)
- **Surface (Background):** `#f8f9fb` (The "Clean Room" base)
- **Surface Container Lowest:** `#ffffff` (Pure White for elevated cards)
- **Surface Container Low:** `#f3f4f6` (Subtle sectioning)

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. Boundaries must be established through background shifts. A `surface-container-low` (`#f3f4f6`) section sitting on a `surface` (`#f8f9fb`) background provides all the definition a premium user needs. Hard lines feel "cheap" and structural; tonal shifts feel "architectural."

### The "Glass & Gradient" Rule
To add "soul" to the minimalist aesthetic, use a subtle linear gradient on primary buttons: transitioning from `primary` (`#9d4300`) to `primary-container` (`#f97316`) at a 135-degree angle. For floating navigation or overlays, apply **Glassmorphism**: use `surface` at 80% opacity with a `20px` backdrop-blur.

---

## 3. Typography: Editorial Authority
We utilize a dual-typeface system to balance technical precision with luxury editorial flair.

*   **Display & Headlines (Manrope):** Chosen for its modern, geometric construction and slightly wider stance. It conveys authority and "new-luxury" tech.
*   **Title & Body (Inter):** A high-legibility sans-serif that remains invisible, allowing the information to be consumed without friction.

### Typography Scale
- **Display LG (Manrope, 3.5rem):** Use for hero value propositions. Keep tracking at -0.02em.
- **Headline MD (Manrope, 1.75rem):** For vehicle model names or section headers.
- **Title MD (Inter, 1.125rem):** For card titles and secondary navigation.
- **Body LG (Inter, 1rem):** Main descriptive copy. Line height should be generous (1.6) to enhance airiness.
- **Label SM (Inter, 0.6875rem):** For technical specs (e.g., "0-100 km/h"). Always use uppercase with 0.05em letter spacing.

---

## 4. Elevation & Depth
In this design system, depth is a measure of "physicality." We move away from the "floating shadow" look toward **Tonal Layering**.

### The Layering Principle
Hierarchy is achieved by stacking containers. 
1.  **Level 0 (Base):** `surface` (`#f8f9fb`).
2.  **Level 1 (Sections):** `surface-container-low` (`#f3f4f6`).
3.  **Level 2 (Active Cards):** `surface-container-lowest` (`#ffffff`).
By placing a white card on a light gray section, you create a natural "lift" that feels integrated rather than pasted on.

### Ambient Shadows
Shadows are reserved for high-interaction floating elements (e.g., Modals, Floating Action Buttons).
- **Token:** `0px 12px 32px rgba(25, 28, 30, 0.04)`
- **Rule:** The shadow must be low-opacity and "tinted." Never use pure black; use a 4% opacity version of `on-surface` (`#191c1e`) to mimic natural ambient light.

### The "Ghost Border" Fallback
If a border is required for accessibility in input fields, use the `outline-variant` (`#e0c0b1`) at **20% opacity**. It should be barely perceptible—a "whisper" of a line.

---

## 5. Components

### Elegant Cards
- **Construction:** Use `surface-container-lowest` (`#ffffff`) with a corner radius of `xl` (`1.5rem`).
- **Content:** Forbid divider lines. Use `spacing-6` (`2rem`) of vertical padding to separate image, title, and price. 
- **Image Treatment:** Vehicle imagery should use a subtle `primary-fixed-dim` (`#ffb690`) inner glow to make the EV tech feel "energized."

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`), `full` (`9999px`) border radius. Text is `on-primary` (`#ffffff`).
- **Secondary:** Transparent background with a "Ghost Border" (20% `outline-variant`).
- **Interaction:** On hover, the primary button should shift 2px upward with a 4% ambient shadow.

### Input Fields
- **Style:** Minimalist underline or tonal box (`surface-container-high`).
- **State:** Active state uses a 1px `primary-container` (`#f97316`) bottom border only. 

### Signature Component: The "Spec-Strip"
Instead of a bulleted list for car specs, use a horizontal strip of `label-md` text separated by `primary` (`#f97316`) colored dots. This mimics high-end automotive brochures.

---

## 6. Do's and Don'ts

### Do:
- **Embrace Asymmetry:** Place a large headline on the left and a small supporting detail on the far right. The "void" in the middle creates luxury.
- **Use "Noble Orange" Sparingly:** It is a surgical tool, not a paint bucket. Use it for icons, CTAs, and tiny accents only.
- **Prioritize Motion:** Elements should "fade and slide" into place using ease-out durations (300ms) to mimic the smooth acceleration of an EV.

### Don't:
- **No 100% Black:** Never use `#000000`. Use `on-surface` (`#191c1e`) for text to keep the contrast soft and premium.
- **No Dense Grids:** If a row has 4 cars, increase the gutter to `spacing-8` (`2.75rem`). If it feels "too empty," you are doing it right.
- **No Default Icons:** Avoid generic, thick-stroke icon sets. Use ultra-thin (1pt or 1.5pt) line icons with `primary` accents.
