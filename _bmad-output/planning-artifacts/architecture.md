---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-ProjectGantt-2026-03-13.md
  - _bmad-output/planning-artifacts/research/technical-local-first-architecture-patterns-research-2026-03-13.md
workflowType: 'architecture'
project_name: 'ProjectGantt'
user_name: 'Francobellu'
date: '2026-03-13'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

| # | Requirement | Architectural Component |
|---|-------------|------------------------|
| FR1 | Jira JSON/CSV import — drag-and-drop → parse SCR tickets | Import pipeline, Zod validator, IndexedDB batch write |
| FR2 | Excel import (QG dates) — release names + gate dates | SheetJS parser, schema transform, IndexedDB |
| FR3 | Excel import (QG requirements) — universal gate checklist | SheetJS parser, schema transform, IndexedDB |
| FR4 | Gantt view — SCR bars grouped by monthly release, vertical gate date markers overlaid | Gantt renderer component, domain-specific layout engine |
| FR5 | Gate compliance tracking — manual tick + notes per requirement per SCR | Gate compliance tracker, event dispatch, IndexedDB |
| FR6 | Persistence — IndexedDB auto-save + manual JSON export/import | db.js helper, event sourcing, File System Access API |

**Non-Functional Requirements:**

- **Local-first (hard constraint):** No data leaves the browser. IndexedDB is the sole source of truth. No backend, no login, no data transfer. This is a banking compliance requirement, not a preference.
- **Offline capable:** Full functionality without a network connection. PWA with service worker caching.
- **Zero-friction UX:** The entire onboarding is import → see Gantt. No field mapping, no configuration.
- **Audit trail:** Event sourcing provides an immutable change log — relevant for a banking PM context.
- **Phase 2 CRDT path:** Data model must be CRDT-compatible from day one (UUIDs, append-only, no mutable counters).

**Scale & Complexity:**

- Primary domain: Browser SPA / PWA (local-first)
- Complexity level: Low (single user, no backend, small data volume)
- Estimated architectural components: ~9
- Data volume: Small (one user, few active projects, typically <500 SCR tickets)

### Technical Constraints & Dependencies

- **Jira CORS:** Jira Cloud blocks direct browser API calls. Manual JSON/CSV export is the only viable integration path. No workaround without a backend proxy.
- **Browser storage limits:** IndexedDB is quota-managed (~60–80% of available disk). Sufficient for Phase 1. Event log compaction needed if usage extends over years.
- **File System Access API:** Chrome/Edge only. Firefox/Safari require `<input type="file">` + Blob download fallback. Use `browser-fs-access` library for unified API.
- **SheetJS bundle size:** ~200 KB. Lazy-load on the import screen to avoid impacting initial load.
- **COOP/COEP headers:** Required for SQLite WASM (not needed for Phase 1 raw IndexedDB, but worth noting if Phase 2 explores SQLite).

### Jira Integration Constraint (Current & Future)

**Phase 1 — Manual export only:**
CORS on Jira Cloud is a hard browser-level wall. Even when the user is logged into Jira in the same browser, cross-origin fetch requests from ProjectGantt are blocked regardless of auth state. Manual JSON/CSV export is the only viable no-backend path.

**Field schema discovery (TODO-1 workaround):**
User can visit the Jira REST API URL directly in their browser while logged in (e.g. `https://your-org.atlassian.net/rest/api/3/issue/SCR-123`) to obtain a full field-structure sample. Zero dev cost, one-time exercise.

**Future consideration — lightweight backend:**
If live Jira sync becomes a requirement, a minimal backend proxy would be needed (e.g. a small Node/Edge function that holds an OAuth token and forwards requests). This would break the strict local-first constraint and would require a data processor agreement review in the banking context. Should be an explicit architectural decision when the time comes, not an incremental addition.

### Cross-Cutting Concerns Identified

