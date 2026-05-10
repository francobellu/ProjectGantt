import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../../app/store'
import { dbOps } from '../../shared/db/db'
import { dispatchEvent } from '../../shared/events/events'
import type { ComplianceEntry, ComplianceStatus, GateRequirement } from '../../shared/db/schema'

const STATUS_LABELS: Record<ComplianceStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  passed: 'Passed',
  failed: 'Failed',
  excepted: 'Excepted',
}

const STATUS_COLORS: Record<ComplianceStatus, string> = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  passed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  excepted: 'bg-amber-100 text-amber-700',
}

export function CompliancePanel() {
  const { scrs, gateRequirements, compliance, selectedScrId, setSelectedScr, refreshCompliance, releases } = useStore()
  const [saving, setSaving] = useState<string | null>(null)
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({})

  const selectedScr = scrs.find((s) => s.id === selectedScrId) ?? scrs[0] ?? null

  useEffect(() => {
    if (!selectedScrId && scrs.length > 0) {
      setSelectedScr(scrs[0].id)
    }
  }, [scrs, selectedScrId, setSelectedScr])

  const scrCompliance = useMemo(() => {
    if (!selectedScr) return {}
    const map: Record<string, ComplianceEntry> = {}
    for (const c of compliance) {
      if (c.scrId === selectedScr.id) map[c.requirementId] = c
    }
    return map
  }, [compliance, selectedScr])

  const grouped = useMemo(() => {
    const groups: Record<string, GateRequirement[]> = {}
    for (const req of gateRequirements) {
      if (!groups[req.gateName]) groups[req.gateName] = []
      groups[req.gateName].push(req)
    }
    return groups
  }, [gateRequirements])

  const releaseForScr = releases.find((r) => r.name === selectedScr?.targetRelease)

  async function updateStatus(req: GateRequirement, status: ComplianceStatus) {
    if (!selectedScr) return
    setSaving(req.id)
    try {
      const existing = scrCompliance[req.id]
      const entry: ComplianceEntry = {
        id: existing?.id ?? crypto.randomUUID(),
        scrId: selectedScr.id,
        requirementId: req.id,
        status,
        note: noteEdits[req.id] ?? existing?.note ?? '',
        updatedAt: new Date().toISOString(),
      }
      await dbOps.putCompliance(entry)
      await dispatchEvent('COMPLIANCE_UPDATED', {
        scrId: selectedScr.id,
        requirementId: req.id,
        status,
        note: entry.note,
      })
      await refreshCompliance()
    } finally {
      setSaving(null)
    }
  }

  async function saveNote(req: GateRequirement) {
    if (!selectedScr) return
    const existing = scrCompliance[req.id]
    if (!existing) return
    setSaving(req.id)
    try {
      const entry: ComplianceEntry = {
        ...existing,
        note: noteEdits[req.id] ?? existing.note,
        updatedAt: new Date().toISOString(),
      }
      await dbOps.putCompliance(entry)
      await refreshCompliance()
    } finally {
      setSaving(null)
    }
  }

  if (gateRequirements.length === 0) {
    return (
      <div className="p-8 text-slate-400 text-center">
        No gate requirements loaded. Import the QG Requirements Excel file first.
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* SCR list sidebar */}
      <div className="w-56 border-r border-slate-200 overflow-y-auto shrink-0">
        <div className="p-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">SCRs</div>
        {scrs.map((scr) => {
          const total = gateRequirements.length
          const passed = compliance.filter((c) => c.scrId === scr.id && c.status === 'passed').length
          return (
            <button
              key={scr.id}
              onClick={() => setSelectedScr(scr.id)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors
                ${selectedScrId === scr.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''}`}
            >
              <div className="font-mono text-blue-600">{scr.id}</div>
              <div className="text-slate-500 truncate">{scr.summary.slice(0, 35)}</div>
              <div className="text-slate-400 mt-0.5">{passed}/{total} passed</div>
            </button>
          )
        })}
      </div>

      {/* Compliance checklist */}
      <div className="flex-1 overflow-y-auto">
        {selectedScr ? (
          <div className="p-4">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-800">{selectedScr.id}</h2>
              <p className="text-sm text-slate-500">{selectedScr.summary}</p>
              <p className="text-xs text-slate-400 mt-1">
                Release: {selectedScr.targetRelease ?? 'Unassigned'}
                {releaseForScr && releaseForScr.gates.length > 0 && (
                  <span className="ml-2">
                    | Gates: {releaseForScr.gates.map((g) => `${g.name} ${g.date}`).join(' | ')}
                  </span>
                )}
              </p>
            </div>

            {Object.entries(grouped).map(([gateName, reqs]) => (
              <div key={gateName} className="mb-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  {gateName}
                  {releaseForScr?.gates.find((g) => g.name === gateName) && (
                    <span className="text-red-400 font-normal normal-case">
                      — due {releaseForScr.gates.find((g) => g.name === gateName)!.date}
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  {reqs.map((req) => {
                    const entry = scrCompliance[req.id]
                    const status: ComplianceStatus = entry?.status ?? 'not_started'
                    const note = noteEdits[req.id] ?? entry?.note ?? ''
                    return (
                      <div key={req.id} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-700">{req.name}</span>
                              {!req.owned && (
                                <span className="text-xs bg-slate-100 text-slate-400 px-1.5 rounded">monitored</span>
                              )}
                            </div>
                            {req.description && (
                              <p className="text-xs text-slate-400 mt-0.5">{req.description}</p>
                            )}
                          </div>
                          <select
                            value={status}
                            disabled={saving === req.id || !req.owned}
                            onChange={(e) => updateStatus(req, e.target.value as ComplianceStatus)}
                            className={`text-xs px-2 py-1 rounded border-0 font-medium ${STATUS_COLORS[status]}`}
                          >
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </div>
                        {req.owned && (
                          <div className="mt-2 flex gap-2">
                            <input
                              type="text"
                              placeholder="Note (who confirmed, when...)"
                              value={note}
                              onChange={(e) => setNoteEdits((n) => ({ ...n, [req.id]: e.target.value }))}
                              onBlur={() => entry && saveNote(req)}
                              className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 text-slate-600 placeholder:text-slate-300"
                            />
                          </div>
                        )}
                        {entry?.updatedAt && (
                          <p className="text-xs text-slate-300 mt-1">
                            Updated {new Date(entry.updatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-slate-400 text-center">Select an SCR to view gate compliance.</div>
        )}
      </div>
    </div>
  )
}
