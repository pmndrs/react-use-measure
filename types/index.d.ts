/// <reference types="react" />
export interface RectReadOnly {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}
declare global {
  interface ResizeObserverCallback {
    (entries: ResizeObserverEntry[], observer: ResizeObserver): void
  }
  interface ResizeObserverEntry {
    readonly target: Element
    readonly contentRect: DOMRectReadOnly
  }
  interface ResizeObserver {
    observe(target: Element): void
    unobserve(target: Element): void
    disconnect(): void
  }
}
declare type Measure = [React.MutableRefObject<HTMLDivElement | null>, RectReadOnly]
export default function useMeasure(): Measure
export {}
