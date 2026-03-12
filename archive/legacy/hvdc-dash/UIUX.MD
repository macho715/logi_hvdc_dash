HVDC Logistics Dashboard UI/UX Strategy – First‑Pass Recommendation (2026)
Stage 1 – Problem statement, objectives, risks & assumptions

Problem
Samsung C&T’s HVDC Logistics Dashboard currently provides real‑time visibility for international shipments, container details and warehouse inventories. The core worklist‑centric UI, while functional, is optimized for internal teams. As the system scales to more users and data sources, the dashboard must become more intuitive, resilient and accessible across desktop and mobile contexts.

Objectives

Improve situational awareness – make it easier to prioritise shipments by gate status (red/amber/green) and triggers, and quickly drill into details.

Streamline workflows – minimise the steps required to filter, save and recall views, and perform updates (e.g., container counts) while maintaining data integrity.

Enhance accessibility – ensure WCAG 2.2 AA compliance with colour contrast and keyboard navigation, and make the PWA experience truly mobile‑first.

Support growth – allow the IA and component system to scale to new modules (analytics, supplier management) without confusing users.

Risks & assumptions

Assumption: Data pipelines remain consistent (Excel → Python ETL → Supabase). Any changes must be validated with the data team.

Risk: Over‑complex interactions (e.g., nested modals) could overwhelm operators; we will favour progressive disclosure and clear recovery paths.

Risk: Real‑time updates may cause performance issues; we will test with simulated data and recommend caching strategies.

Assumption: Future modules will follow the same design language and can reuse the component library.

Stage 2 – Personas and validation questions
Persona	Needs & Goals	Key Qs to validate
Logistics Coordinator (primary) – Works at a shipping office; monitors 30+ shipments/day	Quickly identifies urgent shipments (red gate or missing documents), filters by date or vendor, updates container counts	Can you locate a shipment with missing delivery orders in under 30 seconds?
Do the gate colours and triggers provide enough context?		
Warehouse Manager – Oversees inventory at MOSB/DSV warehouses	Tracks incoming containers, updates storage dates, checks when inventory must move; uses mobile device	Is the mobile layout intuitive for quick updates?
Are error messages clear when data entry fails?		
Executive Stakeholder – Needs KPIs and high‑level trends	Views KPI strip and analytics, exports reports to share with management	Are the DRI score and red‑count metrics visible at a glance?
Can you access historical trends without leaving the dashboard?		
Stage 3 – Journey maps & emotional beats

Coordinator Journey:

Login & overview – sees KPI strip (DRI score, red count); feels prepared.

Identify issues – uses Smart Sort and filters; shipments with red gate bubble to the top; feels focused.

Drill down – clicks row to open detail drawer; explores Timeline/Docs tabs; feels informed.

Take action – updates container or warehouse fields (via edit form) or contacts vendor; risk of frustration if forms are hidden or data sync is slow.

Save view – stores filter combination as “Red Gate + Vendor X” for later; feels efficient.

Warehouse Manager Journey:

Mobile access – opens PWA or browser on phone; sees responsive layout with hamburger menu; feels comfortable.

Update inventory – searches shipments, adds storage dates; expects big touch targets and offline support; error states must be clear.

Confirm status – checks that inventory count updates; expects quick feedback.

Executive Journey:

Snapshot view – logs in to see KPI strip; expects key metrics summarised.

Analytical deep dive – navigates to analytics page (future module) to compare vendors over time; expects interactive charts.

Export – downloads PDF/CSV of KPIs; feels empowered.

Stage 4 – Flow diagrams, recovery paths & metrics
Core flows (desktop)

Filter & prioritise: Use gate and vendor filters → apply Smart Sort → results update instantly. Recovery: if the query returns no results, show friendly message with reset filter option. Metric: average time to locate a problem shipment (target: ≤15 seconds).

Detail drill‑down: Click a row → slide‑out drawer opens; tabs show overview, timeline, docs & costs. Recovery: if network fails, allow retry and maintain scroll position. Metric: percent of users successfully locating needed info (target: ≥90%).

Save view: After setting filters and sort, click “Save view” → modal prompts for name → view appears in Saved Views bar. Recovery: provide undo and confirmation; if duplicate name exists, prompt to rename. Metric: number of saved views created and reused.

Mobile inventory update: Tap card → bottom sheet opens → update quantity/date → confirm; offline writes queue until network. Metric: error rate in form submissions.

Additional flows

Login & auth: Use Supabase auth; show error messages for invalid credentials; support password reset.

PWA install: Use next-pwa integration from mobile guide; show install prompt after second visit. Metric: PWA installation rate.

Stage 5 – Information architecture & label strategy
Top‑level IA

Dashboard (default) – Worklist, KPI strip, filters & saved views.

Shipments – Dedicated page for advanced search and batch operations.

Analytics – New module for charts & performance metrics.

Settings – Manage saved views, notifications, and user profile.

Label guidelines

Use clear nouns (e.g., “Shipments”, “Inventory”) over verbs; avoid jargon.

