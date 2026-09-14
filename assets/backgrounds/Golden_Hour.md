---
name: Golden Hour
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#d8c3ad'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#a08e7a'
  outline-variant: '#534434'
  surface-tint: '#ffb95f'
  primary: '#ffc174'
  on-primary: '#472a00'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#855300'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#8fd5ff'
  on-tertiary: '#00344a'
  tertiary-container: '#1abdff'
  on-tertiary-container: '#004966'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#c5e7ff'
  tertiary-fixed-dim: '#7fd0ff'
  on-tertiary-fixed: '#001e2d'
  on-tertiary-fixed-variant: '#004c6a'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
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
    lineHeight: 42px
  headline-md:
    fontFamily: ebGaramond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  body-reading:
    fontFamily: ebGaramond
    fontSize: 21px
    fontWeight: '400'
    lineHeight: 34px
  body-ui:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  button:
    fontFamily: inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1120px
  reading-width: 720px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is a premium, high-contrast reading environment designed for deep focus and literary immersion. It evokes the feeling of a private library at dusk—sophisticated, authoritative, and timeless. 

The aesthetic blends **Minimalism** with **Luxury Editorial** influences. By stripping away unnecessary chrome and utilizing a true-black canvas, the design system allows the typography and warm gold accents to create a sense of prestige. It targets an audience that values high-quality long-form content, intellectual rigor, and a refined digital experience.

## Colors
The palette is built on a foundation of pure black (#000000) to maximize contrast and visual comfort in dark environments. 

- **Primary:** The Gold (#f59e0b) is used sparingly for highlights, interactive states, and branding elements to maintain its premium feel.
- **Surface:** Secondary surfaces use a deep charcoal (#1a1a1a) to provide subtle separation from the background without breaking the dark immersion.
- **Typography:** Headlines and body text use high-contrast white, while metadata and secondary labels use muted grays to establish a clear information hierarchy.

## Typography
This design system employs a dual-typeface strategy to balance utility and elegance. 

- **EB Garamond** is the voice of the content. It is used for all long-form reading, titles, and editorial quotes. The reading body text is sized generously with an increased line height to ensure effortless legibility.
- **Inter** serves as the functional backbone. It handles navigation, buttons, labels, and system-level information, providing a clean, modern contrast to the classical serif content.
- **Scale:** Large display styles use tighter tracking and heavier weights to emphasize the "Golden Hour" luxury aesthetic.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for content consumption. 

- **Reading View:** The core content is constrained to a 720px column, centered on the screen to prevent eye fatigue and maintain focus.
- **UI Grid:** A 12-column grid is used for dashboard and discovery views.
- **Rhythm:** All spacing is derived from an 8px base unit. 
- **Adaptation:** On mobile, margins reduce to 16px and the grid collapses to a single column. The primary focus remains on the vertical flow of text.

## Elevation & Depth
Depth is created through **Tonal Layers** rather than shadows. 

Because the background is pure black, elevation is represented by shifting the surface color to a lighter charcoal (#1a1a1a or #262626). 
- **Level 0:** Pure Black (#000000) for the main canvas.
- **Level 1:** Deep Charcoal (#1a1a1a) for cards and persistent sidebars.
- **Overlays:** Modals and menus use a slightly lighter surface with a 1px gold-tinted border (10% opacity) to define edges against the void. 
- **Accents:** Active states are signaled by the primary gold color, creating a "glow" effect without traditional drop shadows.

## Shapes
The shape language is controlled and sophisticated. A consistent **8px corner radius** (Level 2: Rounded) is applied to buttons, input fields, and cards. This softens the high-contrast transitions between black and gold, making the interface feel approachable yet architectural. Interactive elements like chips or tags may use a full-pill radius to distinguish them from structural containers.

## Components
- **Buttons:** Primary buttons are solid Gold (#f59e0b) with Black text. Secondary buttons are outlined in 1px Gold with transparent backgrounds.
- **Reading Progress:** A thin, persistent Gold bar at the top of the viewport indicates scroll progress.
- **Cards:** Cards use the #1a1a1a surface with no border; they rely on the typography and spacing of the content within to create structure.
- **Input Fields:** Pure black background with a 1px gray-600 border, turning Gold on focus.
- **Lists:** Clean separators using #262626. For reading lists, EB Garamond is used for titles and Inter for metadata.
- **Specialty Component - "The Gilded Quote":** A blockquote component featuring a 4px Gold left-border and italicized EB Garamond text.