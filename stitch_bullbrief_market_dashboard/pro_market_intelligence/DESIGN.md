---
name: Pro Market Intelligence
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#bccbb9'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#869585'
  outline-variant: '#3d4a3d'
  surface-tint: '#4ae176'
  primary: '#4be277'
  on-primary: '#003915'
  primary-container: '#22c55e'
  on-primary-container: '#004b1e'
  inverse-primary: '#006e2f'
  secondary: '#bec6e0'
  on-secondary: '#283044'
  secondary-container: '#3f465c'
  on-secondary-container: '#adb4ce'
  tertiary: '#ffb3b7'
  on-tertiary: '#67001b'
  tertiary-container: '#ff8892'
  on-tertiary-container: '#840025'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6bff8f'
  primary-fixed-dim: '#4ae176'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#005321'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: anybody
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
  headline-lg:
    fontFamily: anybody
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: anybody
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: jetbrainsMono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
  label-sm:
    fontFamily: jetbrainsMono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: anybody
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-margin: 1rem
  gutter: 1rem
  card-padding: 1.25rem
  stack-gap: 0.75rem
---

## Brand & Style

The design system is engineered for the high-stakes environment of stock market analysis and real-time financial news. It targets an audience of professional traders and serious retail investors who require speed, precision, and clarity.

The visual style is **Corporate / Modern** with a high-performance edge. It utilizes a dark-mode-first approach to reduce eye strain during extended market sessions. The aesthetic emphasizes "kinetic energy" through the use of aggressive italics in display typography and high-contrast color shifts to signal market movement. The UI is dense but organized, prioritizing data legibility and rapid information scanning.

## Colors

This design system utilizes a high-contrast dark palette designed for visibility and semantic clarity.

- **Primary (#22C55E):** The "Bull" green. Used for "up" trends, primary CTA buttons, and success states. It represents growth and action.
- **Secondary (#0F172A):** The "Deep Charcoal" base. Used for the primary background to provide depth and contrast for data layers.
- **Tertiary (#F43F5E):** The "Bear" red. Used for "down" trends, alerts, and critical errors.
- **Neutral (#94A3B8):** A cool slate grey used for secondary text, borders, and inactive states to ensure the primary colors remain the focus.

Surface colors should use increments of the secondary hex (e.g., #1E293B) to define nested containers and cards.

## Typography

The typography system is built on a hierarchy of speed and technical precision.

- **Display & Headlines:** Use **Anybody**. Its variable nature and aggressive italics mirror the "BullBrief" wordmark, conveying momentum. Bold, italicized weights are reserved for market-moving headlines and price actions.
- **Body:** Use **Geist**. This sans-serif provides exceptional legibility for long-form news briefs and stock descriptions, maintaining a clean, modern look.
- **Data & Labels:** Use **JetBrains Mono**. A monospaced font is used for all numerical data, stock tickers, and timestamps. This ensures that columns of numbers align perfectly, allowing users to scan price changes without visual jitter.

## Layout & Spacing

The design system employs a **Fluid Grid** model optimized for a Progressive Web App (PWA) experience. 

- **Grid:** A 12-column grid on desktop, scaling to 1 column on mobile.
- **Rhythm:** An 8px base unit is used for general spacing, while a tighter 4px unit is used for dense data components (like watchlists).
- **Safe Areas:** Mobile layouts must respect a 16px (1rem) horizontal margin.
- **Density:** High-density layouts are preferred. Information should be packed efficiently, using semantic grouping rather than excessive whitespace to create separation.

## Elevation & Depth

Hierarchy in this design system is established through **Tonal Layers** rather than heavy shadows, maintaining a sleek, "glass" dashboard feel.

- **Base Layer:** The deepest charcoal (#0F172A).
- **Surface Layer:** Elevated cards use a slightly lighter tint (#1E293B) with a subtle 1px border (#334155) to define boundaries.
- **Interactivity:** On hover or focus, surfaces should use a low-opacity primary green glow (e.g., `drop-shadow(0 0 8px rgba(34, 197, 94, 0.2))`) to signal state without breaking the flat professional aesthetic.
- **Overlays:** Modals and dropdowns use a background blur (12px) to maintain context while isolating the user's focus.

## Shapes

The shape language is **Soft (0.25rem)**. 

While the typography is aggressive and slanted, the container shapes are strictly geometric with minimal corner rounding. This balances the "energy" of the brand with the "stability" expected of a financial tool. 

- **Buttons & Inputs:** Use the base 4px (0.25rem) radius.
- **Data Cards:** Use 8px (0.5rem) to slightly soften the layout.
- **Pills/Chips:** Use a full pill radius for category tags to distinguish them from actionable buttons.

## Components

- **Buttons:** Primary buttons are solid Primary Green with dark charcoal text, using bold Anybody typography. Secondary buttons use a ghost style with a Primary Green border.
- **Market Cards:** Feature a JetBrains Mono ticker (top-left), a sparkline chart (center), and the price/percentage change (right). Percentage changes must be color-coded (Green for +, Red for -).
- **Input Fields:** Dark-themed with a subtle 1px slate border. Upon focus, the border transitions to Primary Green with a faint outer glow.
- **Chips/Badges:** Used for stock categories (e.g., "Tech", "Energy"). These should be low-contrast (Slate background, light text) unless highlighting a specific "Trending" status.
- **Watchlists:** Row-based layouts with high vertical density. Alternating row highlights (zebra striping) can be used to assist horizontal scanning of complex data points.
- **Sparklines:** Simplified, stroke-only charts. Use Primary Green for overall positive intervals and Tertiary Red for negative ones. No fill gradients under the line to keep the UI clean.