import { useRef, useEffect, useState } from 'react'

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

declare var ResizeObserver: {
  prototype: ResizeObserver
  new (callback: ResizeObserverCallback): ResizeObserver
}

interface ResizeObserver {
  observe(target: Element): void
  unobserve(target: Element): void
  disconnect(): void
}

type Measure = [React.MutableRefObject<HTMLDivElement | null>, RectReadOnly]

export default function useMeasure(): Measure {
  const ref = useRef<HTMLDivElement>(null)
  const [bounds, set] = useState<RectReadOnly>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
  })
  const [ro] = useState(
    () =>
      new ResizeObserver(() => {
        if (!ref.current) return
        const { pageXOffset, pageYOffset } = window
        const { left, top, width, height, bottom, right, x, y } = ref.current.getBoundingClientRect() as RectReadOnly
        const size = { left, top, width, height, bottom, right, x, y }
        size.top += pageYOffset
        size.bottom += pageYOffset
        size.y += pageYOffset
        size.left += pageXOffset
        size.right += pageXOffset
        size.x += pageXOffset
        Object.freeze(size)
        return set(size)
      })
  )
  useEffect(() => {
    if (ref.current) ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, bounds]
}
