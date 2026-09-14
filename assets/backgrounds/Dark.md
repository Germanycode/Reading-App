---
name: Lumina Reader
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#43617c'
  on-secondary: '#ffffff'
  secondary-container: '#c1e0ff'
  on-secondary-container: '#46647e'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#25190c'
  on-tertiary-container: '#93816e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#abcae8'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#2b4963'
  tertiary-fixed: '#f5dfc8'
  tertiary-fixed-dim: '#d8c3ad'
  on-tertiary-fixed: '#25190c'
  on-tertiary-fixed-variant: '#534434'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: literata
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: literata
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-reading:
    fontFamily: literata
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.7'
  body-reading-mobile:
    fontFamily: literata
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-ui:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  max-width-reading: 680px
  gutter-desktop: 2rem
  gutter-mobile: 1.25rem
  stack-sm: 0.5rem
  stack-md: 1.5rem
  stack-lg: 3rem
---

## Brand & Style

The design system is centered on the concept of "The Focused Mind." It prioritizes an editorial aesthetic that mirrors the experience of reading a premium physical publication while leveraging the flexibility of digital interfaces. The brand personality is intellectual, calm, and unobtrusive, ensuring the interface recedes to allow the content to take center stage.

The style is a blend of **Minimalism** and **Editorial Design**. It utilizes generous whitespace, high-quality serif typography for long-form reading, and a structured, functional sans-serif for utility. The emotional response should be one of quiet sophistication and reduced cognitive load, making it suitable for deep work and extended reading sessions.

## Colors

This design system utilizes four distinct color modes to accommodate different environments and user preferences. Each mode is designed to maintain high legibility and comfort.

*   **Light Mode (Default):** A clean, paper-white background (`#FFFFFF`) paired with charcoal text (`#1A1A1A`) for maximum clarity during the day.
*   **Dark Mode:** A deep charcoal background (`#121212`) with soft white text (`#E0E0E0`) and muted blue accents to reduce eye strain in moderate lighting.
*   **Sepia Mode:** Inspired by vintage book stock, using a warm background (`#F4ECD8`) and dark brown text (`#5B4636`) for a nostalgic, low-contrast experience.
*   **Midnight Mode:** An OLED-friendly true black background (`#000000`) with dimmed gray text (`#A0A0A0`) and deep indigo accents for ultra-low light conditions.

Secondary and tertiary colors are used sparingly for interactive highlights (links, active states) and never for primary content.

## Typography

Typography is the foundation of this design system. It utilizes a dual-font strategy to balance utility and literary elegance.

*   **Reading Content:** Uses **Literata**, a serif specifically engineered for digital reading. The line height for body text is set to a generous 1.7x to prevent line-tracking fatigue. Paragraph spacing should be exactly one full line height.
*   **UI Elements:** Uses **Inter** for navigation, labels, and system messages. Its neutral, systematic nature provides a clear functional contrast to the reading material.
*   **Hierarchy:** Headlines use a mix of both fonts depending on the context; large display titles use the serif for an editorial feel, while functional section headers use the sans-serif for clarity.

## Layout & Spacing

The layout philosophy follows a **Fixed Column** model for content and a **Fluid** model for the surrounding interface. 

*   **Reading Column:** On desktop, the primary text column is strictly limited to a `max-width` of 680px to maintain an optimal characters-per-line count (65–75 characters). This column is centered with generous side margins.
*   **Responsive Adaptation:** On mobile devices, the layout transitions to a fluid grid with `1.25rem` side margins.
*   **Spacing Rhythm:** A base-8 scale is used for all layout decisions. Vertical rhythm is strictly enforced to ensure that reading is never interrupted by inconsistent gaps.

## Elevation & Depth

To maintain the focus on text, this design system avoids heavy shadows or complex 3D effects. Depth is conveyed through **Tonal Layers** and subtle background shifts.

*   **Surface Hierarchy:** Primary content sits on the base background. Navigation bars and sidebars use a slightly adjusted tone (darker in light mode, lighter in dark mode) to denote their position above the base layer.
*   **Outlines:** Instead of shadows, components like cards or menus use **low-contrast outlines** (1px width, 10% opacity of the text color) to define their boundaries.
*   **Interaction:** Active elements may use a very subtle "ambient shadow"—a wide, soft blur with extremely low opacity—to indicate lift during hover or focus states.

## Shapes

The shape language is organic and approachable. By using **Rounded** corners, the system avoids the harshness of sharp edges, reinforcing the theme of comfort.

*   **Small Components:** Buttons, input fields, and tags use a `0.5rem` radius.
*   **Large Components:** Modals, feature cards, and bottom sheets use `1.5rem` (`rounded-xl`) to create a softer, more modern framing for content.
*   **Consistency:** All interactive containers must share the same corner radius logic to maintain a cohesive visual rhythm.

## Components

Components are designed to be "invisible" until needed, focusing on utility and clarity.

*   **Buttons:** Primary buttons are solid-filled with the primary text color of the current mode. Secondary buttons use a ghost style with a subtle border. All buttons use the `label-sm` typographic style.
*   **Input Fields:** Minimalist in design, using only a bottom border that thickens slightly on focus. Labels sit above the field in `label-sm`.
*   **Cards:** Containers for book previews or articles use no borders and no shadows. Instead, they use a subtle background tint that is 2% different from the main canvas.
*   **Progress Indicators:** A thin, non-intrusive line at the top of the viewport or the bottom of the reading column indicates reading progress without distracting from the text.
*   **Lists:** List items are separated by generous whitespace and very faint horizontal dividers. They never use icons unless necessary for navigation.