1. **Event sourcing** — every write operation appends to the event log and updates a materialized view. Shared pattern across import, gate compliance, and any future edit operations.
2. **IndexedDB schema & migrations** — `onupgradeneeded` handles single-device schema evolution. Must be designed additively from the start for Phase 2 multi-user compat.
3. **Multi-format import validation** — Zod schemas guard all untrusted external data (Jira export format, Excel structure). Consistent error handling and user feedback across all import paths.
4. **PWA / offline** — Service worker caching strategy affects all static assets and determines what works offline. Configured once via vite-plugin-pwa but shapes deployment assumptions.
5. **CRDT-compatible data design** — UUIDs for all entity IDs, append-only operations, no mutable counters. Affects entity design across the entire domain model.
6. **Two-tier gate ownership model** — Gates are either *owned* (active tracking, responsibility of Franco's team) or *monitored* (view-only, other teams' scope). Gate ownership is per-requirement, not per-SCR. Affects data model, UI, and compliance derivation logic.
7. **Gate exception state** — A failed gate can be formally excepted (waived) to allow release to proceed. Exception is a first-class compliance state alongside `not_started | in_progress | passed | failed | exceptioned`. Requires reason/note field.
8. **Hybrid compliance derivation** — Gate requirements have two derivation modes: (a) auto-evaluated from SCR or DIGI ticket field values, (b) manually set. Per-requirement strategy must be configurable. Unknown Jira field schema makes this a deferred mapping problem (see Open Items).
9. **DIGI ticket data may be needed** — Some gate compliance may be deducible from DIGI (sprint) tickets, not only the SCR. Import pipeline scope TBD (see Open Items).

---

## Open Items / TODOs

- [ ] **TODO-1: Jira field schema discovery**
  User visits `https://your-org.atlassian.net/rest/api/3/issue/SCR-123` directly in the browser (while logged in) to capture a full-field JSON sample. Use this to design the field-to-gate-requirement mapping. No dev work required.
  Future: if live sync is ever needed, plan a backend proxy as a separate architectural decision (OAuth, DPA review, breaks local-first guarantee).

- [ ] **TODO-2: DIGI ticket export format**
  Determine if DIGI tickets need to be imported separately or are embedded in the SCR export. Understand DIGI→SCR relationship fields (1-to-1 or 1-to-many).

- [ ] **TODO-3: QG requirements Excel file**
  Review the actual Excel format Franco will provide. Identify: which requirements are owned vs monitored, which can be auto-evaluated from ticket fields, which are manual-only. This drives the compliance rule configuration data model.

- [ ] **TODO-4: Field-to-gate mapping mechanism**
  Decide how auto-evaluation rules are stored and applied: hardcoded per deployment, user-configurable via UI, or driven by the QG requirements Excel. Likely needs a mapping config per gate requirement: `{ fieldName, operator, expectedValue }`.

- [ ] **TODO-5: Exception workflow UX**
  Define what "excepting" a gate looks like: who sets it, what note is required, whether it expires, whether it affects the visual state on the Gantt bar.

---

## Starter Template Evaluation

### Primary Technology Domain

Browser SPA / PWA — local-first, no backend, single-user, offline-capable.

### Selected Starter: Vite + React + TypeScript

**Rationale:** Vite is the clear choice for this project — fast HMR, native ESM, first-class PWA plugin, and deep training coverage. React 18 + TypeScript is the most reliable combination for a greenfield local-first SPA in 2026.

**Initialization Command:**

```bash
npm create vite@latest projectgantt -- --template react-ts
cd projectgantt
npm install

# Tailwind CSS v4
npm i tailwindcss @tailwindcss/vite

# shadcn/ui
pnpm dlx shadcn@latest init -t vite

# PWA
npm i -D vite-plugin-pwa

# State + Storage + Import utilities
npm i zustand
npm i xlsx                    # SheetJS — lazy-loaded on import screen
npm i browser-fs-access       # File open/save with fallback
npm i zod                     # Schema validation for untrusted imports

# Testing
npm i -D vitest @testing-library/react @testing-library/user-event
npm i -D fake-indexeddb       # IndexedDB mock for unit/integration tests
npm i -D playwright           # E2E tests
```

**Architectural Decisions Provided by Starter:**

