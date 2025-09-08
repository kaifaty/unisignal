/**
 * Любая функция с произвольными аргументами и возвращаемым значением.
 */
export type AnyFunc = (...args: any[]) => any
type Promises<T> = (value: PromiseLike<T>) => void

/**
 * Аггрегирующий throttle: все вызовы внутри окна `time` объединяются, и функция `f`
 * вызывается ровно один раз — с последними аргументами. Все ожидающие промисы
 * резолвятся к одному и тому же результату.
 *
 * Особый случай: при `time <= 0` вызов происходит немедленно, результат оборачивается в `Promise.resolve`.
 */
export const throttle = <F extends AnyFunc>(
  f: F,
  time: number,
): ((...args: Parameters<F>) => Promise<ReturnType<F>>) => {
  // Для time <= 0 выполняем вызов немедленно без таймера
  if (time <= 0) {
    return ((...args: Parameters<F>) => Promise.resolve(f(...(args as unknown as Parameters<F>)))) as (
      ...args: Parameters<F>
    ) => Promise<ReturnType<F>>
  }
  let timer: NodeJS.Timeout | number = 0
  let lastArgs: any
  const promises: Promises<ReturnType<F>>[] = []

  return (...args: any[]) => {
    return new Promise<ReturnType<F>>((resolve) => {
      lastArgs = args
      promises.push(resolve)
      if (timer) return
      timer = setTimeout(() => {
        const result = f(...(lastArgs as Parameters<F>))
        // resolve all waiters with the same result
        for (const r of promises.splice(0, promises.length)) r(result as any)
        timer = 0
      }, time)
    })
  }
}
