import { useState } from 'react'
import { parseJiraExport } from './jiraParser'
import { parseQGDatesExcel, parseQGRequirementsExcel } from './excelParser'
import { dbOps } from '../../shared/db/db'
import { dispatchEvent } from '../../shared/events/events'
import { useStore } from '../../app/store'

type ImportStep = 'jira' | 'qg-dates' | 'qg-requirements' | 'done'

export function ImportPanel() {
  const loadFromDB = useStore((s) => s.loadFromDB)
  const setError = useStore((s) => s.setError)
  const [step, setStep] = useState<ImportStep>('jira')
  const [status, setStatus] = useState<string>('')
  const [busy, setBusy] = useState(false)

  async function handleJiraFile(file: File) {
    setBusy(true)
    setStatus('')
    try {
      const raw = await file.text()
      const { scrs, huats, errors } = parseJiraExport(raw)
      if (scrs.length === 0 && huats.length === 0) {
        setStatus(`No SCR or HUAT tickets found. Errors: ${errors.join('; ')}`)
        return
      }
      await dbOps.putSCRs(scrs)
      await dbOps.putHUATs(huats)
      await dispatchEvent('JIRA_IMPORTED', { scrCount: scrs.length, huatCount: huats.length })
      setStatus(`Imported ${scrs.length} SCRs and ${huats.length} HUATs.${errors.length ? ` Skipped: ${errors.length}` : ''}`)
      setStep('qg-dates')
    } catch (e) {
      setError(`Jira import failed: ${e}`)
      setStatus(`Error: ${e}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleQGDatesFile(file: File) {
    setBusy(true)
    setStatus('')
    try {
      const { releases, errors } = await parseQGDatesExcel(file)
      if (releases.length === 0) {
        setStatus(`No releases found. Errors: ${errors.join('; ')}`)
        return
      }
      await dbOps.putReleases(releases)
      await dispatchEvent('QG_DATES_IMPORTED', { releaseCount: releases.length })
      setStatus(`Imported ${releases.length} releases.${errors.length ? ` Warnings: ${errors.join('; ')}` : ''}`)
      setStep('qg-requirements')
    } catch (e) {
      setStatus(`Error: ${e}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleQGRequirementsFile(file: File) {
    setBusy(true)
    setStatus('')
    try {
      const { requirements, errors } = await parseQGRequirementsExcel(file)
      if (requirements.length === 0) {
        setStatus(`No requirements found. Errors: ${errors.join('; ')}`)
        return
      }
      await dbOps.putGateRequirements(requirements)
      await dispatchEvent('QG_REQUIREMENTS_IMPORTED', { requirementCount: requirements.length })
      setStatus(`Imported ${requirements.length} gate requirements.`)
      setStep('done')
      await loadFromDB()
    } catch (e) {
      setStatus(`Error: ${e}`)
    } finally {
      setBusy(false)
    }
  }

  function onDrop(handler: (f: File) => void) {
    return {
      onDragOver: (e: React.DragEvent) => e.preventDefault(),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file) handler(file)
      },
    }
  }

  const steps: { id: ImportStep; label: string; accept: string; handler: (f: File) => void }[] = [
    { id: 'jira', label: 'Step 1 — Jira XML export', accept: '.xml', handler: handleJiraFile },
    { id: 'qg-dates', label: 'Step 2 — QG Dates (Excel)', accept: '.xlsx,.xls', handler: handleQGDatesFile },
    { id: 'qg-requirements', label: 'Step 3 — QG Requirements (Excel)', accept: '.xlsx,.xls', handler: handleQGRequirementsFile },
  ]

  const current = steps.find((s) => s.id === step)

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
      <h1 className="text-2xl font-bold text-slate-800">ProjectGantt</h1>
      <p className="text-slate-500 text-sm">Import your three data sources to get started.</p>

      <div className="flex gap-2 mb-4">
        {steps.map((s, i) => (
          <div key={s.id} className={`flex items-center gap-1`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${step === s.id ? 'bg-blue-600 text-white' :
                steps.indexOf(steps.find(x => x.id === step)!) > i ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {i + 1}
            </div>
            {i < steps.length - 1 && <div className="w-8 h-px bg-slate-300" />}
          </div>
        ))}
      </div>

      {step === 'done' ? (
        <div className="text-center text-green-600 font-medium">
          All files imported. Opening Gantt view...
        </div>
      ) : current ? (
        <div
          className="w-full max-w-md border-2 border-dashed border-slate-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 transition-colors"
          {...onDrop(current.handler)}
          onClick={() => document.getElementById(`file-${current.id}`)?.click()}
        >
          <p className="text-slate-600 font-medium mb-1">{current.label}</p>
          <p className="text-slate-400 text-sm">Drop file here or click to browse</p>
          <input
            id={`file-${current.id}`}
            type="file"
            accept={current.accept}
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) current.handler(f) }}
          />
        </div>
      ) : null}

      {busy && <p className="text-blue-500 text-sm animate-pulse">Processing...</p>}
      {status && <p className="text-slate-600 text-sm max-w-md text-center">{status}</p>}
    </div>
  )
}