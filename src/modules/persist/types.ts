/* eslint-disable @typescript-eslint/no-explicit-any */
import type {SignalAdapter, SignalWritable, SignalComputed} from '../adapter'
import type {ComputedOptions} from '../adapter/types'

type Persist = {
  clear(): void
  /** Принудительно перечитать значение из стораджа */
  refreshFromStorage(): void | Promise<void>
  /** Флаг: текущее значение считано из стораджа хотя бы один раз в этой сессии */
  isRestored: boolean
  /** Флаг: когда-либо происходило успешное восстановление */
  restoredOnce: boolean
}
export type RestoreFn<T> = (data: any) => T
export type OnInitRestore<T> = (value: T) => void

export interface PersistAdapter {
  isAsync: boolean
  get(name: string): unknown | Promise<unknown>
  set(name: string, value: unknown): void
  clear(name: string): void
  keys(): string[] | Promise<string[]>
}

interface Storage {
  set(value: unknown): void
  clear(): void
  isAsync: boolean
}

export interface SyncStorage extends Storage {
  get(): unknown
  isAsync: false
}

export interface AsyncStorage extends Storage {
  get(): Promise<unknown>
  isAsync: true
}

export type PersistOptions<T> = {
  name: string
  throttle?: number
  restoreFn?: RestoreFn<T>
  onPersisStateInit?: (value: T) => void
  /** Диагностика: включить подробные логи или передать кастомный логгер */
  debug?: boolean | {logger?: (message: string, context: any) => void}
  /** Ограничения и безопасность */
  encrypt?: (plaintext: string) => string
  decrypt?: (ciphertext: string) => string
  maxSizeKb?: number
  /** Событие: успешное восстановление значения */
  onRestore?: (value: T) => void
  /** Событие: запись значения в сторадж */
  onPersist?: (value: T) => void
  /** Событие: очистка значения (clear) */
  onClear?: (initialValue: T) => void
  /** Событие: ошибка при восстановлении/валидации/десериализации/синхронизации/записи */
  onError?: (
    error: unknown,
    ctx: {
      phase:
        | 'deserialize'
        | 'validate'
        | 'migrate'
        | 'restore'
        | 'persist'
        | 'clear'
        | 'sync'
        | 'init'
        | 'encrypt'
        | 'decrypt'
        | 'limit'
    },
  ) => void
  namespace?: string | ((name: string) => string)
  sync?: 'storage' | 'broadcast' | false
  broadcastChannelName?: string
  version?: number
  migrations?: Record<number, (oldValue: any) => any>
  ttlMs?: number
  onExpire?: () => void
  serialize?: (value: T) => any
  deserialize?: (raw: any) => T
  validate?: (value: T) => boolean
}

export type PersistState<T> = SignalWritable<T> & Persist

export interface PersistedSignalAdapter extends Omit<SignalAdapter, 'state'> {
  state<T>(initial: T | (() => T), options: PersistOptions<T>): PersistState<T>
  computed<T>(fn: () => T, options?: PersistComputedOptions<T>): SignalComputed<T>
}

export type StorageKind = 'local' | 'session' | 'idb'

export type CreatePersistedAdapterOptions = {
  storage?: StorageKind | PersistAdapter
}

export type PersistStateOptions<T> = PersistOptions<T> & {
  storage?: StorageKind | PersistAdapter
}

export type ListOptions = {
  storage?: StorageKind | PersistAdapter
  namespace?: string
  /** Диагностика: включить логи для операций со списками ключей */
  debug?: boolean | {logger?: (message: string, context: any) => void}
}

export type PersistComputedOptions<T> = ComputedOptions & {
  /** Включить кэш для computed в сторадже (по умолчанию выключен) */
  persist?: boolean
  /** Имя ключа для кэша */
  name?: string
  /** TTL для кэшированного значения */
  ttlMs?: number
  /** Необязательный namespace для ключа */
  namespace?: string | ((name: string) => string)
  /** Диагностика */
  debug?: boolean | {logger?: (message: string, context: any) => void}
  /** Сериализация/десериализация и валидация значения */
  serialize?: (value: T) => any
  deserialize?: (raw: any) => T
  validate?: (value: T) => boolean
  /** Хранилище для кэша */
  storage?: StorageKind | PersistAdapter
}
