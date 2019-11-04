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
  [key: string]: number
}

type Result = [(element: HTMLElement | null) => void, RectReadOnly]

type ElementState = {
  element: HTMLElement | null
  scrollContainers: HTMLElement[] | null
}

type Options = {
  debounce?: number | { scroll: number; resize: number }
  scroll?: boolean
}

function useMeasure({ debounce, scroll }: Options = { debounce: 0, scroll: false }): Result {
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

  let [ref, state] = useElementState<ElementState>({ element: null, scrollContainers: null }, element => ({
    element,
    scrollContainers: findScrollContainers(element),
  }))

  const [resizeChange, scrollChange] = useMemo(() => {
    const callback = () => {
      if (!state.current.element) return
      const {
        left,
        top,
        width,
        height,
        bottom,
        right,
        x,
        y,
      } = state.current.element.getBoundingClientRect() as RectReadOnly
      const size = { left, top, width, height, bottom, right, x, y }
      Object.freeze(size)
      if (!areBoundsEqual(lastBounds.current, size)) set((lastBounds.current = size))
    }
    return [
      debounce ? createDebounce(callback, typeof debounce === 'number' ? debounce : debounce.resize) : callback,
      debounce ? createDebounce(callback, typeof debounce === 'number' ? debounce : debounce.scroll) : callback,
    ]
  }, [set, debounce])

  useOnScroll(scroll ? state.current.scrollContainers : null, scrollChange)
  useOnWindowResize(resizeChange)
  useEffect(() => {
    const ro = new ResizeObserver(resizeChange)
    if (state.current.element) ro.observe(state.current.element)
    return () => ro.disconnect()
  }, [state.current.element, resizeChange])

  return [ref, bounds]
}

// Lets you reference an element and stores state based off that same element
function useElementState<T>(initialState: T, elementToState: (element: HTMLElement) => T) {
  const state = useRef<T>(initialState)
  const lastElement = useRef<HTMLElement | null>(null)
  const ref = useCallback(
    // did the reference change?
    node => node && node !== lastElement.current && (state.current = elementToState((lastElement.current = node))),
    [elementToState]
  )
  return [ref, state] as [(node: HTMLElement | null) => void, React.MutableRefObject<T>]
}

// Adds native scroll listeners to a list of elements
function useOnScroll(scrollContainers: HTMLElement[] | null, onScroll: (event: Event) => void) {
  useEffect(() => {
    if (!scrollContainers) return
    const cb = onScroll
    const elements = [window, ...scrollContainers]
    elements.forEach(element => element.addEventListener('scroll', cb, { capture: true, passive: true }))
    return () => elements.forEach(element => element.removeEventListener('scroll', cb, true))
  }, [onScroll, scrollContainers])
}

// Adds native resize listener to window
function useOnWindowResize(onWindowResize: (event: Event) => void) {
  useEffect(() => {
    const cb = onWindowResize
    window.addEventListener('resize', cb)
    return () => window.removeEventListener('resize', cb)
  }, [onWindowResize])
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
const areBoundsEqual = (a: RectReadOnly, b: RectReadOnly): boolean => keys.every(key => a[key] === b[key])

export default useMeasure
