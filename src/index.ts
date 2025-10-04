import { useEffect, useState, useRef, useMemo } from 'react'

// Transform-aware measurement utilities
type RectLike = Pick<DOMRectReadOnly, 'x' | 'y' | 'width' | 'height' | 'top' | 'left' | 'right' | 'bottom'>

function readClientRect(el: Element): DOMRectReadOnly {
  return el.getBoundingClientRect()
}

function rectEquals(a: RectLike, b: RectLike, eps = 0.01): boolean {
  return (
    Math.abs(a.x - b.x) < eps &&
    Math.abs(a.y - b.y) < eps &&
    Math.abs(a.width - b.width) < eps &&
    Math.abs(a.height - b.height) < eps &&
    Math.abs(a.top - b.top) < eps &&
    Math.abs(a.left - b.left) < eps &&
    Math.abs(a.right - b.right) < eps &&
    Math.abs(a.bottom - b.bottom) < eps
  )
}

function createDebounce<T extends (...args: any[]) => void>(callback: T, ms: number) {
  let timeoutId: number

  return (...args: Parameters<T>): void => {
    window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => callback(...args), ms)
  }
}

declare type ResizeObserverCallback = (entries: any[], observer: ResizeObserver) => void
declare class ResizeObserver {
  constructor(callback: ResizeObserverCallback)
  observe(target: Element, options?: any): void
  unobserve(target: Element): void
  disconnect(): void
  static toString(): string
}

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

type HTMLOrSVGElement = HTMLElement | SVGElement

type Result = [(element: HTMLOrSVGElement | null) => void, RectReadOnly, () => void]

type State = {
  element: HTMLOrSVGElement | null
  scrollContainers: HTMLOrSVGElement[] | null
  resizeObserver: ResizeObserver | null
  lastBounds: RectReadOnly
  orientationHandler: null | (() => void)
}

export type Options = {
  debounce?: number | { scroll: number; resize: number }
  scroll?: boolean
  polyfill?: { new (cb: ResizeObserverCallback): ResizeObserver }
  offsetSize?: boolean
  includeTransforms?: boolean
}

