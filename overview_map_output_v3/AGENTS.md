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

---

## 5) Page-Level Grain Rules

### Overview
Grain = shipment / voyage

### WH Detail / Cargo Drilldown / Site Detail
Grain = case / package

Never combine these grains inside one main-path transform.

---

## 6) Overview Algorithm Standard

### Step 1. Build shipment master from `hvdc all status`
Primary key:
- `SCT SHIP NO.` or equivalent shipment/voyage key

### Step 2. Split planned vs actual site
Rule:
- if actual exists, actual wins
- otherwise planned nomination is used

### Step 3. Calculate Overview stage
Use stage, not Flow Code.

### Step 4. Build global map path
Without Flow Code:

`origin_region -> pol -> pod -> site_cluster`

### Step 5. Build UAE Ops map path
Without Flow Code:

`POD -> Customs -> WH(optional) -> MOSB(optional) -> Site`

---

## 7) Flow Code Usage Rules

`Flow Code` remains valid, but only in detail contexts.

Not allowed:
- overview main path generation
- overview stage computation
- overview voyage clustering
- overview primary map edges
- overview shipment identity logic

---

## 8) AGI / DAS MOSB Rule

Do not lift MOSB detail-routing logic into the overview backbone unless it is already represented as a voyage-level milestone in `hvdc all status`.

---

## 9) Vendor Rule

Never hardcode a single vendor such as `Hitachi`.

Overview vendor logic must use the distinct vendor set from `hvdc all status`.

---

## 10) Output Contract

### Overview outputs
Preferred outputs:
- `overview_master.json`
- `global_map.json`
- `uae_ops_map.json`

### Detail outputs
Preferred outputs may include:
- `wh_detail.json`
- `cargo_drilldown.json`
- `flow_code_summary.json`

---

## 11) WH Role in Overview

WH is not the universal center of the Overview map.

WH is an **optional staging node**.

---

## 12) Required Language for Maintainers

When editing Overview logic, always think in this sequence:

`Shipping -> Customs Clearance -> Port Handling -> Storage -> LCT -> Site Offloading`

When editing detail logic, always think in this sequence:

`case/package -> warehouse handling -> Flow Code -> MOSB/site routing`

---

## 13) Safety Rules

Do not:
- infer overview from Flow Code
- flatten multi-site shipments into one fake route
- hardcode one vendor
- force WH into all routes
- mix shipment grain and case grain
- invent missing fields or milestones

Do:
- keep overview and detail contracts separated
- keep actual vs planned distinction explicit
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
- No shipment-level Flow Code dependency remains in Overview

---

## 15) Assumption Handling

If repo file paths, commands, schemas, or component names are unclear:

- do not fabricate
- add `[ASSUMPTION]` note
- wait for repo evidence before destructive refactor

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
