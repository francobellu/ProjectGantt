---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - _bmad-output/brainstorming/brainstorming-session-2026-03-11-now.md
  - _bmad-output/planning-artifacts/research/technical-local-first-architecture-patterns-research-2026-03-13.md
date: 2026-03-13
author: Francobellu
---

# Product Brief: ProjectGantt

<!-- Content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

ProjectGantt is a local-first browser tool built by a banking PM, for a banking PM. It solves one specific problem: turning a scattered set of Jira SCR tickets into a clear release timeline with quality gate markers — without any data leaving the user's machine. No backend, no account, no cloud. Just a fast, private view of what's targeting which release and whether it's on track for its gates.

---

## Core Vision

### Problem Statement

Banking project managers tracking multiple SCR tickets across monthly releases have no single visual that answers the key planning question: "Which SCRs are targeting this release, and are they on track?" Today this requires manually cross-referencing Jira filters, Jira boards, and personal text notes — a fragmented, time-consuming process that produces a mental model rather than a shared artefact.

### Problem Impact

Without a unified release view, every planning session starts from scratch. Gate deadline proximity is invisible until someone does date arithmetic. Blocking HUATs go unnoticed until they become escalations. The PM carries the full picture in their head, which is fragile and unshareable.

### Why Existing Solutions Fall Short

- **Jira boards/filters**: List-based, ticket-scoped. No timeline shape, no gate markers, no cross-release density view.
- **Jira Roadmap**: Project-scoped, not release-scoped. Doesn't map to the SCR → release → quality gate model.
- **Generic Gantt tools** (Monday, Smartsheet, etc.): Cloud-based, require manual data entry, not aware of Jira's data model or banking gate compliance concepts.

### Proposed Solution

A browser-only Gantt tool that ingests a Jira JSON/CSV export of SCR tickets and renders them as a timeline grouped by monthly release. Vertical gate date markers overlay the timeline, making proximity to each gate immediately visible. Gate compliance status (manually tracked per SCR) appears as inline indicators on each bar. All data stays in the browser via IndexedDB — no server, no login required.

### Key Differentiators

- **Release-centric, not project-centric**: Grouped by monthly release, not by Jira project — matches how banking PMs actually think about their work.
- **Gate-aware**: Quality gate dates overlaid as first-class timeline markers, not an afterthought.
- **Local-first by design**: Banking data never leaves the browser — compliance advantage built into the architecture, not bolted on.
- **Zero friction**: No account, no setup, no manual data entry beyond the Jira export. Import → see your Gantt.

---

## Target Users

### Primary Users

**Franco — Product Owner, Mejora Continua team**

Franco is a Product Owner in a banking organisation managing the backlog of a development team that works in 3-week sprints. His work spans two tracks: the internal DIGI track (sprint work his team owns end-to-end) and the external SCR track (the cross-functional monthly release process that follows once a DIGI is Done).

The DIGI-to-SCR relationship is typically 1-to-1, but occasionally several related DIGIs are bundled into a single SCR (e.g. iOS and Android implementations of the same feature). The SCR is always the release unit.

**Day-to-day context:**
- Manages DIGI backlog and sprint delivery autonomously with his team
- Monitors SCR progress through the release process (QA, RM, Security gates) without owning the gate sign-off process — that belongs to a PM
- Tracks gate status for visibility, not for action
- Uses Jira filters, Jira boards, and personal text notes today — no single view ties it all together

**Primary need:**
A regular check-in view that answers: "Which SCRs are targeting this release, where are they on the timeline, and are they on track for their gates?" — without having to assemble that picture manually from multiple Jira views.

**Secondary need:**
Occasional ability to see the DIGI tickets that produced each SCR — useful context but not the primary daily view.

**Success moment:**
Opens ProjectGantt, sees all his SCRs laid out by release with gate markers, spots a red indicator on one bar, knows immediately what to flag — in under a minute, with no tab-switching.

### Secondary Users

None identified for Phase 1. The tool is built for Franco's specific workflow. Future multi-user path (file-based state sharing) could extend to a PM colleague who needs the same release overview.

### User Journey

**Discovery:** Franco builds this tool himself to solve his own problem.

**Onboarding:**
1. Exports SCR tickets from Jira (JSON/CSV)
2. Imports QG dates file (Excel) and QG requirements file (Excel)
3. Sees his SCRs rendered as a Gantt grouped by monthly release, with gate date markers overlaid — immediate value, no configuration needed

**Core usage:**
Regular check-in rhythm (not triggered by a specific event). Opens the app, scans the Gantt for gate proximity and compliance status, closes it. Occasionally re-imports updated Jira data when tickets change. Manually ticks off gate requirements as confirmation arrives via Jira ticket comments/labels.

**Aha moment:**
First time he sees all SCRs for the current and next release on one screen, with gate markers showing exactly how much runway each has — without opening a single Jira filter.

**Long-term:**
Becomes the default pre-meeting and weekly check-in artefact. Optionally shares a JSON export snapshot with his PM for gate status visibility.

---

## Success Metrics

_Deferred — to be defined in a later iteration._

### Business Objectives

N/A — ProjectGantt is a personal productivity tool, not a commercial product.

### Key Performance Indicators

N/A — deferred.

---

## MVP Scope

### Core Features

1. **Jira import**: Parse SCR tickets from Jira JSON/CSV export
2. **QG dates import**: Parse release names and gate dates from Excel file
3. **QG requirements import**: Parse universal gate checklist from Excel file
4. **Gantt view**: SCR bars grouped by monthly release, vertical gate date markers overlaid
5. **Gate compliance tracking**: Manual tick + notes per requirement per SCR, persisted locally
6. **Persistence**: Auto-save to IndexedDB + manual JSON export/import

### Out of Scope for MVP

- DIGI ticket view (secondary need, post-MVP)
- HUAT track (SCR-only covers the core need)
- Postponement simulation / what-if views
- Multi-user collaboration (file export covers basic sharing)
- PDF/PNG export
- Dependency visualisation between tickets

### MVP Success Criteria

N/A — deferred.

### Future Vision

N/A — deferred.