function useMeasure(
  { debounce, scroll, polyfill, offsetSize, includeTransforms }: Options = { debounce: 0, scroll: false, offsetSize: false, includeTransforms: false },
): Result {
  const ResizeObserver =
    polyfill || (typeof window === 'undefined' ? class ResizeObserver {} : (window as any).ResizeObserver)

  if (!ResizeObserver) {
    throw new Error(
      'This browser does not support ResizeObserver out of the box. See: https://github.com/react-spring/react-use-measure/#resize-observer-polyfills',
    )
  }

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

  // keep all state in a ref
  const state = useRef<State>({
    element: null,
    scrollContainers: null,
    resizeObserver: null,
    lastBounds: bounds,
    orientationHandler: null,
  })

  // transform-aware measurement state
  const rafState = useRef<{
    rafId: number | null
    visibilityHandler: (() => void) | null
    scrollOrResizeHandler: (() => void) | null
    prevRect: RectLike | null
  }>({
    rafId: null,
    visibilityHandler: null,
    scrollOrResizeHandler: null,
    prevRect: null,
  })

  // set actual debounce values early, so effects know if they should react accordingly
  const scrollDebounce = debounce ? (typeof debounce === 'number' ? debounce : debounce.scroll) : null
  const resizeDebounce = debounce ? (typeof debounce === 'number' ? debounce : debounce.resize) : null

  // Transform-aware measurement function
  const updateTransformAwareBounds = () => {
    if (!state.current.element) return
    
    const rect = readClientRect(state.current.element)
    const newBounds = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
      x: rect.x,
      y: rect.y,
    }
    
    Object.freeze(newBounds)
    
    if (mounted.current && !rectEquals(rafState.current.prevRect || newBounds, newBounds)) {
      rafState.current.prevRect = newBounds
      state.current.lastBounds = newBounds
      set(newBounds)
    }
  }

  // make sure to update state only as long as the component is truly mounted
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => void (mounted.current = false)
  })

  // memoize handlers, so event-listeners know when they should update
  const [forceRefresh, resizeChange, scrollChange] = useMemo(() => {
    const callback = () => {
      if (!state.current.element) return
      
      if (includeTransforms) {
        updateTransformAwareBounds()
        return
      }
      
      const { left, top, width, height, bottom, right, x, y } =
        state.current.element.getBoundingClientRect() as unknown as RectReadOnly

      const size = {
        left,
        top,
        width,
        height,
        bottom,
        right,
        x,
        y,
      }

      if (state.current.element instanceof HTMLElement && offsetSize) {
        size.height = state.current.element.offsetHeight
        size.width = state.current.element.offsetWidth
      }

      Object.freeze(size)
      if (mounted.current && !areBoundsEqual(state.current.lastBounds, size)) set((state.current.lastBounds = size))
    }
    return [
      callback,
      resizeDebounce ? createDebounce(callback, resizeDebounce) : callback,
      scrollDebounce ? createDebounce(callback, scrollDebounce) : callback,
    ]
  }, [set, offsetSize, scrollDebounce, resizeDebounce, includeTransforms])

  // Transform-aware measurement management
  function startTransformAwareMeasurement() {
    if (!includeTransforms || !state.current.element || rafState.current.rafId) return

    // Initial measurement
    updateTransformAwareBounds()

    // rAF loop for continuous monitoring
    function tick() {
      updateTransformAwareBounds()
      rafState.current.rafId = requestAnimationFrame(tick)
    }

    // Visibility change handler
    rafState.current.visibilityHandler = () => {
      if (document.hidden) {
        if (rafState.current.rafId) {
          cancelAnimationFrame(rafState.current.rafId)
          rafState.current.rafId = null
        }
      } else if (!rafState.current.rafId) {
        rafState.current.rafId = requestAnimationFrame(tick)
      }
    }

    // Scroll/resize handler for immediate updates
    rafState.current.scrollOrResizeHandler = () => {
      updateTransformAwareBounds()
    }

    // Start the rAF loop
    rafState.current.rafId = requestAnimationFrame(tick)

    // Add event listeners
    document.addEventListener('visibilitychange', rafState.current.visibilityHandler, true)
    window.addEventListener('scroll', rafState.current.scrollOrResizeHandler, true)
    window.addEventListener('resize', rafState.current.scrollOrResizeHandler, true)
  }

  function stopTransformAwareMeasurement() {
    if (rafState.current.rafId) {
      cancelAnimationFrame(rafState.current.rafId)
      rafState.current.rafId = null
    }

    if (rafState.current.visibilityHandler) {
      document.removeEventListener('visibilitychange', rafState.current.visibilityHandler, true)
      rafState.current.visibilityHandler = null
    }

    if (rafState.current.scrollOrResizeHandler) {
      window.removeEventListener('scroll', rafState.current.scrollOrResizeHandler, true)
      window.removeEventListener('resize', rafState.current.scrollOrResizeHandler, true)
      rafState.current.scrollOrResizeHandler = null
    }

    rafState.current.prevRect = null
  }

  // cleanup current scroll-listeners / observers
  function removeListeners() {
    // Stop transform-aware measurement
    stopTransformAwareMeasurement()

    if (state.current.scrollContainers) {
      state.current.scrollContainers.forEach((element) => element.removeEventListener('scroll', scrollChange, true))
      state.current.scrollContainers = null
    }

    if (state.current.resizeObserver) {
      state.current.resizeObserver.disconnect()
      state.current.resizeObserver = null
    }

    if (state.current.orientationHandler) {
      if ('orientation' in screen && 'removeEventListener' in screen.orientation) {
        screen.orientation.removeEventListener('change', state.current.orientationHandler)
      } else if ('onorientationchange' in window) {
        window.removeEventListener('orientationchange', state.current.orientationHandler)
      }
    }
  }

  // add scroll-listeners / observers
  function addListeners() {
    if (!state.current.element) return

    if (includeTransforms) {
      // Use transform-aware measurement instead of ResizeObserver
      startTransformAwareMeasurement()
    } else {
      // Use traditional ResizeObserver
      state.current.resizeObserver = new ResizeObserver(scrollChange)
      state.current.resizeObserver!.observe(state.current.element)
    }

    if (scroll && state.current.scrollContainers) {
      state.current.scrollContainers.forEach((scrollContainer) =>
        scrollContainer.addEventListener('scroll', scrollChange, { capture: true, passive: true }),
      )
    }

    // Handle orientation changes
    state.current.orientationHandler = () => {
      scrollChange()
    }

    // Use screen.orientation if available
    if ('orientation' in screen && 'addEventListener' in screen.orientation) {
      screen.orientation.addEventListener('change', state.current.orientationHandler)
    } else if ('onorientationchange' in window) {
      // Fallback to orientationchange event
      window.addEventListener('orientationchange', state.current.orientationHandler)
    }
  }

  // the ref we expose to the user
  const ref = (node: HTMLOrSVGElement | null) => {
    if (!node || node === state.current.element) return
    removeListeners()
    state.current.element = node
    state.current.scrollContainers = findScrollContainers(node)
    addListeners()
  }

  // add general event listeners
  useOnWindowScroll(scrollChange, Boolean(scroll))
  useOnWindowResize(resizeChange)

  // respond to changes that are relevant for the listeners
  useEffect(() => {
    removeListeners()
    addListeners()
  }, [scroll, scrollChange, resizeChange, includeTransforms])

  // remove all listeners when the components unmounts
  useEffect(() => removeListeners, [])
  return [ref, bounds, forceRefresh]
}

// Adds native resize listener to window
function useOnWindowResize(onWindowResize: (event: Event) => void) {
  useEffect(() => {
    const cb = onWindowResize
    window.addEventListener('resize', cb)
    return () => void window.removeEventListener('resize', cb)
  }, [onWindowResize])
}
function useOnWindowScroll(onScroll: () => void, enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      const cb = onScroll
      window.addEventListener('scroll', cb, { capture: true, passive: true })
      return () => void window.removeEventListener('scroll', cb, true)
    }
  }, [onScroll, enabled])
}

// Returns a list of scroll offsets
function findScrollContainers(element: HTMLOrSVGElement | null): HTMLOrSVGElement[] {
  const result: HTMLOrSVGElement[] = []
  if (!element || element === document.body) return result
  const { overflow, overflowX, overflowY } = window.getComputedStyle(element)
  if ([overflow, overflowX, overflowY].some((prop) => prop === 'auto' || prop === 'scroll')) result.push(element)
  return [...result, ...findScrollContainers(element.parentElement)]
}

// Checks if element boundaries are equal
const keys: (keyof RectReadOnly)[] = ['x', 'y', 'top', 'bottom', 'left', 'right', 'width', 'height']
const areBoundsEqual = (a: RectReadOnly, b: RectReadOnly): boolean => keys.every((key) => a[key] === b[key])

export default useMeasure
