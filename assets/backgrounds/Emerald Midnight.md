---
name: Emerald Midnight
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#68dba9'
  on-secondary: '#003825'
  secondary-container: '#25a475'
  on-secondary-container: '#00311f'
  tertiary: '#ffb3af'
  on-tertiary: '#650911'
  tertiary-container: '#fc7c78'
  on-tertiary-container: '#711419'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3af'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#842225'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: ebGaramond
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: ebGaramond
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: ebGaramond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-sm:
    fontFamily: ebGaramond
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-reading:
    fontFamily: ebGaramond
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 32px
  body-reading-mobile:
    fontFamily: ebGaramond
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  ui-medium:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  ui-small:
    fontFamily: inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 720px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 40px
  section-gap: 64px
---

## Brand & Style

The design system is centered on the concept of "Atmospheric Focus." It is tailored for long-form reading and intellectual deep-work, targeting an audience that values luxury, quietude, and digital minimalism.

The visual style is a blend of **High-Contrast Minimalism** and **Glassmorphism**. By pairing an absolute obsidian base with vibrant emerald accents, the UI creates a sense of infinite depth. The aesthetic evokes the feeling of a private library at night—sophisticated, calm, and prestigious. The emotional response should be one of "effortless immersion," where the interface recedes to let the content breathe, punctuated only by jewel-toned interactive elements.

## Colors

The palette is strictly controlled to maintain a "midnight" atmosphere. 

- **The Void (#080808):** Used for the primary background to minimize light emission and maximize focus.
- **Emerald Primary (#10b981):** A vibrant, high-saturation green used exclusively for primary actions, focus states, and progress indicators.
- **Deep Emerald (#059669):** Used for secondary interactive states and subtle accents.
- **Glass Surfaces:** Semi-transparent layers of `#121212` with varying opacities are used to create structural hierarchy without breaking the dark immersion.
- **Typography:** Primary text uses an off-white to reduce eye strain, while secondary text utilizes muted slates.

## Typography

This design system employs a dual-font strategy to balance literary elegance with technical precision.

- **Content (EB Garamond):** All long-form reading material, headlines, and quotes utilize this classic serif. It provides the "luxe" feel and ensures maximum legibility for extended sessions. Use generous line heights (1.6x) for body text.
- **Interface (Inter):** All functional UI elements—buttons, navigation, metadata, and labels—use Inter. It provides a sharp, modern contrast to the serif content, signaling "tooling" versus "reading."
- **Scale:** Maintain a clear distinction between display titles (which should feel editorial) and functional UI text (which should feel systematic).

## Layout & Spacing

The layout philosophy follows a **Centered Content Model**. 

- **Reading Well:** For the primary reading experience, content is constrained to a max-width of 720px to maintain optimal line lengths (60-75 characters).
- **Grid:** Use a 12-column fluid grid for dashboard views, but revert to a single-column focused layout for the reading mode.
- **Rhythm:** Spacing is strictly based on an 8px scale. Use large vertical gaps (64px+) between major sections to emphasize the minimalist, "airy" aesthetic despite the dark theme.
- **Responsive:** On mobile, margins reduce to 20px, and the serif typography scales down slightly to ensure headers don't wrap aggressively.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Background Blurs** rather than traditional heavy shadows.

- **Base Level:** `#080808` (The canvas).
- **Surface Level:** `#121212` with a subtle 1px border of `rgba(255, 255, 255, 0.05)`. This level is used for cards and navigation bars.
- **Overlay Level:** Glassmorphic panels with `backdrop-filter: blur(12px)` and a background of `rgba(18, 18, 18, 0.8)`. Used for floating menus and modals.
- **Accents:** Inner glows (box-shadow: inset) are used on active emerald elements to give them a "jewel-like" crystalline appearance.

## Shapes

The shape language is refined and consistent. A standard **8px (0.5rem)** radius is applied to all primary UI components, including input fields, buttons, and cards. 

- **Buttons:** Use the standard 8px radius.
- **Cards:** Use 16px (rounded-lg) for larger containers to create a softer, more premium feel.
- **Inputs:** Maintain the 8px radius for a structured, modern look.
- **Selection Sprites:** Text highlights and small tags should use a 4px (soft) radius to keep them distinct from structural elements.

## Components

- **Buttons:** Primary buttons are solid Emerald (#10b981) with black text. Secondary buttons are ghost-style with an emerald border and text.
- **Reading Progress:** A thin (2px) emerald line fixed to the top of the viewport.
- **Cards:** Background of #121212, 1px border of white at 5% opacity, and 16px corner radius. No shadows.
- **Input Fields:** Darker than the surface (#0a0a0a), emerald focus ring (2px solid), with labels in Inter Bold (uppercase, 12px).
- **Chips/Tags:** Small, Inter-based labels with a deep emerald background at 10% opacity and emerald text.
- **The "Zen" Toggle:** A specific component to hide all UI elements except for the EB Garamond text, leaving only a subtle emerald "exit" icon in the periphery.