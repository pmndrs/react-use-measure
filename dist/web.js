import { useRef, useState, useEffect } from 'react'

function useMeasure() {
  const ref = useRef(null)
  const [bounds, set] = useState({
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
        const { left, top, width, height, bottom, right, x, y } = ref.current.getBoundingClientRect()
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

export default useMeasure
