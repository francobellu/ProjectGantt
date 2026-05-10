import { DB_NAME, DB_VERSION } from './schema'
import type { SCR, HUAT, Release, GateRequirement, ComplianceEntry, AppEvent } from './schema'

let db: IDBDatabase | null = null

export function openDB(): Promise<IDBDatabase> {
  if (db) return Promise.resolve(db)

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (e) => {
      const database = (e.target as IDBOpenDBRequest).result

      if (!database.objectStoreNames.contains('events')) {
        database.createObjectStore('events', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('scrs')) {
        database.createObjectStore('scrs', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('huats')) {
        database.createObjectStore('huats', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('releases')) {
        database.createObjectStore('releases', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('gateRequirements')) {
        database.createObjectStore('gateRequirements', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('compliance')) {
        const store = database.createObjectStore('compliance', { keyPath: 'id' })
        store.createIndex('byScrId', 'scrId', { unique: false })
        store.createIndex('byRequirementId', 'requirementId', { unique: false })
      }
    }

    req.onsuccess = (e) => {
      db = (e.target as IDBOpenDBRequest).result
      resolve(db)
    }

    req.onerror = () => reject(req.error)
  })
}

function tx(
  database: IDBDatabase,
  stores: string | string[],
  mode: IDBTransactionMode,
) {
  return database.transaction(stores, mode)
}

function put<T>(store: IDBObjectStore, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = store.put(value)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

function getAll<T>(store: IDBObjectStore): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  })
}

function getByIndex<T>(store: IDBObjectStore, indexName: string, key: IDBValidKey): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const req = store.index(indexName).getAll(key)
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  })
}

function clear(store: IDBObjectStore): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = store.clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

interface DBSnapshot {
  scrs: SCR[]
  huats: HUAT[]
  releases: Release[]
  gateRequirements: GateRequirement[]
  compliance: ComplianceEntry[]
  events: AppEvent[]
  exportedAt: string
}

export const dbOps: {
  putSCRs(scrs: SCR[]): Promise<void>
  getAllSCRs(): Promise<SCR[]>
  putHUATs(huats: HUAT[]): Promise<void>
  getAllHUATs(): Promise<HUAT[]>
  putReleases(releases: Release[]): Promise<void>
  getAllReleases(): Promise<Release[]>
  putGateRequirements(reqs: GateRequirement[]): Promise<void>
  getAllGateRequirements(): Promise<GateRequirement[]>
  putCompliance(entry: ComplianceEntry): Promise<void>
  getComplianceBySCR(scrId: string): Promise<ComplianceEntry[]>
  getAllCompliance(): Promise<ComplianceEntry[]>
  appendEvent(event: AppEvent): Promise<void>
  getAllEvents(): Promise<AppEvent[]>
  clearAll(): Promise<void>
  exportSnapshot(): Promise<DBSnapshot>
  importSnapshot(snapshot: DBSnapshot): Promise<void>
} = {
  async putSCRs(scrs: SCR[]): Promise<void> {
    const database = await openDB()
    const t = tx(database, 'scrs', 'readwrite')
    const store = t.objectStore('scrs')
    await Promise.all(scrs.map((s) => put(store, s)))
  },

  async getAllSCRs(): Promise<SCR[]> {
    const database = await openDB()
    const t = tx(database, 'scrs', 'readonly')
    return getAll<SCR>(t.objectStore('scrs'))
  },

  async putHUATs(huats: HUAT[]): Promise<void> {
    const database = await openDB()
    const t = tx(database, 'huats', 'readwrite')
    const store = t.objectStore('huats')
    await Promise.all(huats.map((h) => put(store, h)))
  },

  async getAllHUATs(): Promise<HUAT[]> {
    const database = await openDB()
    const t = tx(database, 'huats', 'readonly')
    return getAll<HUAT>(t.objectStore('huats'))
  },

  async putReleases(releases: Release[]): Promise<void> {
    const database = await openDB()
    const t = tx(database, 'releases', 'readwrite')
    const store = t.objectStore('releases')
    await clear(store)
    await Promise.all(releases.map((r) => put(store, r)))
  },

  async getAllReleases(): Promise<Release[]> {
    const database = await openDB()
    const t = tx(database, 'releases', 'readonly')
    return getAll<Release>(t.objectStore('releases'))
  },

  async putGateRequirements(reqs: GateRequirement[]): Promise<void> {
    const database = await openDB()
    const t = tx(database, 'gateRequirements', 'readwrite')
    const store = t.objectStore('gateRequirements')
    await clear(store)
    await Promise.all(reqs.map((r) => put(store, r)))
  },

  async getAllGateRequirements(): Promise<GateRequirement[]> {
    const database = await openDB()
    const t = tx(database, 'gateRequirements', 'readonly')
    return getAll<GateRequirement>(t.objectStore('gateRequirements'))
  },

  async putCompliance(entry: ComplianceEntry): Promise<void> {
    const database = await openDB()
    const t = tx(database, 'compliance', 'readwrite')
    await put(t.objectStore('compliance'), entry)
  },

  async getComplianceBySCR(scrId: string): Promise<ComplianceEntry[]> {
    const database = await openDB()
    const t = tx(database, 'compliance', 'readonly')
    return getByIndex<ComplianceEntry>(t.objectStore('compliance'), 'byScrId', scrId)
  },

  async getAllCompliance(): Promise<ComplianceEntry[]> {
    const database = await openDB()
    const t = tx(database, 'compliance', 'readonly')
    return getAll<ComplianceEntry>(t.objectStore('compliance'))
  },

  async appendEvent(event: AppEvent): Promise<void> {
    const database = await openDB()
    const t = tx(database, 'events', 'readwrite')
    await put(t.objectStore('events'), event)
  },

  async getAllEvents(): Promise<AppEvent[]> {
    const database = await openDB()
    const t = tx(database, 'events', 'readonly')
    return getAll<AppEvent>(t.objectStore('events'))
  },

  async clearAll(): Promise<void> {
    const database = await openDB()
    const stores = ['scrs', 'huats', 'releases', 'gateRequirements', 'compliance', 'events']
    const t = tx(database, stores, 'readwrite')
    await Promise.all(stores.map((s) => clear(t.objectStore(s))))
  },

  async exportSnapshot() {
    const [scrs, huats, releases, gateRequirements, compliance, events] = await Promise.all([
      this.getAllSCRs(),
      this.getAllHUATs(),
      this.getAllReleases(),
      this.getAllGateRequirements(),
      this.getAllCompliance(),
      this.getAllEvents(),
    ])
    return { scrs, huats, releases, gateRequirements, compliance, events, exportedAt: new Date().toISOString() }
  },

  async importSnapshot(snapshot: Awaited<ReturnType<typeof dbOps.exportSnapshot>>): Promise<void> {
    await this.clearAll()
    await Promise.all([
      this.putSCRs(snapshot.scrs),
      this.putHUATs(snapshot.huats),
      this.putReleases(snapshot.releases),
      this.putGateRequirements(snapshot.gateRequirements),
    ])
    const database = await openDB()
    const t = tx(database, 'compliance', 'readwrite')
    const store = t.objectStore('compliance')
    await Promise.all(snapshot.compliance.map((c: ComplianceEntry) => put(store, c)))
  },
}
