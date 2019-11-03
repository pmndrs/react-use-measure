import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { debounce as createDebounce } from 'debounce'
import ResizeObserver from 'resize-observer-polyfill'

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

type Ref = (element: HTMLElement | null) => void
type Result = [Ref, RectReadOnly]

type ElementState = {
  element: HTMLElement | null
  scrollContainers: HTMLElement[] | null
}

type Options = { debounce?: number }

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
    { element: null, scrollContainers: null },
    element => ({ element, scrollContainers: findScrollContainers(element) })
  )

  const handleBoundsChange = useMemo(() => {
    const callback = () => {
      if (!element) return
      const size = element.getBoundingClientRect() as RectReadOnly
      Object.freeze(size)
      if (!areBoundsEqual(lastBounds.current, size)) set((lastBounds.current = size))
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

// Lets you reference an element and stores state based off that same element
function useElementState<T>(initialState: T, elementToState: (element: HTMLElement) => T) {
  const [state, setState] = useState<T>(initialState)
  const lastElement = useRef<HTMLElement | null>(null)
  const ref = useCallback(
    // did the reference change?
    node => node && node !== lastElement.current && setState(elementToState((lastElement.current = node))),
    [initialState]
  )
  return [ref, state] as [(node: HTMLElement | null) => void, T]
}

// Adds native scroll listeners to a list of elements
function useOnScroll(scrollContainers: HTMLElement[] | null, onScroll: (event: Event) => void) {
  useEffect(() => {
    if (!scrollContainers) return
    const cb = onScroll
    const elements = [window, ...scrollContainers]
    elements.forEach(element => element.addEventListener('scroll', cb))
    return () => elements.forEach(element => element.removeEventListener('scroll', cb))
  }, [onScroll, scrollContainers])
}

// Returns a list of scroll offsets
function findScrollContainers(element: HTMLElement | null): HTMLElement[] {
  const result: HTMLElement[] = []
  if (!element || element === document.body) return result
  const { overflow, overflowX, overflowY } = window.getComputedStyle(element)
  if ([overflow, overflowX, overflowY].some(prop => prop === 'auto' || prop === 'scroll')) result.push(element)
  return [...result, ...findScrollContainers(element.parentElement)]
}

// Checks if element boundaries are equal
const keys: (keyof RectReadOnly)[] = ['x', 'y', 'top', 'bottom', 'left', 'right', 'width', 'height']
function areBoundsEqual(a: RectReadOnly, b: RectReadOnly): boolean {
  return keys.every(key => a[key] === b[key])
}

export default useMeasure
