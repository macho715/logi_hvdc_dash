# AGENTS.md

You are an AI coding agent working on the HVDC Dashboard repository.

This project has one critical data-contract rule:

- `hvdc all status` is for **Overview only**
- `wh status + Flow Code` is for **WH detail / case drilldown only**

Do not mix these roles.

---

## 0) Core Principle

The purpose of `hvdc all status` is to represent:

- full voyage visibility
- planning status
- customs status
- operational progress status

The document-level end-to-end flow must be understood as:

`Shipping -> Customs Clearance -> Port Handling -> Storage -> LCT -> Site Offloading`

By contrast, `Flow Code` is not a voyage-level overview key.
It is a **material handling / routing pattern classifier**.
It is better suited for:

- operational rule checks
- detailed warehouse routing interpretation
- MOSB enforcement logic for AGI / DAS
- case/package-level drilldown

Therefore the required contract is:

- `Overview = hvdc all status only`
- `WH detail / case drilldown = wh status + Flow Code`

This separation is mandatory.

---

## 1) Mission

Build the dashboard so that the Overview page reflects the **program-level voyage view**, not warehouse-first routing logic.

The Overview page is a **voyage map**.

It must answer:

- where shipments are coming from
- which UAE entry point they use
- whether customs has started or closed
- whether cargo is staged in warehouse
- whether MOSB staging is involved
- which site is planned or actually reached

It must **not** answer case/package routing patterns through `Flow Code`.

---

## 2) Data Source Roles

### A. `hvdc all status`

This is the **Overview master**.

Use it for:

- shipment/voyage-level records
- Origin / COE
- POL / POD
- ETD / ATD / ETA / ATA
- customs start / customs close
- nomination fields
- stage milestone logic
- vendor / category / CIF / GWT
- planned site vs actual site logic
- overview map aggregation
- voyage-level stage calculation

This dataset is for **voyage-level map master** logic.

### B. `wh status`

This is the **detail operations master**.

Use it for:

- case/package-level records
- actual final location
- actual warehouse stop
- detailed warehouse / MOSB / site route
- FLOW_CODE
- detailed ops status
- drilldown-level tooltip / panel data

This dataset is for **detail/drilldown master** logic.

---

## 3) Forbidden Legacy Pattern

Never use this pattern:

`hvdc all status -> infer Flow Code -> build Overview map`

This is wrong.

Use this pattern instead:

`hvdc all status -> Overview voyage map`
`wh status -> detailed ops / case route / Flow Code`

---

## 4) Overview Must Not Use Flow Code as Main Logic

Do not use `Flow Code` as:

- overview main path key
- overview shipment classifier
- overview stage driver
- overview vendor grouping key
- overview site clustering key

Reason:

- In `hvdc all status`, fields like `DOC_AGI` are planned nominations, not guaranteed final single routes
- A single shipment can branch to multiple sites
- Assigning one shipment to one Flow Code at overview level creates distortion
- Flow Code describes handling/routing patterns, not the primary voyage-view identity

Overview must show only the high-level chain:

- Origin
- POD
- Customs status
- WH staging 여부
- MOSB 여부
- Site nomination / actual arrival

Flow 1 / 2 / 3 / 4 must not become the main Overview language.

---

## 5) Page-Level Grain Rules

### Overview

Grain = shipment / voyage

Main metrics:

- stage
- vendor
- origin
- POL / POD
- ETA / ATA
- customs progress
- warehouse staging hint
- MOSB hint
- planned site
- actual site

### WH Detail / Cargo Drilldown / Site Detail

Grain = case / package

Main metrics:

- FLOW_CODE
- final location
- actual route
- warehouse stop
- operational case status

Never combine these grains inside one main-path transform.

---

## 6) Overview Algorithm Standard

### Step 1. Build shipment master from `hvdc all status`

Primary key:

- `SCT SHIP NO.` or equivalent shipment/voyage key

Recommended normalized fields:

- shipment_id
- vendor
- category
- origin_region / COE
- pol
- pod
- etd / atd / eta / ata
- customs_start / customs_close
- planned_sites
- actual_sites
- warehouse_hints
- mosb_hint
- final_delivery

Do not fabricate fields that do not exist.

### Step 2. Split planned vs actual site

Planned site inputs:

- DOC_SHU
- DOC_MIR
- DOC_DAS
- DOC_AGI

Actual site inputs:

- SHU actual date
- MIR actual date
- DAS actual date
- AGI actual date

Rule:

- if actual exists, actual wins
- otherwise planned nomination is used

Always preserve:

- `site_basis = actual | planned`

### Step 3. Calculate Overview stage

Use stage, not Flow Code.

Canonical stage list:

- `pre_arrival`
- `in_transit`
- `arrived_port`
- `customs_in_progress`
- `customs_cleared`
- `warehouse_staging`
- `mosb_staging`
- `at_site`
- `delivered`

Recommended order:

1. `delivered` if final delivery exists
2. `at_site` if actual site exists
3. `mosb_staging` if MOSB hint exists
4. `warehouse_staging` if warehouse milestone exists
5. `customs_cleared` if customs close exists
6. `customs_in_progress` if customs start exists
7. `arrived_port` if ATA exists
8. `in_transit` if ETA or ATD exists
9. else `pre_arrival`

