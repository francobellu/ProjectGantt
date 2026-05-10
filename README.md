# ProjectGantt

A local-first Gantt chart tool for banking project managers — import Jira SCR tickets, overlay quality gate dates, and track compliance per release. All data stays in your browser.

## What it does

ProjectGantt turns a scattered set of Jira SCR tickets into a unified release timeline with quality gate markers. Instead of cross-referencing Jira filters, boards, and personal notes, you get a single view that answers: _which SCRs are targeting this release, and are they on track for their gates?_

- **Gantt view** — SCR bars grouped by monthly release, with vertical gate date markers
- **Gate compliance tracker** — manual status + notes per requirement per SCR (not started / in progress / passed / failed / excepted)
- **Three-file import** — Jira XML export → SCR tickets; Excel → QG dates; Excel → QG requirements
- **Export/import** — save and load entire project state as JSON
- **Local-first** — IndexedDB persistence, zero network dependency, no account or login

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 |
| Persistence | IndexedDB (raw, no wrapper) |
| Events | Custom event sourcing layer |
| Gantt rendering | frappe-gantt 1.x |
| Excel parsing | SheetJS (xlsx), lazy-loaded |
| File access | browser-fs-access |
| Validation | Zod 4 |
| Testing | Vitest + Testing Library + Playwright |
| PWA | vite-plugin-pwa |
| CI/CD | GitHub Actions → GitHub Pages |

## Getting started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Usage

### First-time setup (3-step import)

1. **Jira export** — export your SCR tickets as XML from Jira (Filters → Export → XML), then drag-and-drop onto the Import screen
2. **QG Dates (Excel)** — upload an Excel file with release names and gate dates
3. **QG Requirements (Excel)** — upload an Excel file with the universal gate checklist

After all three files are imported, the Gantt view renders immediately.

### Daily workflow

- Open the app → Gantt view shows all SCRs grouped by release, with gate date markers overlaid
- Click any SCR to jump to its Gate Compliance panel → tick off requirements as they're confirmed
- Use **Export** to save a JSON snapshot; use **Load** to restore or share with a colleague

## Architecture

```
File import → Zod validation → Event dispatch → IndexedDB
                                                    ↓
                                             Zustand store
                                                    ↓
                                             React views
```

- **Local-first by design**: no backend, no API calls, no data leaves the browser. IndexedDB is the sole source of truth.
- **Event sourcing**: all mutations flow through an immutable event log (`shared/events`), providing an audit trail.
- **Feature-Sliced Design**: code organised into `features/` (import, gantt, compliance, export), `entities/` (scr, release, gate), and `shared/` (db, events, ui).
- **Offline-capable**: PWA with service worker caching — works without a network connection.

## Project structure

```
src/
  app/           # App shell, store, IndexedDB init
  features/
    import/      # Jira + Excel import pipeline
    gantt/       # Gantt chart rendering + gate markers
    compliance/  # Gate compliance tracker
    export/      # JSON project save/load
  entities/
    scr/         # SCR ticket domain model
    release/     # Monthly release + gate dates
    gate/        # Gate requirement model
  shared/
    db/          # IndexedDB schema, helpers
    events/      # Event sourcing dispatch/subscribe
    ui/          # Shared components
```

## Data model

- **SCR** — Jira ticket (id, summary, status, target release, dates, HUAT blockers)
- **HUAT** — blocking ticket (id, summary, which SCRs it blocks)
- **Release** — monthly release (name, month, gate dates)
- **GateRequirement** — universal checklist item (name, gate, owned/monitored)
- **ComplianceEntry** — per-SCR per-requirement status + notes
- **AppEvent** — immutable event log entry

## License

Private — personal productivity tool.