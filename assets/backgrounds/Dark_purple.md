---
name: Twilight Narrative
colors:
  surface: '#14121a'
  surface-dim: '#14121a'
  surface-bright: '#3a3840'
  surface-container-lowest: '#0e0d14'
  surface-container-low: '#1c1b22'
  surface-container: '#201f26'
  surface-container-high: '#2a2931'
  surface-container-highest: '#35343c'
  on-surface: '#e5e1eb'
  on-surface-variant: '#c9c4d3'
  inverse-surface: '#e5e1eb'
  inverse-on-surface: '#312f37'
  outline: '#938f9d'
  outline-variant: '#484552'
  surface-tint: '#c9beff'
  primary: '#c9beff'
  on-primary: '#311c7e'
  primary-container: '#9d8df1'
  on-primary-container: '#331f80'
  inverse-primary: '#6050af'
  secondary: '#cdbefa'
  on-secondary: '#34285a'
  secondary-container: '#4b3f72'
  on-secondary-container: '#bbade8'
  tertiary: '#cac2e0'
  on-tertiary: '#312d45'
  tertiary-container: '#9d97b3'
  on-tertiary-container: '#342f47'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e6deff'
  primary-fixed-dim: '#c9beff'
  on-primary-fixed: '#1b0062'
  on-primary-fixed-variant: '#483795'
  secondary-fixed: '#e8deff'
  secondary-fixed-dim: '#cdbefa'
  on-secondary-fixed: '#1f1244'
  on-secondary-fixed-variant: '#4b3f72'
  tertiary-fixed: '#e6defd'
  tertiary-fixed-dim: '#cac2e0'
  on-tertiary-fixed: '#1c192f'
  on-tertiary-fixed-variant: '#48445c'
  background: '#14121a'
  on-background: '#e5e1eb'
  surface-variant: '#35343c'
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: EB Garamond
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-reading:
    fontFamily: Literata
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
  body-ui:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max-width: 1200px
  reading-width: 720px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

This design system centers on a "Nocturnal Reading" experience, prioritizing long-form immersion and visual comfort during low-light hours. The personality is scholarly, quiet, and premium, evoking the feeling of a private library at midnight. 

The aesthetic blends **Minimalism** with subtle **Glassmorphism**. By using a "Twilight" palette, the UI recedes into the background to let the content lead. Surfaces are treated as semi-translucent layers of deep violet glass, allowing for a sense of atmospheric depth without the harshness of pure black interfaces. The emotional response should be one of calm focus and intellectual elegance.

## Colors

The palette is anchored by "Obsidian Purple," a background color that is darker than typical charcoal but retains a cool, purple-tinted soul. 

- **Primary (Muted Violet):** Used for active states, highlights, and primary calls to action. It is desaturated to prevent retinal fatigue.
- **Secondary (Deep Indigo):** Utilized for secondary buttons and subtle accents that distinguish UI elements from the deep background.
- **Surface (Atmospheric Layers):** Backgrounds are `#0C0B12`. Higher elevation elements use `#2E2A41` with slight transparency.
- **Typography:** Body text uses a Pale Lavender (`#E6E1F0`) to provide high legibility while softening the "vibration" often caused by pure white text on dark backgrounds.

## Typography

The typography strategy employs a dual-personality approach:
1.  **Editorial Expression:** `EB Garamond` is used for display titles and chapter headings, providing a timeless, literary authority.
2.  **Reading Utility:** `Literata` is the workhorse for long-form body text. Its optimized x-height and stroke contrast make it ideal for extended reading on digital screens.
3.  **Interface Precision:** `Inter` is used for all functional UI elements (labels, buttons, inputs) to maintain a systematic and modern feel.

For body text, ensure line lengths are restricted to 60-75 characters to maximize readability.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** for content-heavy views to ensure the reading experience remains centered and stable. 

- **Desktop:** 12-column grid with a narrowed central column (720px) specifically for reading tasks.
- **Mobile:** Single column with 16px margins to maximize screen real estate for text.
- **Spacing Rhythm:** Based on an 8px base unit. Vertical rhythm is critical; use generous whitespace between sections to reduce cognitive load, reflecting the "quiet" brand personality.

## Elevation & Depth

Visual hierarchy in this design system is achieved through **Tonal Layers** and **Backdrop Blurs**. 

Instead of traditional drop shadows, which can feel muddy on very dark backgrounds, elevation is communicated by lightening the fill color of the surface (the "closer" the object is to the user, the lighter the violet-grey tint becomes). 

For floating elements like menus or modals, use a 20px backdrop blur with a 40% opaque secondary color fill. This creates a "frosted indigo glass" effect that maintains the nocturnal atmosphere while providing clear separation from the content below.

## Shapes

The shape language is **Soft** and understated. A 0.25rem (4px) base radius is applied to smaller components like inputs and tags, while cards and containers utilize a 0.5rem (8px) radius. 

This subtle rounding keeps the interface feeling approachable and modern without leaning into the playfulness of more aggressive "pill-shaped" designs. Interactive elements like buttons may use slightly more rounding (0.75rem) to signify touchability.

## Components

- **Buttons:** Primary buttons use the Muted Violet fill with dark text for high contrast. Secondary buttons use a Deep Indigo outline with Pale Lavender text.
- **Reading Progress:** Use a thin, 2px Primary Violet bar at the top of the viewport or a subtle circular stroke around a "back to top" icon.
- **Cards:** Background should be one step lighter than the page background (`#2E2A41`) with a 1px border of the same color at 50% opacity to define edges.
- **Input Fields:** Use a dark-filled style (`#0C0B12`) with a subtle bottom border in Secondary Indigo. Focus states should transition the border to Primary Violet with a very soft outer glow.
- **Chips/Tags:** Small, pill-shaped elements with a Secondary Indigo background and small-cap `Inter` labels for metadata like "History" or "Philosophy."
- **Lists:** Use subtle dividers (1px, 10% opacity Pale Lavender) and ensure ample vertical padding (16px+) to respect the literary aesthetic.