Use accessible colour chips to denote gate status: Red, Amber, Green and include text labels or tooltips for colour‑blind users.

Provide descriptive headings in the drawer tabs (e.g., “Timeline” instead of “Time”).

Stage 6 – UI direction, component specs & accessibility notes
Style & layout

Maintain dark sidebar (slate‑900) with blue accents; ensure contrast ratio ≥4.5:1.

Use glassmorphic sticky header with global search and notifications.

KPI strip components should use contrasting backgrounds and large numerals for readability.

Smart Sort adds sorting indicators; triggers appear as badges with tooltips describing missing documents.

Components
Component	Spec	Accessibility considerations
Sidebar Nav	Collapsible; icons with labels; highlight current page; support keyboard navigation	Ensure focus order; provide skip links.
Worklist Table	Sticky header; sortable columns; gate chip column; triggers column; row click triggers drawer	Use aria-sort attributes; ensure row is focusable.
Detail Drawer	Slide‑out panel; tabs for Overview, Timeline, Documents, Cost; persistent on mobile with bottom‑sheet behaviour	Trap focus within drawer; ensure ESC closes; maintain scroll state.
Filter Bar	Multi‑select chips; date range picker; vendor search; save view button	Provide aria-labels; ensure high contrast for selected chips.
KPI Strip	Horizontal cards showing DRI score, Red count, etc.; icons to match metrics	Use icons with labels; ensure 44×44 px touch targets.
Accessibility notes

Use semantic HTML with proper heading hierarchy.

Provide keyboard shortcuts (e.g., Cmd+K to open global search).

Use tooltips or alt text for icons and status chips.

Support high‑contrast mode (add prefers-contrast media queries).

Internationalization: support Korean and English text; avoid hard‑coded strings.

Stage 7 – Prototype pipeline & simulation report

Prototype tooling

Use Figma or OpenAI Canvas to design screens and component library.

Leverage Vercel AI SDK to prototype interactive flows; integrate with use-dashboard-store for state management.

For the PWA simulation, configure next-pwa as in the mobile guide; test installation on iOS and Android emulators.

Use the existing Next.js codebase as a sandbox: branch the repository, implement new components, and run npx next dev -p 3005 --webpack.

Simulation log (hypothetical – to be executed during design phase)

Scenario	Approach	Result / notes	Feasibility
Filtering & Smart Sort test	Implement new filter bar in dev branch; seed database with 100 sample shipments; measure time to display results	Results sorted instantly; filtering reduces items from 100→20; UI remains responsive	Pass – acceptable performance on desktop and mobile.
Drawer accessibility test	Use keyboard navigation to open drawer, switch tabs, close with ESC	All focusable elements reachable; ESC closes drawer; return focus to table	Pass, though keyboard trap must be carefully implemented.
PWA install & offline test	Enable service worker and manifest; simulate offline editing of inventory	Offline changes queue and sync upon reconnection; user informed via snackbar	Pass – service worker caching required; consider data‑sync conflict resolution.
Stage 8 – Validation plan & decision gates

Conduct usability tests with 5 coordinators and 2 warehouse managers using the Figma prototype and interactive Next.js build.

Measure success rates for critical tasks (find urgent shipment, update inventory, save view) and collect qualitative feedback.

Accessibility audit using Lighthouse and manual screen reader tests.

Decision gate: proceed to full build only if ≥80% of participants complete tasks successfully and no critical accessibility issues remain.

Stage 9 – Differentiation, risks & mitigation

Differentiators

Worklist‑centric control tower with Smart Sort and gate‑based prioritisation.

Detail‑on‑demand drawer with tabbed content.

Saved views & PWA features enabling personalisation and offline work.

Risks & mitigation

Risk	Mitigation
Performance degradation with large datasets	Implement pagination or infinite scroll in worklist; use server‑side filtering via Supabase; cache repeated queries.
User confusion with advanced features	Provide guided tours and contextual help; use progressive disclosure to hide advanced options until needed.
Accessibility compliance	Regular audits; incorporate accessible design from the start (contrast, keyboard support, screen reader labels).
Data inconsistencies from manual entry	Validate inputs; use constraints at database level; show error/success feedback.
Stage 10 – Handoff & traceability bundle

Design specs: Provide Figma file or OpenAI Canvas with final layouts, component library, style tokens and interaction notes.

Documentation: Maintain updated docs in the docs/ folder; include rationale for each design decision and link to relevant code.

User stories & acceptance criteria: For each feature (e.g., Smart Sort, Saved Views), define acceptance tests and metrics.

Code repository: Branch of HVDC Dashboard with new components; annotate commits to map design decisions to implementation.

Traceability matrix: Map requirements to personas, user stories and components; ensure each objective and risk is addressed.

By following this structured plan, the HVDC Logistics Dashboard can evolve into a more intuitive, resilient and scalable tool. This first‑pass recommendation emphasises actionable steps, accessible design, and evidence‑based validation to ensure the new dashboard meets the diverse needs of logistics coordinators, warehouse managers and executives.