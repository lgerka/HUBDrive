---
page: notifications-empty
---
A screen showing the "Empty State" for the user's notifications in a car purchasing super-app (HUBDrive).

**DESIGN SYSTEM (REQUIRED):**
# Design System Specification: The Ethereal Showroom

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Curator."** 
Unlike standard e-commerce platforms that overwhelm the user with dense grids and aggressive "Buy Now" signals, this system treats the luxury electric vehicle marketplace as a high-end editorial gallery. We move beyond the "template" look by utilizing intentional asymmetry, expansive white space (breathing room), and a "layered paper" philosophy. The goal is to evoke the feeling of a physical premium showroom—quiet, spacious, and meticulously composed. We prioritize the vehicle as art, using the UI as a minimalist frame that recedes to let the product shine.

## 2. Colors & Tonal Depth
Our palette is rooted in the contrast between "Pure Light" and the energetic "Noble Orange." We avoid heavy blacks in favor of sophisticated charcoals and warm-toned neutrals to maintain an "expensive" airiness.
- **Primary (Noble Orange):** `#9d4300` (Main brand energy)
- **Primary Container:** `#f97316` (High-visibility CTAs and accents)
- **Surface (Background):** `#f8f9fb` (The "Clean Room" base)
- **Surface Container Lowest:** `#ffffff` (Pure White for elevated cards)
- **Surface Container Low:** `#f3f4f6` (Subtle sectioning)
- **Tonal Layering:** Hierarchy is achieved by stacking containers (Level 0: surface, Level 1: surface-container-low, Level 2: surface-container-lowest).
- No 1px solid borders. NO 100% Black.

**Page Structure:**
1. Header with navigation (Back button, Title "Уведомления", Settings icon in the top right).
2. Empty state view: A spacious, perfectly centered graphic (e.g. a beautiful bell icon or mailbox with a subtle glow using `primary-fixed-dim`).
3. Headline MD (Manrope): "Здесь пока тихо" (No notifications yet).
4. Body LG (Inter): "Мы обязательно сообщим, когда появятся важные обновления по вашим заказам или изменятся цены на авто из избранного."
5. Primary Button (Gradient fill `primary` to `primary-container`): "Перейти в каталог".