### Step 4. Build global map path

Without Flow Code:

`origin_region -> pol -> pod -> site_cluster`

Where:

- actual site mix has priority
- if no actual site, use planned nomination

Example:

- `Europe -> Antwerp -> Khalifa Port -> SHU`
- `Korea -> Busan -> Mina Zayed -> DAS`

### Step 5. Build UAE Ops map path

UAE Ops map rendering rule:

- Never reuse Global arc/trip visual profiles in UAE Ops.

- UAE Ops must use a separate line profile with lower arc height, lower width, and reduced opacity.

- If a change keeps the same visual profile for both modes, the task is incomplete.



Without Flow Code:

`POD -> Customs -> WH(optional) -> MOSB(optional) -> Site`

Rules:

- AGI / DAS planned or actual should strongly imply MOSB pathing
- SHU / MIR may be direct or WH-mediated
- WH is optional
- Port/Air -> Customs -> Site is the main backbone

---

## 7) Flow Code Usage Rules

`Flow Code` remains valid, but only in detail contexts.

Allowed:

- Open Radar detail
- Cargo drilldown
- WH Pressure
- Site detail page
- Flow Code distribution panel
- case/package tooltip
- pipeline flow summary
- warehouse detail page

Optional:

- overview tooltip secondary detail only

Not allowed:

- overview main path generation
- overview stage computation
- overview voyage clustering
- overview primary map edges
- overview shipment identity logic

---

## 8) AGI / DAS MOSB Rule

Because `Flow Code` is suitable for operational rule confirmation, it is especially valid for:

- AGI MOSB-required pattern confirmation
- DAS MOSB-required pattern confirmation
- offshore staging path validation
- warehouse-to-MOSB-to-site detail tracking

This logic belongs in:

- `wh status`
- detail routing transforms
- drilldown and ops validation panels

Do not lift MOSB detail-routing logic into the overview backbone unless it is already represented as a voyage-level milestone in `hvdc all status`.

---

## 9) Vendor Rule

Never hardcode a single vendor such as `Hitachi`.

Overview vendor logic must use the distinct vendor set from `hvdc all status`.

Required behavior:

- default filter: `All Vendors`
- vendor values: dynamic distinct values from source data
- support all actual vendors

Do not build overview around one fixed vendor.

---

## 10) Output Contract

### Overview outputs

Preferred outputs:

- `overview_master.json`
- `global_map.json`
- `uae_ops_map.json`

Overview output grain:

- shipment / voyage

### Detail outputs

Preferred outputs may include:

- `wh_detail.json`
- `cargo_drilldown.json`
- `flow_code_summary.json`

Detail output grain:

- case / package

If the repo uses different filenames, preserve the same logic and contract.

---

## 11) WH Role in Overview

WH is not the universal center of the Overview map.

WH is an **optional staging node**.

That means:

- some shipments may go through WH
- some may proceed direct
- some offshore cases may require MOSB
- Overview must not visually force all cargo through WH

The Overview should remain voyage-first, not warehouse-first.

---

## 12) Required Language for Maintainers

When editing Overview logic, always think in this sequence:

`Shipping -> Customs Clearance -> Port Handling -> Storage -> LCT -> Site Offloading`

When editing detail logic, always think in this sequence:

`case/package -> warehouse handling -> Flow Code -> MOSB/site routing`

These are different problem spaces and must stay separated.

---

## 13) Safety Rules

Do not:

- infer overview from Flow Code
- flatten multi-site shipments into one fake route
- hardcode one vendor
- force WH into all routes
- mix shipment grain and case grain
- overwrite detail routing logic to satisfy overview visuals
- invent missing fields or milestones

Do:

- keep overview and detail contracts separated
- keep actual vs planned distinction explicit
- keep MOSB logic where it belongs
- keep WH optional in overview
- use deterministic milestone-based stage logic
- add assumption markers if repo evidence is missing

---

## 14) Completion Criteria

A change is complete only if all conditions below are true:

- Overview uses `hvdc all status` only
- WH detail / case drilldown uses `wh status + Flow Code`
- Overview stage is milestone-based, not Flow Code-based
- Overview main path is voyage-based
- Planned and actual site are separated
- Actual overrides planned when present
- Vendor filter is dynamic
- WH is optional in Overview
- AGI / DAS MOSB enforcement remains valid in detail logic
- No shipment-level Flow Code dependency remains in Overview

---

## 15) Assumption Handling

If repo file paths, commands, schemas, or component names are unclear:

- do not fabricate
- add `[ASSUMPTION]` note
- wait for repo evidence before destructive refactor

Example:

`[ASSUMPTION] exact overview transform module path is not confirmed. Verify actual repo tree before changing imports.`

---

## 16) Human Review Required

Request explicit review before:

- changing schema keys already consumed by frontend
- deleting old transform files
- renaming shared JSON contracts
- changing vendor normalization logic
- changing site milestone semantics
- changing AGI/DAS MOSB routing semantics

Default safe approach:

- add new overview-safe transforms first
- preserve existing detail behavior unless directly instructed otherwise

