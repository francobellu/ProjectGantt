---
stepsCompleted: [1, 2, 3]
inputDocuments: []
session_topic: 'Jira-to-Gantt banking project management web app'
session_goals: 'Brainstorm how the tool should work end-to-end — data ingestion, Gantt visualization, release/quality gate management, and workflows for a banking context'
selected_approach: 'progressive-flow'
techniques_used: ['What If Scenarios']
ideas_generated: [22]
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Francobellu
**Date:** 2026-03-11

---

## Session Overview

**Topic:** A local-first web app for banking project managers that reads Jira tickets (SCR and HUAT types) via JSON export or URL, visualizes them as an interactive Gantt chart mapped to monthly releases, and tracks quality gate compliance.

**Goals:** Brainstorm how this tool should work end-to-end — data ingestion, Gantt visualization, release/quality gate management, and workflows.

**Key Constraints:**
- Local-first: no data leaves the user's machine (banking privacy)
- Single-user for now
- Read-only against Jira (no write-back)
- Free hosting or local file system (no backend required)
- Persistence via IndexedDB + manual file export

---

## Session Setup

**Approach:** Progressive Technique Flow
- Phase 1: What If Scenarios (Expansive Exploration)
- Phase 2: Six Thinking Hats (Pattern Recognition)
- Phase 3: SCAMPER Method (Idea Development)
- Phase 4: Decision Tree Mapping (Action Planning)

---

## Data Model (Confirmed)

### Jira Ticket Types
- **SCR**: The project-level ticket. Appears as a bar on the Gantt. Subject to quality gates. Has an associated DIGI ticket containing a milestone table (too complex to parse automatically).
- **HUAT: Defect**: A production defect fix. Also targets a release. No gate requirements. Not linked to SCRs unless a Jira "blocks" link explicitly exists.

### Data Sources (3 files)
1. **Jira data**: SCRs and HUATs — via JSON export or URL
2. **QG dates file**: Excel — maps release name to gate dates (e.g. Release Jan → Gate 1: Jan 5, Gate 2: Jan 15)
3. **QG requirements file**: Excel — generic checklist of requirements every SCR must fulfil per gate (same list for all SCRs)

### Gate Fulfilment
- Requirements are a **universal checklist** — same for all SCRs
- Fulfilment status is **manually tracked** in the app (DIGI milestone table too complex to parse)
- Each requirement can have a **note** (who confirmed it, when)

### Persistence
- **Auto-save** to IndexedDB continuously
- **Manual export** to JSON file on demand (full state snapshot)
- Re-importing Jira data preserves manual fulfilment entries (tied to SCR Jira ID)

---

## Phase 1: What If Scenarios — Ideas Generated

