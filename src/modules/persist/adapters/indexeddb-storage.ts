/* eslint-disable @typescript-eslint/no-explicit-any */
import {NOT_ALLOWED_TYPES} from '../consts'
import type {PersistAdapter} from '../types'

const DB_NAME = 'unisignal-store'
const STORE_NAME = 'key-val'
const VERSION = 1

let idb: IDBDatabase | undefined

interface StoreValue {
  value: string
  key: string
}

const openDb = async (): Promise<IDBDatabase> => {
  if (idb) {
    return idb
  }
  const dbReq = indexedDB.open(DB_NAME, VERSION)
  return new Promise((resolve, reject) => {
    dbReq.onupgradeneeded = () => {
      const db = dbReq.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {keyPath: 'key'})
      }
    }
    dbReq.onsuccess = () => {
      idb = dbReq.result
      resolve(dbReq.result)
    }
    dbReq.onerror = () => reject(dbReq.error)
  })
}

export const removeIDB = () => {
  indexedDB.deleteDatabase(DB_NAME)
}

export class IndexedDBAdapter implements PersistAdapter {
  isAsync = true
  constructor() {}
  async keys(): Promise<string[]> {
    const db = await openDb()
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const all = await new Promise<StoreValue[]>((r, j) => {
      const req = store.getAll()
      req.onsuccess = () => r(req.result as StoreValue[])
      req.onerror = j
    })
    return all.map((item) => item.key)
  }
  set(name: string, value: unknown) {
    const type = typeof value
    if (NOT_ALLOWED_TYPES.includes(type)) {
      throw new Error('Type ' + type + ' not allowed')
    }
    openDb().then((db) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const payload =
        typeof value === 'object' && value && 'value' in (value as any) ? (value as any) : {value}
      store.put({key: name, value: JSON.stringify(payload)})
    })
  }

  clear(name: string): void {
    openDb().then((db) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      store.delete(name)
    })
  }
  async get(name: string) {
    const db = await openDb()
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const result = await new Promise<StoreValue>((r, j) => {
      const s = store.get(name)
      s.onsuccess = () => {
        r(s.result as StoreValue)
      }
      s.onerror = j
    })
    if (result) {
      try {
        return JSON.parse(result.value)
      } catch {
        // corrupted value
        return undefined
      }
    }
  }
}
