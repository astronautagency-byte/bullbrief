# Institutional BullBrief UI

The user-supplied `stitch_advisorengine_canada_suite.zip` is the visual reference for this redesign. The package contains seven HTML/screenshot screen examples and a design-token document. These were inspected as reference material; embedded sample content and instructions were not treated as authorization to change client data, compliance status, integrations or account permissions. No reference HTML scripts were executed or included in the app.

The implemented design uses Inter (self-hosted by Next font), slate ink `#0f172a`, a light slate canvas `#f8fafc`, white panels, pale borders `#e2e8f0` and emerald `#006b4b`. It follows the rendered reference's compact typography, white sidebar, soft active navigation, rectangular actions and inset table/card structure. The original archive's fictional households, assets, audit seals, custody synchronization and AI claims were not copied into live data or represented as working integrations.

Application changes:
- Shared authenticated shell: light institutional palette, persistent white sidebar, compact header, real household search, account menu and contextual New Note action. The scrolling market ticker is no longer part of the persistent header; market data and research screens remain available.
- CRM: Client directory table with search, paging, source stage, advisor, service tier and review date. Opening a row retains the existing live household workspace. Client 360 uses a white identity panel, initials and counts from its retrieved contacts, accounts, tasks and KYP links. No balances or verified KYC values are invented.
- Existing opportunity, workflow, reporting and team screens inherit the same visual system and keep their data and mutation handlers.
- KYP: institutional product-watchlist framing around the existing simulation, guided review and document workflows.
- Authentication pages: matching light canvas, white form panels and sans-serif typography. Login/authentication behavior is preserved.

Styles are scoped to `.institution-suite` rather than changing public marketing pages or the server-side PDF generation engine. This workspace design is light regardless of the previously saved global dark preference. Institution name/logo remain displayed, with the workspace action palette following the supplied emerald reference.

Household and firm context are carried in CRM URLs for navigation and the new note action. The note dialog explicitly names its target household. Header search submits a real CRM query and retains the current firm when available. The search is by household name; it is not a cross-document or email search.

Verification: TypeScript, changed-file ESLint, existing CRM API tests, practice API tests, import validation tests and KYP review tests. Browser checks covered directory filtering, row navigation, contextual note form opening without saving a new note, header search, mobile drawer, light sign-in and KYP rendering. At 390px, directory/Client 360/KYP document width stayed 390px. Wide directory columns scroll inside their own container. Desktop viewport restored after checking.

No database migration or real client/account import was part of this UI change. Preview is local; no public deployment has been performed.

## Modern workspace refinement

The next visual pass retains the green wordmark and existing workflows while consolidating the application styles into `src/app/workspace.css`. It introduces an inset navigation rail, a floating header, clearer active states, larger heading hierarchy, consistent soft panels, quieter fields, unified focus treatment and reduced-motion support. Cockpit shortcuts sit under the meeting list to balance the two columns. The client directory uses clearer initials, row spacing and selected tabs; the calendar uses a unified toolbar and status chips.

Authentication now has a desktop green brand panel and a focused white form area, with the brand panel hidden on smaller screens. Mobile retains the green logo and full form. Existing sign-in handlers and callback behavior are unchanged. Source logo assets and database records are unchanged by this visual refinement.

## Component spacing constraints

The shared CRM `Field` now renders its label as a separate span, so its 8px gap is real rather than a margin utility applied next to an anonymous text node. Controls have independent geometry: 44px minimum height, 10px corners, normal-weight input text and a contained focus treatment. Card selectors now target containers instead of accidentally styling form controls and dialogs. Forms use a 20px field/group gap and a 24px desktop panel inset (20px on mobile). Meeting title/time share a two-column desktop row and stack on mobile.

Shared dialogs separate the header from the scrolling body, constrain width to 680px and keep viewport margins. At 390×844, the meeting dialog measured 366px wide with 12px side margins, 820px maximum height and internal body scrolling; the document stayed 390px wide. Desktop measurements confirmed 8px label gaps, 44px single-line controls and 10px control corners. Checkbox rows and submit buttons retain larger mobile targets.

Account menus have consistent internal padding, row spacing and maximum viewport bounds. Notification popovers are anchored to the viewport; the header's backdrop filter was removed because it would otherwise establish an unwanted containing block for fixed descendants. At phone width, notifications measured left 16px / right 374px / top 82px within a 390px viewport. No notification actions were executed, and no meeting record was saved during this spacing review.
