# UI consistency audit — 2026-10-31

## Changes

CRM forms, KYP simulations and guided product reviews now import their input/primary/secondary class definitions from `src/lib/workspace-controls.ts`. The canonical spacing rules at the end of `workspace.css` set 46px single-line controls, 8px label gaps, 20px field gaps and 24px panel insets (20px on mobile). Textareas retain their larger, resizable geometry. Text and icon actions retain at least 44px targets; shared action buttons are 46px high. Removed obsolete competing button-size rules.

The simulation toolbar no longer squeezes a long select label and four actions into a single flex row. Writing pattern and Start simulation form an aligned setup row; three bulk actions occupy their own grid beneath a divider. On small screens the controls stack at equal widths. The built-in option uses a shorter visible name. Select values remain on one line; full option text can still wrap within the opened picker. Form labels in both KYP editors now use the same grid spacing as CRM fields.

## Measured browser checks

| Area | Desktop (1512px) | Mobile (390px) |
| --- | --- | --- |
| Simulation controls | Five controls 46px; select/start share top 618px; action buttons share top 709px | Five controls 46px, equal 316px widths; document 390px |
| Guided-review controls | Ticker, listing market and Fetch product 46px | Controls 46px, widths 316px; document 390px |
| Meeting form | Single-line fields 46px; label gaps 8px; form gap 20px | Fields 46px; document 390px |
| Connections | Firm field and actions 46px; firm field 384px wide | Field 358px wide and 46px high; document 390px |
| Shared contact form | Shared CRM component and tokens inspected | Five fields and submit 46px, labels 8px; dialog width 366px at x=12; document 390px |
| Account menu | Shared menu spacing rule | Settings/Log out rows 44px; document 390px |

Contact-form and meeting-form inspections were read-only; no client records were saved and no invitation or AI generation was triggered. Core screen checks are not a claim that every conditional state or legacy market/research screen has been exhaustively reviewed.

## Verification

TypeScript and targeted ESLint passed. KYP review, KYP simulation, CRM, calendar and invitation regression suites passed. Production build checked with Next's Webpack option because of the previously identified Turbopack font import-map issue. Screenshot: `consistent-simulation-toolbar.png` in the session visualization directory.

### Shared page flow — 31 October 2026

Applied an explicit `workspace-page-header` treatment across Clients/Tasks and all CRM views, Meetings, KYP, Connections, Book overview, Markets, security detail, News, Podcasts, Saved research, Settings and Bull Picks. The shared rhythm is page context and title, supporting sentence, page actions, then controls and working content. The Today welcome retains its abstract sculpture as the overview treatment; workflow pages keep tools prominent without repeated decorative images.

Headers share emerald ink, restrained weight, 28/32px desktop padding and 24/20px mobile padding, with the same translucent surface and 24px radius. Shared table headings and placeholder colors use the same quiet utility styling. KYP subviews now use section headings under one page title. Print headers remain unboxed. Existing controls, workflows and navigation behavior are preserved.

### Distinct illustrations by page — 31 October 2026

Replaced the repeated header image with page-specific original 3D still lifes. The collection shares emerald glass, ivory stone and brushed champagne brass, while each composition relates to the workspace: relationship loops, calendar, task steps, research lens, connected links, briefing sheets, market bars, security gemstone, news sheets, audio waves, bookmark, settings dial, comparison prism, portfolio bowls, opportunity channel, workflow ribbon, report fan and team figures.

The dashboard shell supplies the route identity; CRM headers supply their current view directly so internal view changes also update the artwork. Header art stays decorative, shares the existing reserved illustration column, moves above content on mobile, and is hidden when printing. The Today sculpture remains its own overview composition.

Artwork verification: all 18 mapped WebP files exist and have distinct SHA-256 hashes (700,514 bytes combined). Visually reviewed the full collection, plus rendered Meetings, Tasks and Settings headers. Verified Tasks at 390px: artwork remains 84px high and the page has no horizontal overflow. TypeScript, targeted ESLint and the production build passed.
