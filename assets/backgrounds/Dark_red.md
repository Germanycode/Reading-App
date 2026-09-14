---
name: Crimson Nocturne
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
  on-surface-variant: '#e4beba'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#ab8986'
  outline-variant: '#5b403e'
  surface-tint: '#ffb3ad'
  primary: '#ffb3ad'
  on-primary: '#68000a'
  primary-container: '#ff5451'
  on-primary-container: '#5c0008'
  inverse-primary: '#b91a24'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#69d8d4'
  on-tertiary: '#003736'
  tertiary-container: '#24a09d'
  on-tertiary-container: '#00302e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3ad'
  on-primary-fixed: '#410004'
  on-primary-fixed-variant: '#930013'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#87f4f0'
  tertiary-fixed-dim: '#69d8d4'
  on-tertiary-fixed: '#00201f'
  on-tertiary-fixed-variant: '#00504e'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 42px
  headline-md:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  body-reading:
    fontFamily: EB Garamond
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 32px
  ui-label:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  ui-button:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  reading-container-max: 720px
  gutter: 24px
  margin-mobile: 20px
  section-gap: 64px
---

## Brand & Style
The design system is centered on a "Midnight Literary" aesthetic—a sophisticated, dark-mode-first approach tailored for deep immersion and focused reading. It evokes the feeling of a private library at night, illuminated by a single, sharp light source. 

The style is a hybrid of **Minimalism** and **High-Contrast**, utilizing vast expanses of charcoal black to reduce eye strain while employing aggressive crimson accents to draw attention to critical actions and editorial flourishes. The emotional response is one of gravitas, elegance, and cinematic drama.

## Colors
The palette is intentionally restrictive to maintain a moody atmosphere. The primary background is a deep, "ink" charcoal (#0a0a0a), providing a near-perfect black canvas that allows the typography to breathe. 

**Crimson Red (#ef4444)** is the sole high-energy color, used sparingly for primary buttons, active states, and editorial highlights. Secondary surfaces use a slightly lighter charcoal (#1a1a1a) to create subtle separation without breaking the dark immersion. Text is never pure white; it uses off-white and soft grays to ensure long-form reading comfort.

## Typography
This design system employs a dual-typeface strategy to balance editorial beauty with functional clarity. 

**EB Garamond** is used for all "reading" content and large headers. Its classical serifs and graceful proportions lend the system an authoritative, literary feel. For long-form body text, the line height is kept generous (1.6x) to facilitate effortless scanning.

**Inter** handles the "machinery" of the UI. It is used for navigation, buttons, labels, and data-heavy components. This sans-serif contrast ensures that functional elements feel modern and precise, preventing the classic serif font from feeling dated.

## Layout & Spacing
The layout philosophy centers on a **Fixed Reading Column** for content and a **Fluid Grid** for UI shells. 

On desktop, reading material is constrained to a 720px center-aligned container to optimize the measure (characters per line) for the human eye. Surround the content with significant negative space to minimize distractions. 

The spacing rhythm is based on a strict 8px incremental scale. Mobile layouts should reduce side margins to 20px but maintain vertical "breathing room" (section gaps) to preserve the sophisticated, airy feel of the brand.

## Elevation & Depth
In this dark environment, traditional shadows are replaced by **Tonal Layering** and **Soft Luminescence**.

Depth is created by "lifting" elements with subtle color shifts. A background is #0a0a0a, a card is #1a1a1a, and a floating menu might be #262626. To simulate a cinematic lighting effect, use ultra-fine 1px borders in a low-opacity crimson or light gray (#ffffff10) instead of heavy shadows. For high-priority elements like active buttons, a very soft, diffused red glow (outer glow) can be used to suggest a light source behind the element.

## Shapes
The shape language is consistently "Soft-Modern." A radius of **8px (roundedness: 2)** is applied to buttons, cards, and input fields. This softens the intensity of the high-contrast color palette, making the "dramatic" theme feel approachable and premium rather than harsh or aggressive. Images and avatars should follow the same rounding logic, while secondary chips or tags can utilize a pill-shape for better visual distinction.

## Components
- **Buttons:** Primary buttons are solid Crimson (#ef4444) with white text. Secondary buttons are ghost-style with a 1px crimson border.
- **Reading Cards:** Use a #1a1a1a background with no shadow and an 8px corner radius. Headlines inside cards should always be EB Garamond.
- **Input Fields:** Deep black background (#050505) with a subtle 1px gray border. On focus, the border transitions to Crimson with a faint red outer glow.
- **Progress Indicators:** Use a thin Crimson line. For reading progress, the bar should be placed at the very top of the viewport.
- **Lists:** Use subtle horizontal dividers in #1a1a1a. Interaction states (hover) should slightly lighten the row background to #1f1f1f.
- **Selection Controls:** Checkboxes and radio buttons use the Crimson primary color for the "checked" state.