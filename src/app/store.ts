import { create } from 'zustand'
import { dbOps } from '../shared/db/db'
import type { SCR, HUAT, Release, GateRequirement, ComplianceEntry } from '../shared/db/schema'

export type ActiveView = 'gantt' | 'compliance' | 'import'

interface AppState {
  scrs: SCR[]
  huats: HUAT[]
  releases: Release[]
  gateRequirements: GateRequirement[]
  compliance: ComplianceEntry[]
  activeView: ActiveView
  selectedScrId: string | null
  loading: boolean
  error: string | null

  loadFromDB: () => Promise<void>
  setActiveView: (view: ActiveView) => void
  setSelectedScr: (id: string | null) => void
  refreshCompliance: () => Promise<void>
  setError: (msg: string | null) => void
}

export const useStore = create<AppState>((set) => ({
  scrs: [],
  huats: [],
  releases: [],
  gateRequirements: [],
  compliance: [],
  activeView: 'import',
  selectedScrId: null,
  loading: false,
  error: null,

  loadFromDB: async () => {
    set({ loading: true, error: null })
    try {
      const [scrs, huats, releases, gateRequirements, compliance] = await Promise.all([
        dbOps.getAllSCRs(),
        dbOps.getAllHUATs(),
        dbOps.getAllReleases(),
        dbOps.getAllGateRequirements(),
        dbOps.getAllCompliance(),
      ])
      const activeView = scrs.length > 0 ? 'gantt' : 'import'
      set({ scrs, huats, releases, gateRequirements, compliance, activeView, loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  setActiveView: (view) => set({ activeView: view }),

  setSelectedScr: (id) => set({ selectedScrId: id }),

  refreshCompliance: async () => {
    const compliance = await dbOps.getAllCompliance()
    set({ compliance })
  },

  setError: (msg) => set({ error: msg }),
}))