**[UX #1]: Release Gate Dashboard**
_Concept_: Each project bar on the Gantt shows inline indicators for quality gate status — green/amber/red per gate, with a tooltip showing exactly which requirements are unfulfilled.
_Novelty_: Gate status lives directly on the Gantt bar — no switching screens mid-meeting.

**[UX #2]: Gate Deadline Markers**
_Concept_: Vertical lines across the entire Gantt at each quality gate date, so you instantly see which projects haven't crossed the line yet and how much runway remains.
_Novelty_: Makes time pressure spatial and visceral — you see proximity to the gate, not just a date field.

**[Data #3]: Ticket Dependency Web**
_Concept_: Related Jira tickets linked visually — either as sub-bars under the parent project, or as connector lines between dependent tickets on the Gantt.
_Novelty_: Makes dependencies visible, preventing the "we didn't know that ticket was blocking us" conversation.

**[UX #4]: Action Items Panel**
_Concept_: A sidebar or bottom panel listing all unfulfilled gate requirements across all projects, sorted by urgency (gate date proximity). Each item shows the project, the gate, and the specific missing requirement.
_Novelty_: Turns passive visualization into a personal to-do list — the user leaves the app knowing exactly what to chase.

**[UX #5]: Per-Project Gate Checklist**
_Concept_: Clicking a project on the Gantt opens a detail panel showing all quality gates for its target release, with a checklist of requirements — checked/unchecked, with due dates.
_Novelty_: One click from the Gantt to full gate compliance picture for that project.

**[UX #6]: Contact Trigger View**
_Concept_: Each unfulfilled gate requirement shows the responsible team or person (pulled from the Jira ticket assignee/component), so the user knows exactly who to contact without looking it up.
_Novelty_: Reduces friction between "seeing a problem" and "knowing who to call."

**[UX #7]: Flexible Outstanding Requirements View**
_Concept_: A requirements view scoped to a single project or all projects at once — toggled easily. Shows all unfulfilled gate requirements with gate date, responsible team, and requirement description.
_Novelty_: Single project view for focused follow-up; all-projects view for the release meeting overview — same screen, different scope.

**[Release #8]: Release Load Indicator**
_Concept_: Each monthly release column on the Gantt shows a count of projects targeting it, with a visual indicator when it looks crowded.
_Novelty_: Makes overloading visible before the release meeting, not during it.

**[Release #9]: Project Postponement Simulation**
_Concept_: Temporarily drag a project from one release to the next to see the new picture — without changing underlying Jira data. A "what if I slip this?" local-only view.
_Novelty_: Allows local planning exploration without committing to anything or writing back to Jira.

**[Release #10]: Postponement Impact View**
_Concept_: When a project is flagged as a postponement candidate, the app highlights its dependent projects that may also need to slip.
_Novelty_: Makes cascade effects of postponement visible, preventing surprises.

**[Data #11]: Adaptive Dual-Track Gantt**
_Concept_: HUAT lane appears automatically only when HUATs exist in the loaded data — otherwise the Gantt shows SCRs only, no empty lanes cluttering the view.
_Novelty_: UI adapts to reality rather than showing structure for its own sake.

**[Data #12]: Gate Requirements — SCR Only**
_Concept_: Quality gate checklists, gate date markers, and unfulfilled requirements panels apply exclusively to SCRs. HUATs appear on the timeline but carry no gate compliance burden.
_Novelty_: Keeps gate complexity where it belongs without polluting the simpler HUAT track.

**[Data #13]: Explicit Jira Blocking Links**
_Concept_: If a HUAT has a Jira "blocks" link pointing to an SCR, the app surfaces that relationship visually — a connector or warning on the SCR bar indicating it has a blocking HUAT open.
_Novelty_: No assumed blocking — only what Jira explicitly declares. Avoids false alarms.

**[Data #14]: Three-Source Data Model**
_Concept_: The app has a clear import UI for three distinct inputs — Jira data, QG dates, and QG requirements — each uploadable independently. Clear indicators show which sources are missing.
_Novelty_: Reflects real-world data ownership split — Jira owns project data, someone else owns the release calendar and compliance rules.

**[Data #15]: Persistent Local Storage**
_Concept_: All three uploaded files stored in IndexedDB locally — user doesn't re-upload everything on each visit. Each source shows its last-updated timestamp and can be refreshed independently.
_Novelty_: The app remembers its state between sessions without any server.

**[Data #16]: Universal Gate Checklist**
_Concept_: The same QG requirements checklist applies to every SCR. The app tracks fulfilment state per SCR — manually ticked by the user as they receive confirmation from teams.
_Novelty_: One checklist definition, applied uniformly — no per-project configuration needed.

**[Data #17]: Manual Gate Fulfilment Tracking**
_Concept_: For each SCR, the user manually ticks off which gate requirements are fulfilled — stored locally in IndexedDB against that SCR's ID. Checklist pre-populated from QG requirements file.
_Novelty_: Acknowledges that not all data lives in machine-readable format — the app becomes the tracking layer on top of Jira.

**[Data #18]: Fulfilment State Persistence**
_Concept_: Manual gate fulfilment ticks persist across sessions in IndexedDB — tied to the SCR Jira ID. Re-importing Jira data preserves manual fulfilment state, only reset if explicitly cleared.
_Novelty_: Re-importing updated Jira data doesn't wipe the user's manual tracking work.

**[UX #19]: Fulfilment Input Panel**
_Concept_: Clicking an SCR on the Gantt opens a panel showing the gate checklist with tickable requirements. Each requirement shows the gate it belongs to and a notes field (who confirmed it, when).
_Novelty_: Notes field creates a lightweight audit trail — useful in banking compliance contexts.

**[Data #20]: IndexedDB Auto-Save + Manual Export**
_Concept_: The app auto-saves all state to IndexedDB continuously. When the user wants a snapshot or backup, they export the full state to a JSON file on demand (including Jira data, QG files, and all manual fulfilment entries).
_Novelty_: Seamless persistence during normal use, explicit control when archiving or sharing.

**[Release #21]: Multi-user Future Path**
_Concept_: File-based state export already enables basic sharing — a colleague imports the JSON state file and sees the same picture. Future multi-user would add "last edited by" fields and merge strategies.
_Novelty_: Multi-user capability is a natural extension of the single-user file export, not a rebuild.

**[UX #22]: Unsaved Changes Indicator** _(deferred — auto-save to IndexedDB makes this less critical)_
_Concept_: Subtle indicator when state has changed since last export — nudges user to export before closing.
_Novelty_: Respects user control over what gets persisted to file.

---

## Ideas Count: 22
## Next Phase: Phase 2 — Pattern Recognition (Six Thinking Hats)
