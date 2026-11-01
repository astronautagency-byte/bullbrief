# Simplified advisor experience

The first simplification pass focuses on navigation, Today and client records. It retains BullBrief's green logo and existing firm/household permission boundaries.

- Primary navigation: Today, Clients, Meetings, Tasks and Product reviews (subject to existing module preferences). Email/calendar connections, practice tools, research and settings remain under More, which opens automatically for an active secondary page. Clients and Tasks share a route but have distinct active states. Firm context is carried into core workspace links.
- Today: a next-meeting panel, personal follow-ups with explicitly labelled completion buttons, three daily actions and a quieter product-review strip. Counts identify their scope; the task queue is limited to the first 100 accessible open tasks. Meeting loading failures are shown as failures rather than an empty calendar. The next-meeting list covers the requested 30-day window, with the existing 250-record API limit.
- Client records: contact phone/email, the next scheduled meeting in the next 30 days and recent open follow-ups appear in Summary. Phone/email links use the user's configured apps. Meeting links stay scoped to the selected client. Secondary account/product/activity tabs are under More client details. Practice-level statistics are collapsed under Practice overview.
- Readability: larger navigation, labels and actions, 44px or larger primary controls, visible keyboard focus, and simpler terms such as Clients, Meeting notes and Prepare for meeting. Mobile navigation uses a native modal dialog with focus containment and Escape dismissal.

This pass does not add live Microsoft authorization, automatic transcript ingestion, AI-generated notes or a new scheduling wizard. The existing scheduling and reviewed-note forms remain available. External sending still requires the configured Microsoft connection and explicit invitation review.

Validation: TypeScript, targeted ESLint, CRM/calendar/invitation regression checks, production build and desktop/mobile browser checks. A representative test with less technical advisors remains the next usability validation step; no user research result is implied by this implementation.

Browser verification confirmed Clients → Tasks → Clients without a full reload, distinct active navigation, the selected household's next meeting and contact summary, More disclosure access, a 390px viewport without horizontal page overflow, and mobile menu Escape dismissal. Secondary background content is collapsed by default. The existing calendar GET endpoint now accepts an optional validated household ID and applies it to the same authenticated RLS query; its filter is covered by the calendar regression check.

Production compilation passed using `next build --webpack`. The default Turbopack build encountered its internal Google-font import-map error (`next/font/google queries have exactly one entry`); the fonts and bundler configuration were preserved. Screenshots: `simple-today.png` and `simple-client-summary.png` in the session visualization directory.

## Money-green glass finish

Applied a frosted treatment to the sidebar, header, menus and mobile navigation. The logo uses the original transparent silhouette as a CSS mask with exact money green `#1B5E3B`; institutional logos are unchanged. Primary actions use the same green with a restrained surface highlight. Client data and form surfaces retain a near-opaque background for reading. Blur is confined to navigation and overlays. The header uses a glass pseudo-element so fixed notifications remain positioned against the viewport rather than a filtered header ancestor. Opaque fallbacks cover unavailable backdrop blur, reduced transparency and increased contrast; printing restores the original image silhouette.

Verified exact logo computed color, notification panel top 88px/right 24px at desktop size, mobile document width 390px, TypeScript, targeted ESLint and a Webpack production build. No new data access or external sending was introduced. Preview: `money-green-glass.png` in the session visualization directory.

### Stronger frosting and sign-in coverage

After feedback that the frosting was not visible, increased the coloured background contrast and lowered chrome opacity. Today panels now also use a small backdrop blur, while form controls remain solid. Added the same frosted card treatment to the login/signup layout; the earlier finish had only covered authenticated workspace chrome. A muted decorative orb behind the sign-in card makes its translucency visible. The authentication root clips decorative horizontal overflow. Reduced-transparency and high-contrast modes restore opaque cards.

### Select dropdowns

Shared select fields now use the glass material. In browsers supporting `appearance: base-select`, the native option picker is customized with a frosted background, rounded options and money-green selected/focus states while retaining native form and keyboard behavior. Other browsers receive a styled closed field and their system option popup. Verified the firm selector open/close in Chrome and Escape dismissal without changing its value. Production Webpack build passed. Preview: `glass-firm-dropdown.png`.

## Bright-green brand and original money illustration

All rendered BullBrief logo variants now share `BrandLogo` and the single `--bullbrief-logo-green: #00BD63` token across the workspace, sign-in, sign-up and existing public-page uses of that component. Institution co-branding is unaffected. The original transparent silhouettes are used as CSS masks, including the transparent icon mark. Print uses a monochrome fallback.

Added an original decorative SVG of coins and a growing plant to Today and the sign-in story, with bright mint icon tiles and a green accent on the review strip. The artwork contains no chart data or performance promise, has `aria-hidden`/`focusable=false`, and is hidden in the mobile Today header and print layout. It does not add animation or modify workflow behavior. The visual reference was the fresh, uncluttered financial-services direction described by Manulife; no Manulife logo, artwork or proprietary brand assets were reused.

Verified the logo's computed RGB(0,189,99), Today layout with no horizontal overflow at 390px, TypeScript, targeted lint and the Webpack production build. Preview: `bright-green-today.png`.

## Refined abstract illustration and iconography

Replaced the literal coin/plant SVG with an original generated still life of emerald glass, ivory stone and brushed champagne metal, stored in `public/illustrations/bullbrief-wealth-sculpture-v1.png`. `WealthSculpture` uses Next Image with responsive sizes, an empty alternative text and decorative semantics. No Wealthsimple artwork or branding was copied. The shared functional icons use a 1.6px stroke; the large green icon badges were removed. Bright-green BullBrief logos remain unchanged.

The preview initially continued serving old stylesheet rules despite loading the new component. Restarting the development server with Webpack corrected the actual computed styles: 300px artwork, 1.6px icon strokes and transparent icon backgrounds. The default dev/build scripts now explicitly select Next's supported Webpack option to avoid the observed Turbopack stale-style and font import-map failures. TypeScript, targeted lint and a production Webpack build passed.

Final verification confirmed the new illustration loaded through Next Image, all targeted functional icons resolved to 1.6px strokes, the former panel-icon badge backgrounds were transparent, and the bright-green logo remained RGB(0,189,99). Mobile width was 390px with no horizontal page overflow; decorative header art is hidden at this size. The default `npm run build` passed after updating the bundler scripts. Screenshot: `refined-abstract-bullbrief.png`.

### Sidebar refinement — 31 October 2026

The BullBrief logo now uses subdued emerald `#23704c`; the expanded sidebar wordmark is 24px high. Institution logos retain their supplied colors. Desktop navigation can collapse from 216px to a 76px icon rail, with more room for the main content. The browser remembers the choice under `bullbrief.sidebar-collapsed`.

Primary icons have accessible names and labels on hover or keyboard focus. More tools opens a portaled flyout with keyboard focus containment, Escape dismissal, and focus restoration. Mobile keeps the full labeled navigation dialog.

Verified in Chrome: collapse and expand, compact preference after reload, keyboard labels, More tools opening and Escape dismissal, and the mobile navigation at 390px without horizontal overflow. TypeScript, targeted ESLint, and the production build passed.
