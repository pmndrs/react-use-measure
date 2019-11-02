import { useState, useRef, useCallback } from 'react'

/**
 * Hook which let you reference an element and stores state
 * based off that same element
 * See: https://reactjs.org/docs/hooks-faq.html#how-can-i-measure-a-dom-node
 */
export default function useElementState<T>(initialState: T, elementToState: (element: HTMLElement) => T) {
  const [state, setState] = useState<T>(initialState)

  const lastElement = useRef<HTMLElement | null>(null)

  const ref = useCallback(
    node => {
      // did the reference change?
      if (node && node !== lastElement.current) {
        lastElement.current = node
        setState(elementToState(node))
        return
      }
    },
    [initialState]
  )

  return [ref, state] as [(node: HTMLElement | null) => void, T]
}
