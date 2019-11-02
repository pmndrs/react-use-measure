import { useEffect, useState, useRef, useMemo } from 'react'
import { debounce as createDebounce } from 'debounce'
import findScrollContainers from './findScrollContainers'
import useElementState from './useElementState'
import useOnScroll from './useOnScroll'
import areBoundsEqual from './areBoundsEqual'

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

type Ref = (element: HTMLElement | null) => void
type Result = [Ref, RectReadOnly]

type ElementState = {
  element: HTMLElement | null
  scrollContainers: HTMLElement[] | null
}

type Options = {
  debounce?: number
}

function useMeasure({ debounce }: Options = { debounce: 0 }): Result {
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

  const lastBounds = useRef(bounds)

  const [ref, { element, scrollContainers }] = useElementState<ElementState>(
    {
      element: null,
      scrollContainers: null,
    },
    element => ({
      element,
      scrollContainers: findScrollContainers(element),
    })
  )

  const handleBoundsChange = useMemo(() => {
    const callback = () => {
      if (!element) {
        return
      }
      const { left, top, width, height, bottom, right, x, y } = element.getBoundingClientRect() as RectReadOnly
      const size = { left, top, width, height, bottom, right, x, y }
      Object.freeze(size)

      if (!areBoundsEqual(lastBounds.current, size)) {
        lastBounds.current = size
        set(size)
      }
    }

    return debounce ? createDebounce(callback, debounce) : callback
  }, [element, set, debounce])

  useOnScroll(scrollContainers, handleBoundsChange)

  useEffect(() => {
    const ro = new ResizeObserver(handleBoundsChange)

    if (element) ro.observe(element)
    return () => ro.disconnect()
  }, [element])

  return [ref, bounds]
}

export default useMeasure
