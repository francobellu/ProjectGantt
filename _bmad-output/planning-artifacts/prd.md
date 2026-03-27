---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary]
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-ProjectGantt-2026-03-13.md
  - _bmad-output/planning-artifacts/research/technical-local-first-architecture-patterns-research-2026-03-13.md
  - _bmad-output/brainstorming/brainstorming-session-2026-03-11-now.md
briefCount: 1
researchCount: 1
brainstormingCount: 1
projectDocsCount: 0
workflowType: 'prd'
date: 2026-03-13
author: Francobellu
---

# Product Requirements Document - ProjectGantt

**Author:** Francobellu
**Date:** 2026-03-13

## Executive Summary

ProjectGantt is a local-first browser-based Gantt tool built by a banking Product Owner, for a banking Product Owner. It solves a single, specific problem: turning a Jira export of SCR tickets into a release timeline with quality gate markers — entirely within the browser, with no data leaving the user's machine.

The primary user is Franco — a PO managing sprint delivery (DIGI track) and monthly release coordination (SCR track) in a banking organisation. Today, answering "which SCRs are targeting this release, and are they on track?" requires manually cross-referencing Jira filters, boards, and personal notes. ProjectGantt collapses this into a single view: import a Jira export, see all SCRs grouped by monthly release, with gate date markers overlaid on the timeline and compliance status visible on each bar.

Three input files drive the tool: a Jira JSON/CSV export (SCR tickets), an Excel file mapping release names to gate dates, and an Excel file defining the universal gate requirements checklist. Gate compliance is tracked manually per SCR and persisted locally in IndexedDB. No backend, no account, no configuration — import and see.

### What Makes This Special

**Release-centric lens:** SCRs are grouped by monthly release target, not by Jira project or sprint. This matches how banking PMs actually plan — by release window, not by ticket hierarchy.

**Gate markers as first-class timeline elements:** Quality gate dates are rendered as vertical markers across the entire Gantt, making proximity to each gate spatial and visceral. Time pressure is visible without date arithmetic.

**Local-first by architecture, not by feature flag:** No server, no login, no data transfer. Banking project data stays in the browser via IndexedDB. Compliance is a structural property of the system, not something bolted on.

**Zero-friction import:** The entire onboarding is: export from Jira → drag file into app → see your Gantt. No field mapping, no configuration, no account creation.

## Project Classification

| Attribute | Value |
|-----------|-------|
| Project Type | Web Application (SPA/PWA) |
| Domain | General (personal productivity tool; banking context informs local-first architecture) |
| Complexity | Low — single user, no backend, no regulated data processing |
| Project Context | Greenfield |
