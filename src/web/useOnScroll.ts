import { useEffect } from 'react'

export default function useOnScroll(scrollContainers: HTMLElement[] | null, onScroll: (event: Event) => void) {
  useEffect(() => {
    if (!scrollContainers) {
      return
    }

    const cb = onScroll

    const elements = [window, ...scrollContainers]

    elements.forEach(element => {
      element.addEventListener('scroll', cb)
    })

    return () => {
      elements.forEach(element => {
        element.removeEventListener('scroll', cb)
      })
    }
  }, [onScroll, scrollContainers])
}
