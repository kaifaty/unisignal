/* eslint-disable @typescript-eslint/no-unused-vars */
import type {Lang} from './consts'

export interface ITranslationStorage {
  [key: string]: string | ITranslationStorage
}
export interface TValues {
  [key: string]: string | number | TValues
}

export interface IReplacers {
  [key: string]: (key: string) => string
}

type TranslationUnit = Partial<{[key in Lang]: string}>

export type ParseString<T extends string | undefined> = T extends undefined
  ? never
  : T extends `${infer _}\$\{${infer variable}}${infer E}`
  ? variable | ParseString<E>
  : T extends `${infer _}\$\{${infer variable}}`
  ? variable
  : T extends `\$\{${infer variable}}`
  ? variable
  : never

type ReplaceString<
  T extends {[key in string]: string | number},
  Key extends string,
> = Key extends `${infer B}\$\{${infer val}}${infer E}`
  ? val extends keyof T
    ? ReplaceString<T, `${B}${T[val]}${E}`>
    : ReplaceString<T, `${B}\$\{${val}}${E}`>
  : Key

export type TransStore = Readonly<{
  [key in string]: Readonly<TranslationUnit>
}>

export type PickValues<
  T extends TransStore,
  K extends keyof T,
  L extends Lang,
  Res = {
    [key in ParseString<T[K][L]>]: string | number
  },
> = {
  [key in ParseString<T[K][L]>]: string | number
}

export type I18nResult<
  T extends TransStore,
  K extends keyof T,
  L extends Lang,
  Vals extends PickValues<T, K, L> | undefined = undefined,
> = T[K][L] extends string ? (Vals extends PickValues<T, K, L> ? ReplaceString<Vals, T[K][L]> : T[K][L]) : K
// Lang type is sourced from consts.ts