- **Language:** TypeScript (strict mode)
- **Build tooling:** Vite 8 — fast HMR, tree-shaking, optimized production build
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite` plugin — no config file needed
- **Component library:** shadcn/ui — copy-paste components, no runtime dep, full control retained for custom Gantt canvas
- **Testing:** Vitest (same config as Vite), Testing Library, fake-indexeddb, Playwright for E2E
- **PWA/Offline:** vite-plugin-pwa — Workbox-based service worker, installable PWA
- **Code organisation:** Feature-Sliced Design (FSD) — see Architecture Decisions

**Note:** Project initialization using this command should be the first implementation story.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical (block implementation):**
- Data architecture: IndexedDB + event sourcing
- Import pipeline: SheetJS + Zod
- Gantt rendering library: frappe-gantt

**Important (shape architecture):**
- Code organisation: Feature-Sliced Design
- State management: Zustand (no router)
- Deployment: GitHub Pages + local

**Deferred (post-MVP):**
- CRDT / multi-user sync (Yjs + y-indexeddb)
- Backend proxy for live Jira sync
- Field-to-gate auto-evaluation mapping (TODO-4)

---

### Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | Raw IndexedDB | Deep training coverage, stable API, y-indexeddb adapter ready for Phase 2 |
| Data model | Event sourcing | Undo/redo, audit trail, CRDT bridge — append-only from day one |
| Object stores | `events`, `scrs`, `releases`, `gates`, `compliance` | One store per domain entity + append-only event log |
| Entity IDs | UUIDs (crypto.randomUUID()) | CRDT-compatible, no collision risk |
| Migrations | onupgradeneeded + version increment | Additive-only schema changes for Phase 2 compat |
| Snapshot compaction | Deferred | Event log compaction needed only if usage exceeds years; not Phase 1 |
| Validation | Zod schemas on all external data | Guards Jira JSON/CSV and Excel imports at the boundary |

---

### Authentication & Security

No authentication. No login. No backend. Local-first is the security model:

- Data is origin-isolated in IndexedDB (inaccessible to other sites)
- Banking data never leaves the browser — no DPA required
- Browser extension threat model noted but not mitigated in Phase 1
- Optional at-rest encryption (AES-GCM via Web Crypto API) deferred to post-MVP

---

### API & Communication

No API. All data flows through the local event sourcing layer:

```
File import → Zod validation → Event dispatch → IndexedDB (events + materialized view)
                                                          ↓
                                               Zustand store (UI state)
                                                          ↓
                                                   React components
```

File System Access API (`browser-fs-access`) handles project save/load with
`<input type="file">` + Blob fallback for Firefox/Safari.

---

### Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Gantt rendering | frappe-gantt | SVG-based, open source, customisable for gate markers + release grouping; isolated in `features/gantt` — replaceable with Visx if needed |
| Routing | None (Zustand state) | Single-view tool; no URL routing needed in Phase 1 |
| Code organisation | Feature-Sliced Design (FSD) | Keeps import, gantt, compliance, export as independent slices |
| State tiers | IndexedDB → Zustand → React | DB is source of truth; Zustand holds derived UI state; components read from store |
| Bundle optimisation | Lazy-load SheetJS | ~200 KB xlsx only loaded on import screen |

**FSD Structure:**
```
src/
  app/           # App shell, IndexedDB init (db.ts), Zustand store init, PWA setup
  features/
    import/      # Jira + Excel import pipeline
    gantt/       # Gantt chart rendering + gate markers + release grouping
    compliance/  # Gate compliance tracker (owned/monitored, states, exceptions)
    export/      # JSON project save/load
  entities/
    scr/         # SCR ticket domain model + IndexedDB store
    release/     # Monthly release + gate dates model
    gate/        # Gate requirement model (owned/monitored, states, exceptions)
  shared/
    db/          # IndexedDB schema, migrations, db.ts helper
    events/      # Event sourcing dispatch/subscribe
    ui/          # Shared shadcn/ui components
```

---

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hosting | GitHub Pages | Free, static, zero ops, perfect fit for a local-first SPA |
| Local dev | `npm run dev` (Vite dev server) | Full offline capability from day one |
| CI/CD | GitHub Actions — build + deploy to gh-pages on push to main | Standard Vite → GitHub Pages pipeline |
| Environment | No environment variables needed | No backend, no secrets |
| Monitoring | None | Personal tool; no analytics or error tracking needed |

---

### Decision Impact Analysis

**Implementation sequence:**
1. Scaffold (Vite + React + TS + Tailwind + shadcn/ui + PWA)
2. IndexedDB schema + db.ts helper + fake-indexeddb tests
3. Event sourcing layer (dispatch + materialized view)
4. Zustand store
5. Import pipeline (Jira JSON/CSV + Excel via SheetJS)
6. Gantt renderer (frappe-gantt + gate markers + release grouping)
7. Gate compliance tracker (owned/monitored + exception states)
8. File save/load (browser-fs-access)
9. GitHub Pages CI/CD

**Cross-component dependencies:**
- All features depend on `shared/db` and `shared/events`
- `features/compliance` depends on `entities/gate` + `entities/scr`
- `features/gantt` depends on `entities/scr` + `entities/release` + `entities/gate`
- Import pipeline populates all entities; must be implemented before Gantt or compliance
